const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stations')
        .setDescription('Wyświetla listę wszystkich dostępnych stacji radiowych.'),
    async execute(interaction) {
        await interaction.deferReply();

        db.all('SELECT * FROM stations', (err, stations) => {
            if (err) {
                console.error('❌ Błąd pobierania stacji:', err);
                return interaction.editReply({ content: '❌ Błąd pobierania stacji!' });
            }

            if (stations.length === 0) {
                return interaction.editReply({ content: 'ℹ️ Brak dostępnych stacji radiowych. Dodaj je za pomocą komendy `/add-station`.' });
            }

            const embed = new EmbedBuilder()
                .setTitle('📻 Dostępne stacje radiowe')
                .setDescription(stations.map(s => `• **${s.name}**`).join('\n'))
                .setColor('#4CAF50');

            interaction.editReply({ embeds: [embed] });
        });
    },
};