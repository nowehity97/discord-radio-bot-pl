const db = require('../db');
const { MessageFlags } = require('discord.js');
const { createHelpEmbed } = require('../commands/help'); // Upewnij się, że to jest poprawna ścieżka

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client, commands, players, DEVELOPER_IDS) {
        // Obsługa autouzupełniania
        if (interaction.isAutocomplete()) {
            const focusedValue = interaction.options.getFocused();
            const commandName = interaction.commandName;
            const subCommand = interaction.options.getSubcommand(false);

            const command = commands.get(commandName);
            // Upewnij się, że komenda ma zdefiniowane autocompleteCommands i zawiera bieżącą nazwę komendy
            if (!command || !command.autocompleteCommands || !command.autocompleteCommands.includes(commandName)) {
                return interaction.respond([]);
            }

            let choices = [];

            if (commandName === 'radio' || (commandName === 'preset' && subCommand === 'save')) {
                // Autouzupełnianie dla nazw stacji (dla /radio i /preset save)
                db.all('SELECT name FROM stations WHERE name LIKE ?', [`%${focusedValue}%`], (err, rows) => {
                    if (err) {
                        console.error('❌ Błąd autouzupełniania stacji:', err);
                        return interaction.respond([]);
                    }
                    choices = rows.map(row => ({ name: row.name, value: row.name })).slice(0, 25);
                    interaction.respond(choices);
                });
            } else if (commandName === 'radio-info') {
                 // Autouzupełnianie dla nazw stacji dla /radio-info
                 db.all('SELECT name FROM stations WHERE name LIKE ?', [`%${focusedValue}%`], (err, rows) => {
                    if (err) {
                        console.error('❌ Błąd autouzupełniania stacji:', err);
                        return interaction.respond([]);
                    }
                    choices = rows.map(row => ({ name: row.name, value: row.name })).slice(0, 25);
                    interaction.respond(choices);
                });
            } else if (commandName === 'preset' && (subCommand === 'load' || subCommand === 'delete')) {
                // Autouzupełnianie dla nazw presetów użytkownika
                const userId = interaction.user.id;
                db.all('SELECT preset_name FROM user_presets WHERE user_id = ? AND preset_name LIKE ?', [userId, `%${focusedValue}%`], (err, rows) => {
                    if (err) {
                        console.error('❌ Błąd autouzupełniania presetów:', err);
                        return interaction.respond([]);
                    }
                    choices = rows.map(row => ({ name: row.preset_name, value: row.preset_name })).slice(0, 25);
                    interaction.respond(choices);
                });
            } else {
                return interaction.respond([]); // Domyślnie pusta lista dla innych komend
            }
            return;
        }

        // --- OBSŁUGA STRING SELECT MENU (dla komendy /help ORAZ /preset load) ---
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'help_category_select') {
                await interaction.deferUpdate();

                const selectedCategory = interaction.values[0];
                let embedToShow;

                if (selectedCategory === 'developer') {
                    if (DEVELOPER_IDS.includes(interaction.user.id)) {
                        embedToShow = createHelpEmbed(selectedCategory, true);
                    } else {
                        embedToShow = createHelpEmbed(selectedCategory, false);
                    }
                } else {
                    embedToShow = createHelpEmbed(selectedCategory, false);
                }

                await interaction.editReply({ embeds: [embedToShow], components: [] }); // Usuń komponenty po wyborze
            } else if (interaction.customId.startsWith('preset_select_')) { // Nowa obsługa dla presetów
                await interaction.deferUpdate(); // Deferujemy, aby mieć czas na odpowiedź

                const selectedStationName = interaction.values[0];
                const userId = interaction.user.id;
                const customIdParts = interaction.customId.split('_');
                const presetName = customIdParts.slice(3).join('_'); // Odzyskaj nazwę presetu

                const voiceChannel = interaction.member.voice.channel;
                if (!voiceChannel) {
                    await interaction.editReply({ content: '🔇 Musisz być na kanale głosowym, aby włączyć stację!', components: [] });
                    return;
                }

                const radioCommand = client.commands.get('radio');
                if (radioCommand && radioCommand.execute) {
                    const fakeInteraction = {
                        options: {
                            getString: (optName) => {
                                if (optName === 'stacja') return selectedStationName;
                                return null;
                            }
                        },
                        guild: interaction.guild,
                        member: interaction.member,
                        channel: interaction.channel,
                        deferReply: async () => {}, // mock deferReply
                        editReply: async (options) => { // mock editReply
                            // Edytuj pierwotną wiadomość, która zawierała select menu
                            await interaction.editReply({ 
                                content: `✅ Włączono stację **${selectedStationName}** z presetu **${presetName}**!`, 
                                embeds: options.embeds, // Przekaż embeda z komendy radio
                                components: [] // Usuń komponenty po wyborze
                            });
                        },
                        user: interaction.user
                    };
                    try {
                        await radioCommand.execute(fakeInteraction, client, players);
                    } catch (e) {
                        console.error('Błąd podczas próby włączenia stacji z preset_select:', e);
                        await interaction.editReply({ content: `❌ Nie udało się włączyć stacji **${selectedStationName}** z presetu: ${e.message}`, components: [] });
                    }
                } else {
                    console.error("Komenda 'radio' nie znaleziona. Nie można włączyć stacji z preset_select.");
                    await interaction.editReply({ content: `❌ Błąd wewnętrzny: Nie można włączyć stacji z presetu.`, components: [] });
                }
            }
            return;
        }

        // --- OBSŁUGA PRZYCISKÓW (dla komendy /preset load) ---
        if (interaction.isButton()) {
            if (interaction.customId.startsWith('preset_cancel_')) {
                await interaction.update({ content: 'Anulowano wybór stacji z presetu.', components: [] });
            }
            return;
        }

        // Główna obsługa komend slash
        if (!interaction.isCommand()) return;

        const command = commands.get(interaction.commandName);

        if (!command) {
            console.error(`Nie znaleziono komendy ${interaction.commandName}.`);
            return;
        }

        const { commandName, guild, member } = interaction;

        const requiresVoiceChannel = (commandName === 'radio' || (commandName === 'preset' && interaction.options.getSubcommand(false) === 'load') || commandName === 'play' || commandName === 'share-song');
        // Usunięto 'stop', 'volume', 'co-gra' z wymagań kanału głosowego, bo mogą być używane bez niego,
        // a ich wewnętrzna logika sama sprawdzi połączenie bota.
        
        if (requiresVoiceChannel && !member.voice.channel) {
            // Jeśli komenda wymaga kanału głosowego, a użytkownik nie jest na nim
            // Dla /preset load wiadomość już jest wysyłana w commands/preset.js
            // Ta linia jest dla ogólnych przypadków, jeśli nie zostanie obsłużona wcześniej
            return interaction.reply({ content: '🔇 Musisz być na kanale głosowym, aby użyć tej komendy!', flags: MessageFlags.Ephemeral });
        }


        try {
            await command.execute(interaction, client, players, DEVELOPER_IDS, commands);
        } catch (error) {
            console.error(`❌ Błąd podczas wykonywania komendy ${commandName}:`, error);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: 'Wystąpił błąd podczas wykonywania tej komendy!', flags: MessageFlags.Ephemeral });
            } else {
                await interaction.reply({ content: 'Wystąpił błąd podczas wykonywania tej komendy!', flags: MessageFlags.Ephemeral });
            }
        }
    },
};