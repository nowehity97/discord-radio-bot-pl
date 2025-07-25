const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Ustawia głośność odtwarzania radia.')
        .addIntegerOption(option =>
            option.setName('poziom')
                .setDescription('Poziom głośności (0-100)')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(100)),
    async execute(interaction, client, players) {
        await interaction.deferReply({ ephemeral: true });

        const { guild } = interaction;
        const guildPlayer = players.get(guild.id);
        if (!guildPlayer || !guildPlayer.resource) {
            return interaction.editReply({ content: '❌ Bot nie odtwarza aktualnie żadnego radia, aby zmienić głośność!' });
        }

        const volume = interaction.options.getInteger('poziom');
        const volFloat = volume / 100;

        try {
            guildPlayer.resource.volume.setVolume(volFloat);
            await interaction.editReply({ content: `🔊 Ustawiono głośność na **${volume}%**` });
        } catch (error) {
            console.error('Błąd ustawiania głośności:', error);
            interaction.editReply({ content: '❌ Wystąpił błąd podczas ustawiania głośności. Spróbuj ponownie.' });
        }
    },
};