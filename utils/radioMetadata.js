// utils/radioMetadata.js
const fetch = require('node-fetch'); // Użyj require('node-fetch') dla Node.js < 18

async function getRadioMetadata(metadataUrl) {
    if (!metadataUrl) {
        return { title: 'Brak metadanych' };
    }
    try {
        const response = await fetch(metadataUrl, { timeout: 5000 });
        if (!response.ok) {
            console.error(`Błąd HTTP ${response.status} podczas pobierania metadanych z ${metadataUrl}`);
            return { title: 'Brak metadanych' };
        }
        const data = await response.json(); // Założenie, że metadane są w JSON
        // Dostosuj te pola do faktycznej struktury JSON Twoich stacji
        return { title: data.title || data.current_song || data.song || data.name || 'Nieznany wykonawca - Nieznany utwór' };
    } catch (error) {
        console.error(`Błąd pobierania/parsowania metadanych z ${metadataUrl}:`, error.message);
        return { title: 'Brak informacji (błąd parsowania)' };
    }
}

module.exports = { getRadioMetadata };