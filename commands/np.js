// `commands/np.js` - Jeśli chcesz, aby /np było osobną definicją komendy
// Zauważ, że `execute` tej komendy może wywołać `co-gra.js` lub powtórzyć logikę.
// Bardziej efektywne jest obsłużenie aliasu w `interactionCreate.js`

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('np') // Now Playing
        .setDescription('Pokazuje aktualnie odtwarzany utwór (alias dla /co-gra).'),
    // Tutaj nie ma osobnej logiki, bo obsługa będzie przekierowana do co-gra
    async execute(interaction, client, players) {
        // Ta komenda po prostu wywołuje logikę co-gra
        const coGraCommand = client.commands.get('co-gra');
        if (coGraCommand) {
            await coGraCommand.execute(interaction, client, players);
        } else {
            await interaction.reply({ content: 'Wystąpił wewnętrzny błąd (brak komendy co-gra).', ephemeral: true });
        }
    },
};