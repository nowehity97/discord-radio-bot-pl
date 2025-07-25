const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('search-station')
        .setDescription('Wyszukuje stacje radiowe po nazwie.')
        .addStringOption(option =>
            option.setName('zapytanie')
                .setDescription('Część nazwy stacji do wyszukania')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();

        const query = interaction.options.getString('zapytanie');

        db.all('SELECT name FROM stations WHERE name LIKE ?', [`%${query}%`], (err, rows) => {
            if (err) {
                console.error('❌ Błąd wyszukiwania stacji:', err);
                return interaction.editReply({ content: '❌ Wystąpił błąd podczas wyszukiwania stacji!' });
            }

            if (rows.length === 0) {
                return interaction.editReply({ content: `🔍 Nie znaleziono stacji pasujących do "${query}".` });
            }

            const foundStations = rows.map(row => `• **${row.name}**`).join('\n');
            const embed = new EmbedBuilder()
                .setTitle(`🔍 Wyniki wyszukiwania dla "${query}"`)
                .setDescription(foundStations)
                .setColor('#FFD700')
                .setFooter({ text: `Znaleziono ${rows.length} stacji.` });

            interaction.editReply({ embeds: [embed] });
        });
    },
};