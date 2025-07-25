const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js'); // Dodano MessageFlags
const db = require('../db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('preset')
        .setDescription('Zarządzaj swoimi ulubionymi presetami stacji radiowych.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('save')
                .setDescription('Zapisuje listę stacji jako preset.')
                .addStringOption(option =>
                    option.setName('nazwa')
                        .setDescription('Nazwa presetu (np. "Moje hity", "Relaks")')
                        .setRequired(true))
                .addStringOption(option => // Umożliwia dodanie do 3 stacji, możesz zwiększyć
                    option.setName('stacja1')
                        .setDescription('Pierwsza stacja w presecie')
                        .setRequired(true)
                        .setAutocomplete(true))
                .addStringOption(option =>
                    option.setName('stacja2')
                        .setDescription('Druga stacja w presecie (opcjonalnie)')
                        .setRequired(false)
                        .setAutocomplete(true))
                .addStringOption(option =>
                    option.setName('stacja3')
                        .setDescription('Trzecia stacja w presecie (opcjonalnie)')
                        .setRequired(false)
                        .setAutocomplete(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('load')
                .setDescription('Wczytuje stację(e) z zapisanego presetu.')
                .addStringOption(option =>
                    option.setName('nazwa')
                        .setDescription('Nazwa presetu do wczytania')
                        .setRequired(true)
                        .setAutocomplete(true)) // Autouzupełnianie dla nazw presetów
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Wyświetla listę Twoich zapisanych presetów.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Usuwa zapisany preset.')
                .addStringOption(option =>
                    option.setName('nazwa')
                        .setDescription('Nazwa presetu do usunięcia')
                        .setRequired(true)
                        .setAutocomplete(true)) // Autouzupełnianie dla nazw presetów
        ),
    
    // Lista komend wymagających autouzupełniania dla globalnego obsługiwania
    autocompleteCommands: ['preset'], // Ważne dla interactionCreate.js

    async execute(interaction, client, players) {
        const userId = interaction.user.id;
        const subCommand = interaction.options.getSubcommand();
        await interaction.deferReply({ flags: MessageFlags.Ephemeral }); // Zmieniono na flags

        if (subCommand === 'save') {
            const presetName = interaction.options.getString('nazwa');
            const stationNames = [
                interaction.options.getString('stacja1'),
                interaction.options.getString('stacja2'),
                interaction.options.getString('stacja3')
            ].filter(Boolean); // Usuń null/undefined

            // Sprawdź, czy podane stacje istnieją w bazie
            const invalidStations = [];
            for (const name of stationNames) {
                const stationExists = await new Promise((resolve, reject) => {
                    db.get('SELECT name FROM stations WHERE name = ?', [name], (err, row) => {
                        if (err) return reject(err);
                        resolve(!!row);
                    });
                });
                if (!stationExists) {
                    invalidStations.push(name);
                }
            }

            if (invalidStations.length > 0) {
                return interaction.editReply({ content: `❌ Następujące stacje nie istnieją w bazie danych: ${invalidStations.join(', ')}. Popraw nazwy lub dodaj je najpierw.` });
            }

            db.run(
                'INSERT OR REPLACE INTO user_presets (user_id, preset_name, station_names) VALUES (?, ?, ?)',
                [userId, presetName, JSON.stringify(stationNames)],
                function (err) {
                    if (err) {
                        console.error('Błąd zapisu presetu:', err);
                        return interaction.editReply({ content: '❌ Wystąpił błąd podczas zapisywania presetu.' });
                    }
                    interaction.editReply({ content: `✅ Preset **${presetName}** został zapisany z ${stationNames.join(', ')}.` });
                }
            );
        } else if (subCommand === 'load') {
            const presetName = interaction.options.getString('nazwa');

            db.get('SELECT station_names FROM user_presets WHERE user_id = ? AND preset_name = ?', [userId, presetName], async (err, row) => {
                if (err) {
                    console.error('Błąd ładowania presetu:', err);
                    return interaction.editReply({ content: '❌ Wystąpił błąd podczas ładowania presetu.' });
                }
                if (!row) {
                    return interaction.editReply({ content: `❌ Nie znaleziono presetu o nazwie **${presetName}** dla Ciebie.` });
                }

                const stationNames = JSON.parse(row.station_names);
                if (stationNames.length === 0) {
                    return interaction.editReply({ content: `❌ Preset **${presetName}** nie zawiera żadnych stacji.` });
                }

                const voiceChannel = interaction.member.voice.channel;
                if (!voiceChannel) {
                    return interaction.editReply({ content: '🔇 Musisz być na kanale głosowym, aby wczytać preset i odtworzyć stację!' });
                }

                // Jeśli w presecie jest tylko jedna stacja, włącz ją od razu
                if (stationNames.length === 1) {
                    const firstStationName = stationNames[0];
                    const radioCommand = client.commands.get('radio'); // Pobierz komendę radio
                    if (radioCommand && radioCommand.execute) {
                        // Tworzenie "sztucznej" interakcji dla komendy radio
                        const fakeInteraction = {
                            options: {
                                getString: (optName) => {
                                    if (optName === 'stacja') return firstStationName;
                                    return null;
                                }
                            },
                            guild: interaction.guild,
                            member: interaction.member,
                            channel: interaction.channel,
                            deferReply: async () => {}, // mock deferReply
                            editReply: async (options) => { // mock editReply
                                await interaction.editReply({ content: `✅ Wczytano preset **${presetName}**! Bot próbuje włączyć stację: **${firstStationName}**\n\n${options.embeds ? options.embeds[0].description : ''}` });
                            },
                            user: interaction.user
                        };
                        try {
                            await radioCommand.execute(fakeInteraction, client, players);
                            // Odpowiedź została już edytowana w radio.execute
                        } catch (e) {
                            console.error('Błąd podczas próby włączenia stacji z presetu (pojedyncza):', e);
                            interaction.editReply({ content: `❌ Nie udało się włączyć stacji **${firstStationName}** z presetu: ${e.message}` });
                        }
                    } else {
                        console.error("Komenda 'radio' nie znaleziona. Nie można wczytać presetu (pojedyncza stacja).");
                        interaction.editReply({ content: `❌ Błąd wewnętrzny: Nie można włączyć stacji z presetu.` });
                    }
                } else {
                    // Jeśli w presecie jest wiele stacji, stwórz menu wyboru
                    // Użyj Set, aby usunąć duplikaty nazw stacji
                    const uniqueStationNames = [...new Set(stationNames)];

                    if (uniqueStationNames.length === 0) {
                        return interaction.editReply({ content: `❌ Preset **${presetName}** nie zawiera żadnych unikalnych stacji do wyboru.` });
                    }

                    const options = uniqueStationNames.map(name => ({
                        label: name,
                        value: name,
                    }));

                    const selectMenu = new StringSelectMenuBuilder()
                        .setCustomId(`preset_select_${userId}_${presetName}`) // Unikalne ID
                        .setPlaceholder('Wybierz stację z presetu...')
                        .addOptions(options);

                    const cancelButton = new ButtonBuilder()
                        .setCustomId(`preset_cancel_${userId}`)
                        .setLabel('Anuluj')
                        .setStyle(ButtonStyle.Danger);

                    const row = new ActionRowBuilder().addComponents(selectMenu);
                    const buttonRow = new ActionRowBuilder().addComponents(cancelButton);

                    await interaction.editReply({
                        content: `🎶 Preset **${presetName}** zawiera wiele stacji. Wybierz stację, którą chcesz włączyć:`,
                        components: [row, buttonRow]
                    });
                }
            });
        } else if (subCommand === 'list') {
            db.all('SELECT preset_name, station_names FROM user_presets WHERE user_id = ?', [userId], (err, rows) => {
                if (err) {
                    console.error('Błąd listowania presetów:', err);
                    return interaction.editReply({ content: '❌ Wystąpił błąd podczas pobierania Twoich presetów.' });
                }

                if (rows.length === 0) {
                    return interaction.editReply({ content: 'ℹ️ Nie masz jeszcze żadnych zapisanych presetów. Użyj `/preset save`, aby dodać pierwszy!' });
                }

                const embed = new EmbedBuilder()
                    .setTitle(`📖 Twoje Presety (${rows.length})`)
                    .setColor('#0099FF')
                    .setTimestamp()
                    .setFooter({ text: `Użyj /preset load <nazwa> aby włączyć.` });

                let description = '';
                rows.forEach((row, index) => {
                    const stations = JSON.parse(row.station_names).join(', ');
                    description += `**${index + 1}. ${row.preset_name}**: ${stations}\n`;
                });
                embed.setDescription(description);

                interaction.editReply({ embeds: [embed] });
            });
        } else if (subCommand === 'delete') {
            const presetName = interaction.options.getString('nazwa');

            db.run('DELETE FROM user_presets WHERE user_id = ? AND preset_name = ?', [userId, presetName], function (err) {
                if (err) {
                    console.error('Błąd usuwania presetu:', err);
                    return interaction.editReply({ content: '❌ Wystąpił błąd podczas usuwania presetu.' });
                }
                if (this.changes === 0) {
                    return interaction.editReply({ content: `❌ Nie znaleziono presetu o nazwie **${presetName}** do usunięcia.` });
                }
                interaction.editReply({ content: `🗑️ Preset **${presetName}** został pomyślnie usunięty.` });
            });
        }
    },
};