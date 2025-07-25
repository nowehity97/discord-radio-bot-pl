const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../db');
const { getRadioMetadata } = require('../utils/radioMetadata');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('radio-info')
        .setDescription('Pokazuje informacje o wybranej stacji radiowej, w tym aktualnie odtwarzany utwór.')
        .addStringOption(option =>
            option.setName('stacja')
                .setDescription('Nazwa stacji radiowej')
                .setRequired(true)
                .setAutocomplete(true)),
    // Lista komend wymagających autouzupełniania dla globalnego obsługiwania
    autocompleteCommands: ['radio-info'],
    async execute(interaction) {
        await interaction.deferReply();

        const stationName = interaction.options.getString('stacja');

        db.get('SELECT * FROM stations WHERE name = ?', [stationName], async (err, station) => {
            if (err) {
                console.error('❌ Błąd pobierania stacji z bazy dla /radio-info:', err);
                return interaction.editReply({ content: '❌ Wystąpił błąd podczas pobierania danych stacji.' });
            }
            if (!station) {
                return interaction.editReply({ content: '❌ Nie znaleziono stacji o takiej nazwie! Użyj autouzupełniania lub komendy `/stations`.' });
            }

            let nowPlaying = 'Brak danych o utworze';
            if (station.metadata_url) {
                try {
                    const metadata = await getRadioMetadata(station.metadata_url);
                    nowPlaying = metadata.title;
                } catch (metaError) {
                    console.error(`Błąd pobierania metadanych dla ${station.name} (URL: ${station.metadata_url}):`, metaError.message);
                    nowPlaying = 'Błąd pobierania danych o utworze.';
                }
            } else {
                nowPlaying = 'Brak dostępnego URL metadanych dla tej stacji.';
            }

            const embed = new EmbedBuilder()
                .setTitle(`📻 Informacje o stacji: ${station.name}`)
                .addFields(
                    { name: '🎵 Aktualny utwór', value: nowPlaying, inline: false },
                    { name: '🔗 URL Strumienia', value: `[Link do strumienia](${station.stream_url})`, inline: true },
                    { name: '📊 URL Metadanych', value: station.metadata_url ? `[Link do metadanych](${station.metadata_url})` : 'Brak', inline: true }
                )
                .setColor('#1E90FF')
                .setFooter({ text: 'Dane o utworze mogą być opóźnione lub niedostępne dla niektórych stacji.' });

            await interaction.editReply({ embeds: [embed] });
        });
    },
};