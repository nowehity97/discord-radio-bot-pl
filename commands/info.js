const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const db = require('../db'); // Zaimportuj moduł bazy danych

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Wyświetla statystyki dotyczące bota radiowego.'),
    async execute(interaction, client, players, DEVELOPER_IDS, commands) {
        await interaction.deferReply();

        let totalStations = 0;
        try {
            // Pobierz liczbę stacji z bazy danych
            totalStations = await new Promise((resolve, reject) => {
                db.get('SELECT COUNT(*) AS count FROM stations', (err, row) => {
                    if (err) {
                        console.error('Błąd pobierania liczby stacji:', err);
                        return reject(err);
                    }
                    resolve(row.count);
                });
            });
        } catch (error) {
            console.error('Nie udało się pobrać liczby stacji:', error);
            totalStations = 'Niedostępne';
        }

        const activeConnections = players.size; // Liczba aktywnych odtwarzaczy (czyli serwerów, na których bot gra)
        const totalGuilds = client.guilds.cache.size; // Liczba serwerów, na których jest bot

        // Opcjonalnie: Liczba unikalnych użytkowników, ale wymaga to INTENTU GuildPresences
        // i iteracji przez wszystkich członków na wszystkich serwerach, co może być kosztowne.
        // Na razie skupimy się na prostszych statystykach.
        // let totalUsers = 0;
        // client.guilds.cache.forEach(guild => {
        //     totalUsers += guild.memberCount; // Zlicza członków na każdym serwerze
        // });


        const embed = new EmbedBuilder()
            .setTitle('📊 Statystyki Radio Bota')
            .setDescription('Szczegółowe dane dotyczące działania bota.')
            .addFields(
                { name: 'Developerzy', value: DEVELOPER_IDS.map(id => `<@${id}>`).join(', ') || 'Brak ustawionego ID developera', inline: true },
                { name: 'Wersja Discord.js', value: require('discord.js').version, inline: true },
                { name: 'Ping (API)', value: `${client.ws.ping}ms`, inline: true },
                { name: 'Serwery', value: totalGuilds.toString(), inline: true },
                { name: 'Aktywne połączenia', value: activeConnections.toString(), inline: true },
                { name: 'Zapisane stacje', value: totalStations.toString(), inline: true }
                // { name: 'Łączna liczba użytkowników', value: totalUsers.toString(), inline: true }, // Odkomentuj jeśli dodasz odpowiedni intent i będziesz zbierać dane
            )
            .setColor('#2ECC71') // Zielony kolor dla statystyk
            .setTimestamp()
            .setFooter({ text: 'Dziękuję za korzystanie z Radio Bota!' });

        await interaction.editReply({ embeds: [embed] });
    },
};