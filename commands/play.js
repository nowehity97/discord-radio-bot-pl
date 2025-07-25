const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, entersState, VoiceConnectionStatus, AudioPlayerStatus } = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Odtwarza radio z podanego linku URL.')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('Adres URL strumienia radiowego (np. .mp3, .ogg, .aac)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('nazwa')
                .setDescription('Nazwa wyświetlana dla tego strumienia (opcjonalnie)')
                .setRequired(false)),

    async execute(interaction, client, players) { // Dodajemy 'players' jako argument
        await interaction.deferReply();

        const { guild, member } = interaction;
        const url = interaction.options.getString('url');
        const customName = interaction.options.getString('nazwa') || 'Niestandardowy Strumień';

        if (!member.voice.channel) {
            return interaction.editReply({ content: '🔇 Musisz być na kanale głosowym, aby odtwarzać!', ephemeral: true });
        }

        try {
            if (players.has(guild.id)) {
                const oldPlayer = players.get(guild.id);
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
            const resource = createAudioResource(url, {
                metadata: { title: customName },
                inlineVolume: true
            });

            resource.volume.setVolume(0.5);

            player.play(resource);
            connection.subscribe(player);

            client.user.setActivity(customName, { type: 'LISTENING' });

            const embed = new EmbedBuilder()
                .setTitle(`🎵 Odtwarzam: ${customName}`)
                .setDescription(`**URL Strumienia:** ${url}`)
                .setColor('#FF5733')
                .setFooter({ text: `Włączone przez: ${member.user.username}` });

            await interaction.editReply({ embeds: [embed] });

            players.set(guild.id, {
                player,
                connection,
                station: { name: customName, stream_url: url, metadata_url: null },
                lastUser: member.id,
                textChannel: interaction.channel,
                resource: resource
            });

            player.on('error', error => {
                console.error(`Błąd odtwarzania niestandardowego strumienia na serwerze ${guild.id}: ${error.message}`);
                const playerData = players.get(guild.id);
                if (playerData) {
                    playerData.connection.destroy();
                    players.delete(guild.id);
                    if (playerData.textChannel) {
                        playerData.textChannel.send(`❌ Błąd odtwarzania strumienia **${customName}**! Rozłączam...`);
                    }
                    client.user.setActivity('');
                }
            });

            player.on(AudioPlayerStatus.Idle, () => {
                const voiceChannel = member.voice.channel;
                if (voiceChannel && voiceChannel.members.size === 1) {
                    connection.destroy();
                    players.delete(guild.id);
                    if (interaction.channel) {
                        interaction.channel.send('🔌 Rozłączono z powodu pustego kanału.');
                    }
                    client.user.setActivity('');
                }
            });

        } catch (error) {
            console.error('Błąd połączenia głosowego lub odtwarzania niestandardowego strumienia:', error);
            interaction.editReply({ content: '❌ Nie udało się połączyć z kanałem głosowym lub wystąpił błąd odtwarzania podanego linku! Upewnij się, że to bezpośredni link do strumienia (np. .mp3, .ogg).' });
        }
    },
};