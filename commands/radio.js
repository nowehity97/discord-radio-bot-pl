const { SlashCommandBuilder, EmbedBuilder, ActivityType } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, entersState, VoiceConnectionStatus, AudioPlayerStatus } = require('@discordjs/voice');
const db = require('../db'); // Ścieżka do pliku db.js
const { getRadioMetadata } = require('../utils/radioMetadata'); // Import funkcji

module.exports = {
    data: new SlashCommandBuilder()
        .setName('radio')
        .setDescription('Odtwarza wybraną stację radiową.')
        .addStringOption(option =>
            option.setName('stacja')
                .setDescription('Nazwa stacji radiowej')
                .setRequired(true)
                .setAutocomplete(true)),

    autocompleteCommands: ['radio'],

    async execute(interaction, client, players) {
        await interaction.deferReply();

        const { guild, member } = interaction;
        const stationName = interaction.options.getString('stacja');

        if (!member.voice.channel) {
            return interaction.editReply({ content: '🔇 Musisz być na kanale głosowym, aby odtwarzać radio!', ephemeral: true });
        }

        db.get('SELECT * FROM stations WHERE name = ?', [stationName], async (err, station) => {
            if (err) {
                console.error('Błąd bazy danych dla /radio:', err);
                return interaction.editReply({ content: '❌ Wystąpił błąd podczas pobierania danych stacji.' });
            }
            if (!station) {
                return interaction.editReply({ content: '❌ Nie znaleziono stacji o takiej nazwie!' });
            }

            try {
                if (players.has(guild.id)) {
                    const oldPlayer = players.get(guild.id);
                    if (oldPlayer.metadataUpdateInterval) {
                        clearInterval(oldPlayer.metadataUpdateInterval);
                    }
                    oldPlayer.player.stop();
                    oldPlayer.connection.destroy();
                    players.delete(guild.id);
                }

                const connection = joinVoiceChannel({
                    channelId: member.voice.channel.id,
                    guildId: guild.id,
                    adapterCreator: guild.voiceAdapterCreator,
                });

                await entersState(connection, VoiceConnectionStatus.Ready, 15_000);

                const player = createAudioPlayer();
                const resource = createAudioResource(station.stream_url, {
                    metadata: { title: station.name },
                    inlineVolume: true
                });

                resource.volume.setVolume(0.5);

                player.play(resource);
                connection.subscribe(player);

                // --- Początkowe pobranie metadanych (nadal potrzebne dla embeda) ---
                let nowPlaying = 'Ładowanie...';
                if (station.metadata_url) {
                    const metadata = await getRadioMetadata(station.metadata_url);
                    nowPlaying = metadata.title || 'Brak informacji';
                }
                // -------------------------------------------------------------------

                // --- Ustaw status bota na nazwę stacji ---
                client.user.setActivity(station.name, { type: ActivityType.Listening });
                // ------------------------------------------

                const embed = new EmbedBuilder()
                    .setTitle(`🎵 Odtwarzam: ${station.name}`)
                    .setDescription(`**Aktualny utwór:** ${nowPlaying}`)
                    .setColor('#2196F3')
                    .setFooter({ text: `Włączone przez: ${member.user.username}` });

                await interaction.editReply({ embeds: [embed] });

                const playerData = {
                    player,
                    connection,
                    station,
                    lastUser: member.id,
                    textChannel: interaction.channel,
                    resource: resource,
                    currentSongTitle: nowPlaying,
                    metadataUpdateInterval: null
                };
                players.set(guild.id, playerData);

                // --- Ustawienie regularnej aktualizacji metadanych ---
                if (station.metadata_url) {
                    playerData.metadataUpdateInterval = setInterval(async () => {
                        if (players.has(guild.id)) {
                            const currentPlayerData = players.get(guild.id);
                            const newMetadata = await getRadioMetadata(currentPlayerData.station.metadata_url);
                            const newTitle = newMetadata.title || 'Brak informacji';

                            if (newTitle !== currentPlayerData.currentSongTitle) {
                                currentPlayerData.currentSongTitle = newTitle;
                                // NIE ZMIENIAMY STATUSU BOTA TUTAJ, TYLKO AKTUALIZUJEMY currentSongTitle
                                // client.user.setActivity(newTitle, { type: ActivityType.Listening }); // USUNIĘTE
                            }
                        } else {
                            clearInterval(playerData.metadataUpdateInterval);
                        }
                    }, 15000);
                }
                // ----------------------------------------------------

                player.on('error', error => {
                    console.error(`Błąd odtwarzania na serwerze ${guild.id}: ${error.message}`);
                    const playerData = players.get(guild.id);
                    if (playerData) {
                        if (playerData.metadataUpdateInterval) {
                            clearInterval(playerData.metadataUpdateInterval);
                        }
                        playerData.connection.destroy();
                        players.delete(guild.id);
                        if (playerData.textChannel) {
                            playerData.textChannel.send(`❌ Błąd odtwarzania stacji **${station.name}**! Rozłączam...`);
                        }
                        client.user.setActivity('');
                    }
                });

                player.on(AudioPlayerStatus.Idle, () => {
                    const voiceChannel = member.voice.channel;
                    if (voiceChannel && voiceChannel.members.size === 1 && players.has(guild.id)) {
                        const playerData = players.get(guild.id);
                        if (playerData.metadataUpdateInterval) {
                            clearInterval(playerData.metadataUpdateInterval);
                        }
                        playerData.connection.destroy();
                        players.delete(guild.id);
                        if (interaction.channel) {
                            interaction.channel.send('🔌 Rozłączono z powodu pustego kanału.');
                        }
                        client.user.setActivity('');
                    } else if (players.has(guild.id) && player.state.status === AudioPlayerStatus.Idle) {
                        const playerData = players.get(guild.id);
                        if (playerData.metadataUpdateInterval) {
                            clearInterval(playerData.metadataUpdateInterval);
                        }
                        playerData.connection.destroy();
                        players.delete(guild.id);
                        playerData.textChannel.send(`⚠️ Strumień dla **${station.name}** został zatrzymany. Spróbuj włączyć ponownie.`);
                        client.user.setActivity('');
                    }
                });

                connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
                    if (players.has(guild.id)) {
                        const playerData = players.get(guild.id);
                        if (playerData.metadataUpdateInterval) {
                            clearInterval(playerData.metadataUpdateInterval);
                        }
                        playerData.connection.destroy();
                        players.delete(guild.id);
                        client.user.setActivity('');
                        if (playerData.textChannel) {
                            playerData.textChannel.send('❌ Bot został rozłączony z kanału głosowego.');
                        }
                    }
                });

            } catch (error) {
                console.error('Błąd połączenia głosowego lub odtwarzania dla /radio:', error);
                if (players.has(guild.id)) {
                    const playerData = players.get(guild.id);
                    if (playerData.metadataUpdateInterval) {
                        clearInterval(playerData.metadataUpdateInterval);
                    }
                    playerData.connection.destroy();
                    players.delete(guild.id);
                }
                interaction.editReply({ content: '❌ Nie udało się połączyć z kanałem głosowym lub wystąpił błąd odtwarzania!' });
            }
        });
    },
};