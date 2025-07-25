// db.js
const sqlite3 = require('sqlite3').verbose();

// Otwórz lub utwórz bazę danych. Callback jest wywoływany po połączeniu.
const db = new sqlite3.Database('./radio.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        // Obsługa błędu połączenia z bazą danych
        console.error('Błąd połączenia z bazą danych:', err.message);
    } else {
        console.log('Połączono z bazą danych radio.db.');

        // Używamy db.serialize() aby upewnić się, że zapytania są wykonywane sekwencyjnie.
        // Jest to kluczowe dla tworzenia tabel, a następnie wstawiania do nich danych.
        db.serialize(() => {

            // 1. Tworzenie tabeli stacji radiowych
            db.run(`
                CREATE TABLE IF NOT EXISTS stations (
                  name TEXT PRIMARY KEY,
                  stream_url TEXT NOT NULL UNIQUE,
                  metadata_url TEXT -- Usunięto NOT NULL, aby obsłużyć puste wartości
                )
            `, (err) => {
                if (err) {
                    console.error('Błąd tworzenia tabeli "stations":', err.message);
                } else {
                    console.log('Tabela "stations" gotowa lub już istnieje.');
                }
            });

            // 2. Tworzenie tabeli presetów użytkowników
            db.run(`
                CREATE TABLE IF NOT EXISTS user_presets (
                    user_id TEXT NOT NULL,
                    preset_name TEXT NOT NULL,
                    station_names TEXT NOT NULL, -- Przechowywać będziemy jako JSON string np. '["Antyradio", "Eska"]'
                    PRIMARY KEY (user_id, preset_name)                )
            `, (err) => {
                if (err) {
                    console.error('Błąd tworzenia tabeli "user_presets":', err.message);
                } else {
                    console.log('Tabela "user_presets" gotowa lub już istnieje.');
                }
            });

            // 3. Wstawianie przykładowych stacji (tylko jeśli nie istnieją)
            // Ta operacja musi być wewnątrz db.serialize() i po CREATE TABLE stations.
            const stations = [
                { name: 'RMF MAXXX', stream_url: 'http://rs6-krk2.rmfstream.pl/rmf_maxxx', metadata_url: 'https://backend.radiolise.com/api/v1/metadata/?url=http://rs6-krk2.rmfstream.pl/rmf_maxxx' },
                { name: 'RMF FM', stream_url: 'http://rs6-krk2.rmfstream.pl/rmf_fm', metadata_url: 'https://backend.radiolise.com/api/v1/metadata/?url=http://rs6-krk2.rmfstream.pl/rmf_fm' },
                { name: 'RMF Classic', stream_url: 'http://rs6-krk2.rmfstream.pl/rmf_classic', metadata_url: 'https://backend.radiolise.com/api/v1/metadata/?url=http://rs6-krk2.rmfstream.pl/rmf_classic' },
                { name: 'RMF Club', stream_url: 'http://217.74.72.11:8000/rmf_club', metadata_url: 'https://backend.radiolise.com/api/v1/metadata/?url=http://217.74.72.11:8000/rmf_club' },
                { name: 'RMF Dance', stream_url: 'http://217.74.72.11:8000/rmf_dance', metadata_url: 'https://backend.radiolise.com/api/v1/metadata/?url=http://217.74.72.11:8000/rmf_dance' },
                { name: 'RMF Hip Hop', stream_url: 'http://217.74.72.11:8000/rmf_hip_hop', metadata_url: 'https://backend.radiolise.com/api/v1/metadata/?url=http://217.74.72.11:8000/rmf_hip_hop' },
                { name: 'RMF Hop Bec', stream_url: 'http://217.74.72.11:8000/rmf_hop_bec', metadata_url: 'https://backend.radiolise.com/api/v1/metadata/?url=http://217.74.72.11:8000/rmf_hop_bec' },
                { name: 'RMF Hot New', stream_url: 'http://195.150.20.4:8000/rmf_hot_new', metadata_url: 'https://backend.radiolise.com/api/v1/metadata/?url=http://195.150.20.4:8000/rmf_hot_new' },
                { name: 'RMF Party', stream_url: 'http://217.74.72.12:8000/rmf_party', metadata_url: 'https://backend.radiolise.com/api/v1/metadata/?url=http://217.74.72.12:8000/rmf_party' },
                { name: 'RMF Poplista', stream_url: 'http://31.192.216.4:8000/rmf_poplista', metadata_url: 'https://backend.radiolise.com/api/v1/metadata/?url=http://31.192.216.4:8000/rmf_poplista' },
                { name: 'Rmf Słoneczne Przeboje', stream_url: 'http://31.192.216.4:8000/rmf_sloneczne_przeboje', metadata_url: 'https://backend.radiolise.com/api/v1/metadata/?url=http://31.192.216.4:8000/rmf_sloneczne_przeboje' },
                { name: 'Rmf Fitness', stream_url: 'http://31.192.216.4:8000/rmf_fitness', metadata_url: 'https://backend.radiolise.com/api/v1/metadata/?url=http://31.192.216.4:8000/rmf_fitness' },
                { name: 'Radio Złote Przeboje', stream_url: 'https://radiostream.pl/tuba8924-1.mp3', metadata_url: 'https://backend.radiolise.com/api/v1/metadata/?url=https://radiostream.pl/tuba8924-1.mp3' },
                { name: 'Radio Eska', stream_url: 'https://waw.ic.smcdn.pl/2380-1.mp3', metadata_url: 'https://backend.radiolise.com/api/v1/metadata/?url=https://waw.ic.smcdn.pl/2380-1.mp3' },
                { name: 'CYBERStacja', stream_url: 'https://sc.cyberstacja.pl:8000/radio.mp3', metadata_url: 'https://backend.radiolise.com/api/v1/metadata/?url=https://sc.cyberstacja.pl:8000/radio.mp3' },
                { name: 'Radio ZET', stream_url: 'https://25643.live.streamtheworld.com/RADIO_ZETAAC.aac', metadata_url: 'https://backend.radiolise.com/api/v1/metadata/?url=https://25643.live.streamtheworld.com/RADIO_ZETAAC.aac' },
                { name: 'Radio ZET - Party', stream_url: 'https://zt04.cdn.eurozet.pl/ZETPAR.mp3', metadata_url: 'https://backend.radiolise.com/api/v1/metadata/?url=https://zt04.cdn.eurozet.pl/ZETPAR.mp3' },
                { name: '4Fun TV', stream_url: 'https://stream.4fun.tv:8888/hls/4f.m3u8', metadata_url: '' }, // Pusty metadata_url
                { name: 'Music Box Tv', stream_url: 'https://vs2143.vcdn.biz/2e63c449bd35ce346c2612440714cfb7_megogo/live/hls/b/4000/u_sid/0/o/156751011/rsid/1caedc22-4080-43bf-88d4-50d1d36c8a10/u_uid/0/u_device/embed_all/u_devicekey/_embed_web/lip/91.94.91.120*asn/type.live/chunklist-sid8525794707307909301-b4000000.m3u8', metadata_url: '' }, // Pusty metadata_url
                { name: 'Disco Party - Polska Impreza', stream_url: 'https://s3.slotex.pl:7152/;', metadata_url: 'https://backend.radiolise.com/api/v1/metadata/?url=https://s3.slotex.pl:7152/;' },
                { name: 'Radio Weekend FM', stream_url: 'https://stream.weekendfm.pl/weekendfm_najlepsza', metadata_url: 'https://backend.radiolise.com/api/v1/metadata/?url=https://stream.weekendfm.pl/weekendfm_najlepsza' },
                { name: 'Radio Vox FM', stream_url: 'https://waw.ic.smcdn.pl/3990-1.mp3', metadata_url: 'https://backend.radiolise.com/api/v1/metadata/?url=https://waw.ic.smcdn.pl/3990-1.mp3' }
            ];

            const stmt = db.prepare("INSERT OR IGNORE INTO stations (name, stream_url, metadata_url) VALUES (?, ?, ?)");
            stations.forEach(station => {
                stmt.run(station.name, station.stream_url, station.metadata_url);
            });
            // Finalize stmt w callbacku, aby upewnić się, że wszystkie operacje run() są zakończone
            stmt.finalize((err) => {
                if (err) {
                    console.error('Błąd finalizacji statementu INSERT:', err.message);
                } else {
                    console.log('Wstępne stacje wstawione lub już istnieją.');
                }
            });
        }); // Koniec db.serialize()
    }
});

// Ważne: Eksport obiektu db musi być poza wszystkimi asynchronicznymi operacjami,
// aby inne moduły mogły go poprawnie zaimportować.
module.exports = db;