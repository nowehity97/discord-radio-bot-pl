const { SlashCommandBuilder, MessageFlags } = require('discord.js'); // Dodano MessageFlags
const db = require('../db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('edit-station')
        .setDescription('Edytuje istniejącą stację radiową (tylko developer).')
        .addStringOption(option =>
            option.setName('obecna_nazwa')
                .setDescription('Obecna nazwa stacji do edycji')
                .setRequired(true)
                .setAutocomplete(true))
        .addStringOption(option =>
            option.setName('nowa_nazwa')
                .setDescription('(Opcjonalnie) Nowa nazwa stacji')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('nowy_url_streamu')
                .setDescription('(Opcjonalnie) Nowy adres URL strumienia')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('nowy_url_metadata')
                .setDescription('(Opcjonalnie) Nowy adres URL metadanych')
                .setRequired(false)),
    autocompleteCommands: ['edit-station'],
    async execute(interaction, client, players, DEVELOPER_IDS, commands) { // Dopasowana kolejność argumentów
        if (!DEVELOPER_IDS || !Array.isArray(DEVELOPER_IDS) || !DEVELOPER_IDS.includes(interaction.user.id)) {
            return interaction.reply({ content: '❌ Brak uprawnień! Tylko developerzy mogą używać tej komendy.', flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const oldName = interaction.options.getString('obecna_nazwa');
        const newName = interaction.options.getString('nowa_nazwa');
        const newStreamUrl = interaction.options.getString('nowy_url_streamu');
        const newMetadataUrl = interaction.options.getString('nowy_url_metadata');

        if (!newName && !newStreamUrl && !newMetadataUrl) {
            return interaction.editReply({ content: '⚠️ Musisz podać przynajmniej jedną nową wartość do zaktualizowania!' });
        }

        let updateFields = [];
        let updateValues = [];

        if (newName) {
            updateFields.push('name = ?');
            updateValues.push(newName);
        }
        if (newStreamUrl) {
            updateFields.push('stream_url = ?');
            updateValues.push(newStreamUrl);
        }
        if (newMetadataUrl) {
            updateFields.push('metadata_url = ?');
            updateValues.push(newMetadataUrl);
        }

        updateValues.push(oldName);

        const query = `UPDATE stations SET ${updateFields.join(', ')} WHERE name = ?`;

        db.run(query, updateValues, function (err) {
            if (err) {
                console.error('Błąd edycji stacji:', err);
                if (err.message.includes('UNIQUE constraint failed') && newName) {
                    return interaction.editReply({ content: `❌ Stacja o nazwie **${newName}** już istnieje!` });
                }
                return interaction.editReply({ content: '❌ Wystąpił błąd podczas edycji stacji!' });
            }
            if (this.changes === 0) {
                return interaction.editReply({ content: `❌ Stacja o nazwie **${oldName}** nie została znaleziona lub nie było zmian.` });
            }
            interaction.editReply({ content: `✅ Stacja **${oldName}** została zaktualizowana!` + (newName ? ` na **${newName}**` : '') });
        });
    },
};