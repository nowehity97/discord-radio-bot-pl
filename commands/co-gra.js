const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getRadioMetadata } = require('../utils/radioMetadata');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('co-gra')
        .setDescription('Pokazuje aktualnie odtwarzany utwór lub program na radiu.'),
    aliases: ['np'], // Alias, który będzie obsługiwany w interactionCreate
    async execute(interaction, client, players) {
        await interaction.deferReply({ ephemeral: true });

        const { guild } = interaction;
        const guildPlayer = players.get(guild.id);
        if (!guildPlayer) {
            return interaction.editReply({ content: '❌ Aktualnie nic nie jest odtwarzane!' });
        }

        try {
            let nowPlayingTitle = guildPlayer.station.name; // Domyślnie nazwa stacji
            if (guildPlayer.station.metadata_url) {
                 const metadata = await getRadioMetadata(guildPlayer.station.metadata_url);
                 nowPlayingTitle = metadata.title;
            } else if (guildPlayer.station.stream_url && guildPlayer.station.name === 'Niestandardowy Strumień') {
                // Dla niestandardowego strumienia bez metadata_url, jeśli nazwa jest domyślna
                nowPlayingTitle = `Niestandardowy Strumień (${guildPlayer.station.stream_url})`;
            }

            const embed = new EmbedBuilder()
                .setTitle(`🎵 Aktualnie odtwarzane na ${guildPlayer.station.name}`)
                .setDescription(`**Utwór:** ${nowPlayingTitle}`)
                .addFields(
                    { name: 'Włączone przez', value: `<@${guildPlayer.lastUser}>`, inline: true },
                    { name: 'Czas od włączenia', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
                )
                .setColor('#2ecc71')
                .setThumbnail('https://cdn-icons-png.flaticon.com/512/3100/3100751.png');

            interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Błąd komendy co-gra/np:', error);
            interaction.editReply({ content: '❌ Wystąpił błąd podczas pobierania informacji o utworze!' });
        }
    },
};