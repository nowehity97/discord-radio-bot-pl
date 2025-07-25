const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Zatrzymuje bieżące odtwarzanie radia.'),
    async execute(interaction, client, players) {
        await interaction.deferReply();

        const { guild, user } = interaction;
        const guildPlayer = players.get(guild.id);

        if (!guildPlayer) {
            return interaction.editReply({ content: '❌ Bot nie gra aktualnie muzyki!' });
        }

        guildPlayer.player.stop();
        guildPlayer.connection.destroy();
        players.delete(guild.id);
        client.user.setActivity(''); // Czyści status bota

        const embed = new EmbedBuilder()
            .setTitle('⏹ Zatrzymano odtwarzanie')
            .setDescription(`Stacja: **${guildPlayer.station.name}**`)
            .setColor('#F44336')
            .setFooter({ text: `Wyłączone przez: ${user.username}` });

        await interaction.editReply({ embeds: [embed] });
        // Jeśli masz clearWebPlayback, usuń ten komentarz i dodaj ją tutaj
        // clearWebPlayback();
    },
};