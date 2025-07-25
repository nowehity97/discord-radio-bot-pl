const { SlashCommandBuilder, MessageFlags } = require('discord.js'); // Dodano MessageFlags
const db = require('../db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove-station')
        .setDescription('Usuwa stację radiową (tylko developer).')
        .addStringOption(option =>
            option.setName('nazwa')
                .setDescription('Nazwa stacji do usunięcia')
                .setRequired(true)
                .setAutocomplete(true)),
    autocompleteCommands: ['remove-station'],
    async execute(interaction, client, players, DEVELOPER_IDS, commands) { // Dopasowana kolejność argumentów
        if (!DEVELOPER_IDS || !Array.isArray(DEVELOPER_IDS) || !DEVELOPER_IDS.includes(interaction.user.id)) {
            return interaction.reply({ content: '❌ Brak uprawnień! Tylko developerzy mogą używać tej komendy.', flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const name = interaction.options.getString('nazwa');

        db.run('DELETE FROM stations WHERE name = ?', [name], function (err) {
            if (err) {
                console.error('Błąd usuwania stacji:', err);
                return interaction.editReply({ content: '❌ Wystąpił błąd podczas usuwania stacji!' });
            }
            if (this.changes === 0) {
                return interaction.editReply({ content: `❌ Stacja o nazwie **${name}** nie została znaleziona.` });
            }
            interaction.editReply({ content: `✅ Stacja **${name}** została usunięta!` });
        });
    },
};