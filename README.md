# Roon for DankMaterialShell

A [DankMaterialShell](https://danklinux.com) plugin that puts [Roon](https://roon.app) on your desktop.

<p align="center"><img src="screenshots/popout.png" width="420" alt="Roon popout: now playing"></p>

| Bar pill | Library browser | Launcher search |
| --- | --- | --- |
| ![Bar pill](screenshots/pill.png) | ![Library browser](screenshots/browser.png) | ![Launcher search](screenshots/launcher.png) |

- **Bar widget**: now-playing pill with title, artist and transport. Click opens the popout (or the Roon dash tab), middle click toggles playback, scroll changes the volume or skips tracks depending on what you pick in "Scroll action". The popout has album art, a seek bar, shuffle/repeat/Roon Radio, per-output volume, queue, library browser and zone picker. The pill shrinks to fit the title by default.
- **Dash tab** (DMS 1.7): a grid of widgets you can move, resize, remove and add back. Now playing, Lyrics, Queue, Zones and Volume are placed by default, and Browse is in the "Add widget" menu. Open it with `dms ipc call dash open plugin_roon`.
- **Dash card** (DMS 1.7): track, art, seek bar and transport, sized like the built-in media card. Click opens the Roon tab. Add it via the dash's Edit → Add widget.
- **Control Center tile**: play/pause toggle with compact controls.
- **Launcher**: type `roon <query>` in DankLauncher to search your library. Tracks play; albums, artists and playlists open in a centered library browser. Hit Tab on a result for Play Now / Queue / Add Next / Start Radio. `roon` alone lists transport shortcuts, the library browser and your zones.
- **Desktop widget**: resizable now-playing card on the desktop layer.
- **MPRIS bridge**: the selected zone shows up as an MPRIS player, so media keys, `playerctl` and DMS's own media widget work.
- **Open in Roon**: focuses your Roon window or launches the app via Bottles.
- **IPC**: `dms ipc call roon playpause|next|previous|volume up|zone "Living Room"|seek +10|browse|popout zones|open|status` for compositor keybinds.

## Lyrics

Roon's extension API has no lyrics endpoint. Their web display does get them, though.

With "Lyrics from Roon" on (the default), the Node bridge opens a second WebSocket that registers exactly like Roon's own web display page, publisher and all. It shows up in Roon → Settings → Displays as "DankMaterialShell on \<hostname\>". Roon just believes it.

Roon pushes synced lyrics for every zone, plus the track's waveform. Lyrics also reach DMS's built-in Media tab through the MPRIS bridge, which writes .lrc files to the cache. The "Enable lyrics" switch in Roon → Settings → Displays is already on for new displays, so no setup is needed. That switch is where you'd turn lyrics off. Turning "Lyrics from Roon" off drops the second connection and the waveform with it.

The Roon tab's Lyrics widget centers the current line and highlights it, like the Media tab's lyrics. Scroll by hand and a "Follow playback" button appears at the bottom center to bring you back. Click any line to seek there. When Roon only has unsynced lyrics for a track, it keeps them to itself and the widget says so. When Roon sends nothing, the widget falls back to DMS's own lyrics providers and credits the source.

## How it works

Roon's API is WebSocket-based and only ships as Node.js packages, so the plugin runs a small
Node sidecar (`dist/roon-bridge.cjs`, bundled from `bridge/`) that discovers and pairs with Roon
Server, and talks to the QML side over stdio as JSON lines. Album art loads straight from
Roon Server's HTTP image endpoint. The lyrics connection is a second WebSocket to the same
core, described above.

## Requirements

- DankMaterialShell ≥ 1.7
- Node.js ≥ 20 on `PATH`
- Roon Server reachable on the LAN (auto-discovery) or via a manual host:port

## Install

```sh
git clone https://github.com/NoaHimesaka1873/dms-plugin-roon ~/.config/DankMaterialShell/plugins/Roon
```

1. DMS Settings → Plugins → enable **Roon**.
2. Add the **Roon** widget to a DankBar section (and/or the desktop widget or dash card).
3. In Roon: Settings → Extensions → **Enable** next to *DMS Roon*.

The lyrics connection needs no separate setup.

## Settings

DMS Settings → Plugins → Roon:

- **Connection**: "Connection mode" (Auto-discover / Manual host), "Manual host", "Manual port", "Preferred zone", "MPRIS bridge", "Restart bridge", "Re-pair".
- **Lyrics**: "Lyrics from Roon" (on by default; toggling restarts the bridge).
- **Now playing**: "Seek bar style" picks between Flat, Wavy (DMS's Material 3 wave) and Spectrum (the track's waveform from Roon, the default). Spectrum falls back to Wavy when there's no waveform, like when "Lyrics from Roon" is off.
- **Bar widget**: "Size" (Small / Medium / Large / Largest, the same scale as the built-in media widget), "Click opens" (Popout / Roon dash tab), "Fit to title" (shrinks the pill to match, on by default), "Text format", "Bar icon" (None / Note / Roon logo / Album art), "Show when idle", "Scroll action" (Volume / Change track / Nothing), "Scroll volume step". "Sized variants" adds extra "Roon: \<name\>" widgets to the DankBar widget list, each with its own size, so different bars can use different pills. The bar entry's `mediaSize` is honoured too.
- **Desktop widget**: "Background opacity", "Album art only".
- **Roon app**: the plugin detects Bottles (Flatpak or native) and a bottle named `Roon`. "Open Roon" buttons appear only when the app is found; with Bottles but no Roon, "Set up Roon in Bottles" creates the bottle and opens Bottles, where *Install Programs → Roon* applies the [official Roon installer manifest](https://github.com/bottlesdevs/programs/blob/main/Software/roon.yml) (.NET Desktop 10, the Roon installer, and the program entry). "Roon window title", "Launch command override".

The dash card's options (Album art, Progress bar, Card color) live in the dash's own options sheet, not here.

## Development

```sh
cd bridge
npm install --allow-git=all   # the Roon API packages are git dependencies
npm run build                 # → ../dist/roon-bridge.cjs
node ../dist/roon-bridge.cjs --state-dir /tmp/roon-dev --linger 30   # standalone test
dms ipc call plugins reload roon   # after editing surface QML (bar widget, daemon, launcher, desktop, dash tab and card)
dms restart                        # after editing services/, components/, assets/ or RoonSettings.qml
```

Never run a second copy of the bridge while DMS has one running. It registers as the same Roon extension, and the core kicks the other connection.

## Credits

The Roon logo artwork comes from [Simple Icons](https://simpleicons.org) (CC0). Roon is a trademark of Roon Labs. Slop-assisted: written with [Claude Code](https://claude.com/claude-code) under my direction. I tested everything, the code just isn't handwritten.

## License

MIT
