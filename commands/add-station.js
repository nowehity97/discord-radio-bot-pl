const { SlashCommandBuilder, MessageFlags } = require('discord.js'); // Dodano MessageFlags
const db = require('../db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-station')
        .setDescription('Dodaje nową stację radiową (tylko developer).')
        .addStringOption(option =>
            option.setName('nazwa')
                .setDescription('Nazwa stacji')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('url_streamu')
                .setDescription('Adres URL strumienia radiowego')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('url_metadata')
                .setDescription('Adres URL metadanych (opcjonalne)')
                .setRequired(false)),
    async execute(interaction, client, players, DEVELOPER_IDS, commands) { // Dopasowana kolejność argumentów
        if (!DEVELOPER_IDS || !Array.isArray(DEVELOPER_IDS) || !DEVELOPER_IDS.includes(interaction.user.id)) {
            return interaction.reply({ content: '❌ Brak uprawnień! Tylko developerzy mogą używać tej komendy.', flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const name = interaction.options.getString('nazwa');
        const streamUrl = interaction.options.getString('url_streamu');
        const metadataUrl = interaction.options.getString('url_metadata') || null;

        db.run('INSERT INTO stations (name, stream_url, metadata_url) VALUES (?, ?, ?)', [name, streamUrl, metadataUrl], function (err) {
            if (err) {
                console.error('Błąd dodawania stacji:', err);
                if (err.message.includes('UNIQUE constraint failed')) {
                    return interaction.editReply({ content: `❌ Stacja o nazwie **${name}** już istnieje!` });
                }
                return interaction.editReply({ content: '❌ Wystąpił błąd podczas dodawania stacji!' });
            }
            interaction.editReply({ content: `✅ Stacja **${name}** została dodana!` });
        });
    },
};