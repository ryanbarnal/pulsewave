<p align="center"><img src="web/logo.svg" width="120" alt="Pulsewave logo"></p>
<h1 align="center">Pulsewave</h1>
<p align="center">Music player with visual effects and a 10-band equalizer.<br>Created by <b>Ryan Ocbina Barnal</b></p>

**Web app:** https://pulsewave.ryanbarnal.com · **Downloads:** https://pulsewave.ryanbarnal.com/download.html · **Manual:** https://pulsewave.ryanbarnal.com/help.html

## Features
- Animated intro
- 5 visual effects (Bars, Wave, Radial, Galaxy, Tunnel), 5 color themes and beat-reactive glow
- 10-band equalizer with 12 presets, bass boost and balance
- Playlist, shuffle, repeat, drag and drop, media keys and lock-screen controls
- Installable on phones (PWA), plus Windows (.exe) and macOS (.dmg) installers
- Built-in help and a full user manual

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

## License
GPL-3.0 · © 2026 Ryan Ocbina Barnal
