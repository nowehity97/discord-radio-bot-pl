const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Wyświetla komendy bota.'),
    async execute(interaction, client, players, DEVELOPER_IDS) { // Zachowujemy DEVELOPER_IDS na przyszłość
        await interaction.deferReply();

        const embed = new EmbedBuilder()
            .setTitle('📚 POMOC - KOMENDY BOTA 📚') // Użyj emotikon lub stylizowanego tekstu
            .setDescription(
                "Witaj w centrum pomocy Radio Bota! Poniżej znajdziesz listę wszystkich dostępnych komend, " +
                "podzielonych na kategorie, aby ułatwić Ci nawigację.\n\n" +
                "**Ważne!** Komendy takie jak `/radio` czy `/stop` wymagają, abyś był na kanale głosowym. " +
                "Bot poinformuje Cię, jeśli spróbujesz ich użyć, będąc poza kanałem!\n\n" +
                "**Przewiń w dół, aby zobaczyć wszystkie sekcje.**"
            )
            .setColor('#7289DA') // Kolor podobny do Discorda
            .setTimestamp()
            .setFooter({ text: 'Dziękuję za korzystanie z Radio Bota!' });

        // Jeśli masz obrazek z napisem "KOMENDY" lub innym nagłówkiem, możesz go ustawić:
        // .setImage('URL_DO_TWOJEGO_OBRAZKA_Z_NAPISEM_KOMENDY.png') 
        // LUB
        // .setThumbnail('URL_DO_IKONY_POMOCY.png') 

        // Sekcja "Komendy Ogólne"
        embed.addFields(
            { name: '─═ 🌐 KOMENDY OGÓLNE ═─', value: '\u200B', inline: false }, // Stylizowany nagłówek
            {
                name: '`/radio <nazwa_stacji>`',
                value: 'Odtwarza wybraną stację radiową. Wpisz nazwę stacji, a bot podpowie Ci dostępne opcje!',
                inline: false
            },
            {
                name: '`/play <url> [nazwa]`',
                value: 'Odtwarza radio z podanego linku URL (np. .mp3, .ogg, .aac). Opcjonalnie podaj `nazwa` wyświetlaną dla strumienia.',
                inline: false
            },
            {
                name: '`/stop`',
                value: 'Zatrzymuje bieżące odtwarzanie radia.',
                inline: false
            },
            {
                name: '`/co-gra` (lub `/np`)',
                value: 'Pokazuje aktualnie odtwarzany utwór lub program na radiu. (`/np` to skrót od `/co-gra`).',
                inline: false
            },
            {
                name: '`/stations`',
                value: 'Wyświetla listę wszystkich dostępnych stacji radiowych.',
                inline: false
            },
            {
                name: '`/search-station <zapytanie>`',
                value: 'Pozwala wyszukać stacje radiowe po fragmencie nazwy.',
                inline: false
            },
            {
                name: '`/radio-info <nazwa_stacji>`',
                value: 'Wyświetla szczegółowe informacje o wybranej stacji radiowej, w tym aktualnie odtwarzany utwór.',
                inline: false
            },
            {
                name: '`/volume <poziom>`',
                value: 'Ustawia głośność odtwarzania radia w zakresie od **0 do 100**.',
                inline: false
            },
            {
                name: '`/info`', // Zmienione z /stats, jeśli wolisz /info
                value: 'Wyświetla informacje o bocie, takie jak jego twórca, wersja Discord.js i opóźnienie (ping).',
                inline: false
            },
            {
                name: '`/share-song`',
                value: 'Udostępnia aktualnie odtwarzany utwór na YouTube i Google.',
                inline: false
            }
        );

        // Sekcja "Komendy dla Developerów"
        // Możesz sprawdzić DEVELOPER_IDS i dodać tę sekcję tylko dla deweloperów
        // if (DEVELOPER_IDS.includes(interaction.user.id)) {
            embed.addFields(
                { name: '\u200B', value: '\u200B', inline: false }, // Pusty field jako separator
                { name: '─═ 🛠️ KOMENDY DLA DEVELOPERÓW ═─', value: '*(Dostępne tylko dla uprawnionych użytkowników)*', inline: false },
                {
                    name: '`/reload`',
                    value: 'Przeładowuje wszystkie komendy bota.',
                    inline: false
                },
                {
                    name: '`/add-station <nazwa> <url_streamu> [url_metadanych]`',
                    value: 'Dodaje nową stację radiową.',
                    inline: false
                },
                {
                    name: '`/remove-station <nazwa>`',
                    value: 'Usuwa istniejącą stację radiową.',
                    inline: false
                },
                {
                    name: '`/edit-station <obecna_nazwa> [nowa_nazwa] [nowy_url_streamu] [nowy_url_metadanych]`',
                    value: 'Edytuje szczegóły istniejącej stacji radiowej.',
                    inline: false
                }
            );
        // }

        await interaction.editReply({ embeds: [embed] });
    },
};