require('dotenv').config();

// ==================================================
// FIX: Rozwiązanie problemu z bibliotekami szyfrującymi
// ==================================================
try {
    process.env.DISCORDJS_VOICE_FORCE_NATIVE = 'true';
    require('sodium-native');
    console.log('✅ sodium-native załadowane pomyślnie');
} catch (error) {
    console.error('❌ Błąd ładowania sodium-native:', error);
}

try {
    if (!process.env.DISCORDJS_VOICE_FORCE_NATIVE) {
        globalThis.crypto = require('crypto');
        require('tweetnacl');
        console.log('✅ Użyto fallback tweetnacl');
    }
} catch (error) {
    console.error('❌ Błąd ładowania fallback:', error);
}

const { generateDependencyReport } = require('@discordjs/voice');
console.log(generateDependencyReport());
// ==================================================

const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const path = require('node:path');
const fs = require('node:fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
    ]
});

// Zmienne globalne dostępne dla komend
client.commands = new Collection(); // Mapa do przechowywania komend
const players = new Map(); // Mapa do przechowywania odtwarzaczy dla każdego serwera

// Upewnij się, że DEVELOPER_IDS jest zawsze tablicą
const DEVELOPER_IDS = [];
if (process.env.DEVELOPER_ID) {
    // Jeśli masz wiele ID developerów oddzielonych przecinkami w .env, możesz to zrobić tak:
    // DEVELOPER_IDS.push(...process.env.DEVELOPER_ID.split(',').map(id => id.trim()));
    // Jeśli masz tylko jedno ID:
    DEVELOPER_IDS.push(process.env.DEVELOPER_ID.trim());
} else {
    console.warn('❌ Zmienna środowiskowa DEVELOPER_ID nie jest ustawiona w pliku .env. Komendy deweloperskie nie będą działać.');
}

// --- Ładowanie Komend ---
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.warn(`[Ostrzeżenie] Komenda pod ${filePath} brakuje wymaganych właściwości "data" lub "execute".`);
    }
}

// Funkcja rejestracji komend na Discordzie
async function registerCommands() {
    try {
        const commandsToRegister = [];
        for (const command of client.commands.values()) {
            commandsToRegister.push(command.data.toJSON());
        }

        // --- WAŻNE ---
        // Ta sekcja służy do WYMUSZENIA AKTUALIZACJI KOMEND na Discordzie.
        // Po tym, jak komendy się zaktualizują (zweryfikujesz, że działają poprawnie),
        // możesz ZAKOMENTOWAĆ lub USUNĄĆ linię `await client.application.commands.set([]);`
        // i zostawić tylko `await client.application.commands.set(commandsToRegister);`
        // Usuwanie wszystkich komend za każdym uruchomieniem bota NIE JEST DOBRĄ PRAKTYKĄ PRODUKCYJNĄ,
        // ale jest skuteczna przy developmentie, aby wymusić odświeżenie definicji komend.

        await client.application.commands.set([]); // Usuń wszystkie globalne komendy
        console.log('Wyczyszczono wszystkie globalne komendy.');
        await client.application.commands.set(commandsToRegister); // Dodaj ponownie
        console.log('✅ Komendy zostały zarejestrowane!');

        // LUB jeśli chcesz rejestrować komendy tylko na konkretnym serwerze (szybsze w testach):
        // const TEST_GUILD_ID = 'WPISZ_TUTAJ_ID_SWOJEGO_SERWERA_TESTOWEGO';
        // const guild = client.guilds.cache.get(TEST_GUILD_ID);
        // if (guild) {
        //     await guild.commands.set([]); // Usuń komendy z konkretnego serwera
        //     console.log(`Wyczyszczono komendy na serwerze ${guild.name}.`);
        //     await guild.commands.set(commandsToRegister); // Dodaj komendy na konkretny serwer
        //     console.log(`✅ Komendy zostały zarejestrowane na serwerze ${guild.name} (po pełnym odświeżeniu)!`);
        // } else {
        //     console.error('Nie znaleziono serwera testowego do rejestracji komend. Rejestrowanie globalnie.');
        //     await client.application.commands.set(commandsToRegister);
        //     console.log('✅ Komendy zostały zarejestrowane globalnie!');
        // }

    } catch (error) {
        console.error('❌ Błąd rejestracji komend:', error);
    }
}


client.once('ready', async () => {
    console.log(`✅ Zalogowano jako ${client.user.tag}`);
    await registerCommands();
    client.user.setActivity('Radio', { type: ActivityType.Listening });
});

// --- Ładowanie Zdarzeń ---
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        // Upewnij się, że DEVELOPMENT_IDS jest przekazywane
        client.once(event.name, (...args) => event.execute(...args, client, client.commands, players, DEVELOPER_IDS));
    } else {
        // Upewnij się, że DEVELOPMENT_IDS jest przekazywane
        client.on(event.name, (...args) => event.execute(...args, client, client.commands, players, DEVELOPER_IDS));
    }
}

client.login(process.env.DISCORD_TOKEN);