const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const fetch = require('node-fetch'); // Użyj require('node-fetch'); dla Node.js < 18, w nowszych wersjach fetch jest globalne

module.exports = {
    data: new SlashCommandBuilder()
        .setName('share-song')
        .setDescription('Generuje linki do wyszukiwania aktualnie odtwarzanego utworu na YouTube i Google.'),
    async execute(interaction, client, players, DEVELOPER_IDS, commands) { // Pamiętaj o kolejności argumentów
        await interaction.deferReply();

        const { guild } = interaction;
        const guildPlayer = players.get(guild.id);

        if (!guildPlayer || !guildPlayer.station) {
            return interaction.editReply({ content: '❌ Bot nie odtwarza obecnie żadnej stacji radiowej.' });
        }

        // Pobieramy tytuł z nowo dodanego pola currentSongTitle w obiekcie gracza
        const currentSongTitle = guildPlayer.currentSongTitle;

        if (!currentSongTitle || currentSongTitle === 'Ładowanie...' || currentSongTitle === 'Brak informacji' || currentSongTitle.includes('Reklama') || currentSongTitle.includes('Wiadomości') || currentSongTitle.includes('Brak metadanych')) {
            return interaction.editReply({ content: 'ℹ️ Niestety, nie mogę teraz pobrać informacji o aktualnie odtwarzanym utworze (brak metadanych, reklama, lub problem z pobieraniem).' });
        }

        const youtubeApiKey = process.env.YOUTUBE_API_KEY;
        if (!youtubeApiKey) {
            console.error('Błąd: Brak klucza API YouTube w pliku .env. Proszę go dodać.');
            return interaction.editReply({ content: '❌ Funkcja wyszukiwania YouTube jest obecnie niedostępna (brak klucza API bota).' });
        }

        const encodedTitle = encodeURIComponent(currentSongTitle);
        let youtubeVideoLink = `https://www.youtube.com/results?search_query=${encodedTitle}`; // Domyślny link do wyszukiwania, jeśli API zawiedzie

        try {
            const youtubeApiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodedTitle}&type=video&key=${youtubeApiKey}&maxResults=1`;
            
            const response = await fetch(youtubeApiUrl);
            const data = await response.json();

            if (data.items && data.items.length > 0) {
                const videoId = data.items[0].id.videoId;
                youtubeVideoLink = `https://www.youtube.com/watch?v=${videoId}`; // Bezpośredni link do filmu
            } else {
                console.log(`Nie znaleziono bezpośredniego filmu YouTube dla "${currentSongTitle}". Zostanie użyty link wyszukiwania.`);
            }
        } catch (error) {
            console.error('❌ Błąd podczas wyszukiwania w YouTube API:', error);
            // Pozostawiamy youtubeVideoLink jako link do wyszukiwania w przypadku błędu
        }

        const googleSearchLink = `https://www.google.com/search?q=${encodedTitle}`;

        const embed = new EmbedBuilder()
            .setTitle(`🎶 Udostępnij utwór: ${currentSongTitle}`)
            .setDescription(`Obecnie odtwarzana stacja: **${guildPlayer.station.name}**`)
            .addFields(
                { name: 'Obejrzyj na YouTube', value: `[Kliknij tutaj](${youtubeVideoLink})`, inline: false },
                { name: 'Wyszukaj w Google', value: `[Kliknij tutaj](${googleSearchLink})`, inline: false }
            )
            .setColor('#FF5733')
            .setTimestamp()
            .setFooter({ text: `Zgłoś błąd, jeśli coś nie działa!` });

        await interaction.editReply({ embeds: [embed] });
    },
};