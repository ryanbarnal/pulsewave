<p align="center"><img src="web/logo.svg" width="120" alt="Pulsewave logo"></p>
<h1 align="center">Pulsewave</h1>
<p align="center">Music player with visual effects and a 10-band equalizer.<br>Created by <b>Ryan Ocbina Barnal</b></p>

**Web app:** https://pulsewave.ryanbarnal.com · **Downloads:** https://pulsewave.ryanbarnal.com/download.html · **Manual:** https://pulsewave.ryanbarnal.com/help.html

## Features
- Phone layout with a bottom tab bar and mini player; minimal outline icons; Dark / Light / Auto appearance and six accent colours; Lite visuals for phones
- Animated intro
- 5 visual effects (Bars, Wave, Radial, Galaxy, Tunnel), 5 color themes and beat-reactive glow
- Letter-by-letter lyrics that follow the singer's voice, tap-to-time exact word timing, 13 lyric fonts
- Karaoke mode: turns down the singer's voice, and lyrics fill word by word and pulse with the beat
- Lyrics screen with album-art backdrop, album art during instrumental breaks, and song trivia (iTunes and Wikipedia)
- Lyrics (.lrc files, lyrics inside MP3s, LRCLIB online search, or paste your own)
- 10-band equalizer with 12 presets, bass boost and balance
- Apple Music–style library: playlists, favorites, songs, artists, albums, album art, search, Up Next queue (saved on the device)
- Shuffle, repeat, drag and drop, media keys and lock-screen controls
- Sync between phone and computer: pair with a QR code, then songs, playlists, folders and favorites stay the same (direct device-to-device, no account)
- Installable on phones (PWA), plus Windows (.exe) and macOS (.dmg) installers
- Built-in help and a full user manual

## Family server (QNAP / any NAS with Docker)
`server/` is **Pulsewave Server**, a private family music server. It streams your NAS music folder to the Pulsewave app, with an account per family member, shared playlists, listen links (no account needed), uploads and shared lyrics. A Cloudflare Tunnel publishes it at https://media.ryanbarnal.com so the website can use it from anywhere. The image is `ghcr.io/ryanbarnal/pulsewave-server` (amd64 + arm64), and `server/docker-compose.yml` is ready for QNAP Container Station. See the [setup guide](https://pulsewave.ryanbarnal.com/family-server.html).

## Project layout
| Path | What it is |
|---|---|
| `web/` | The app itself (HTML/CSS/JS). Served as the website and bundled into the desktop app. |
| `web/config.js` | App name, tagline and credit. Change the name here. |
| `main.js` | Electron desktop wrapper |
| `logos/` | The 5 logo options (option 2 is in use) |
| `.github/workflows/pages.yml` | Publishes `web/` to pulsewave.ryanbarnal.com |
| `.github/workflows/build.yml` | Builds the Windows and Mac installers and attaches them to a GitHub Release |

## Run locally
```bash
npm install
npm start          # desktop app
npm run serve      # web app in your browser
```

## Release new installers
Bump `version` in `package.json` and `web/config.js`, then push a tag:
```bash
git tag v1.0.1 && git push origin v1.0.1
```

## Third-party
- [PeerJS](https://peerjs.com) (MIT) for device-to-device sync
- [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (MIT) for pairing QR codes

## License
GPL-3.0 · © 2026 Ryan Ocbina Barnal
