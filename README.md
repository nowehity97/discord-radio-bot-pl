# 📻 Polski Radio Bot Discord

Bot do odtwarzania stacji radiowych na Discordzie – działa jak złoto, nie zżera RAMu, a jak coś nie działa, to pewnie Twoja wina 😎

## ⚙️ Konfiguracja bota

1. Wejdź na [Discord Developer Portal](https://discord.com/developers/applications)
2. Utwórz nową aplikację → zakładka **Bot** → dodaj bota
3. Skopiuj token i wrzuć do pliku `.env`:
   ```env
   DISCORD_TOKEN=tu_wklej_token
   DISCORD_CLIENT_ID=tu_id_bota
   DEVELOPER_ID=twoje_id
   YOUTUBE_API_KEY=klucz_youtube_api_v3
   ```
4. Odpal terminal/cmd w folderze z botem:
   ```bash
   npm i
   ```
5. Jak chcesz dodać własne stacje, to po edycji `db.js` odpal:
   ```bash
   node db.js
   ```
   Domyślna baza już jest dołączona – więc nie musisz kombinować, jak nie chcesz.

---

## 🧠 Komendy bota

| Komenda | Opis |
|--------|------|
| `/play [url-stream-radio]` | Odtwarza radio z podanego URL |
| `/add-station` | Dodaje nową stację (tylko developer) |
| `/edit-station` | Edytuje stację (tylko developer) |
| `/remove-station` | Usuwa stację (tylko developer) |
| `/co-gra` | Pokazuje aktualnie odtwarzany utwór lub program |
| `/help` | Wyświetla listę komend |
| `/info` | Pokazuje statystyki bota |
| `/np` | Alias dla `/co-gra` |
| `/preset save` | Zapisuje listę stacji jako preset |
| `/preset load` | Ładuje zapisany preset |
| `/preset list` | Pokazuje listę zapisanych presetów |
| `/preset delete` | Usuwa preset |
| `/radio-info` | Info o stacji + aktualny utwór |
| `/radio` | Odtwarza wybraną stację |
| `/search-station` | Szuka stacji po nazwie |
| `/share-song` | Generuje linki do szukania utworu na YouTube i Google |
| `/stations` | Lista dostępnych stacji |
| `/stop` | Zatrzymuje odtwarzanie |
| `/volume` | Ustawia głośność |

---

## 📝 Uwagi

- Jak coś nie działa, sprawdź dwa razy czy nie zjebałeś w `.env`.
- Youtube API key to **v3**, bez tego nie będzie wyszukiwania utworów.
- Bot nie robi kawy ani nie rozwiązuje problemów egzystencjalnych – ale radio puści.

---

## ☕ Wsparcie

Masz pytania? Chcesz dodać nowe funkcje? Nie umiesz czytać stack trace? Pisz do developera (o ile nie jesteś idiotą):

**Developer ID:** `331146505098493952`

---

## 📦 Licencja

Ten bot to open-source. Rób z tym co chcesz, ale jak sprzedajesz komuś gówno z moim kodem – to karma Cię dojedzie.
