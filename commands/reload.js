const { SlashCommandBuilder, MessageFlags } = require('discord.js'); // Dodano MessageFlags
const path = require('node:path');
const fs = require('node:fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reload')
        .setDescription('Przeładowuje wszystkie komendy bota (tylko dla developera).'),
    async execute(interaction, client, players, DEVELOPER_IDS, commands) { // Dopasowana kolejność argumentów
        // Debugging logs - możesz je usunąć po tym jak upewnisz się, że działa
        console.log('Reload command executed.');
        console.log('Type of DEVELOPER_IDS:', typeof DEVELOPER_IDS);
        console.log('Value of DEVELOPER_IDS:', DEVELOPER_IDS);

        // Poprawione sprawdzanie uprawnień developera
        if (!DEVELOPER_IDS || !Array.isArray(DEVELOPER_IDS) || !DEVELOPER_IDS.includes(interaction.user.id)) {
            if (!DEVELOPER_IDS) {
                console.warn('DEVELOPER_IDS is undefined or null in reload.js');
            } else if (!Array.isArray(DEVELOPER_IDS)) {
                console.warn('DEVELOPER_IDS is not an array in reload.js. Type:', typeof DEVELOPER_IDS, 'Value:', DEVELOPER_IDS);
            }
            return interaction.reply({ content: '❌ Brak uprawnień! Tylko developerzy mogą używać tej komendy.', flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral }); // Zmieniono na flags

        try {
            const commandsPath = path.join(__dirname, '../commands');
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

            client.commands.clear(); // Wyczyść istniejące komendy z kolekcji bota
            const commandsToRegister = [];

            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);
                delete require.cache[require.resolve(filePath)]; // Usuń moduł z pamięci podręcznej Node.js

                const command = require(filePath);
                if ('data' in command && 'execute' in command) {
                    client.commands.set(command.data.name, command);
                    commandsToRegister.push(command.data.toJSON());
                } else {
                    console.warn(`[Ostrzeżenie] Komenda pod ${filePath} brakuje wymaganych właściwości "data" lub "execute".`);
                }
            }

            // Zaktualizuj komendy na Discordzie
            await client.application.commands.set(commandsToRegister);
            console.log('✅ Wszystkie komendy zostały przeładowane i ponownie zarejestrowane!');
            await interaction.editReply({ content: '✅ Komendy zostały przeładowane!' });

        } catch (error) {
            console.error('❌ Błąd podczas przeładowywania komend:', error);
            await interaction.editReply({ content: '❌ Wystąpił błąd podczas przeładowywania komend!' });
        }
    },
};