<div align="center">
  <img src="./src/assets/icon.png" width="112" height="112" alt="BiliMusic Logo" />
  <h1>BiliMusic</h1>
  <p>
    <strong>Turn Bilibili into a polished, animated, Apple Music inspired desktop music library.</strong>
  </p>
  <p>
    <a href="./README.md">中文</a>
    ·
    <a href="#getting-started">Getting Started</a>
    ·
    ·
    <a href="https://github.com/shangzongyu/BiliMusic">GitHub</a>
  </p>
  <p>
    <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=111" />
    <img alt="Electron" src="https://img.shields.io/badge/Electron-36-47848F?style=for-the-badge&logo=electron&logoColor=fff" />
    <img alt="Vite" src="https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=fff" />
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=fff" />
  </p>
</div>

<br />

<div align="center">
  <table>
    <tr>
      <td align="center" width="25%">
        <h3>Apple Music Style</h3>
        <p>Glass panels, immersive background, spring motion, soft glows.</p>
      </td>
      <td align="center" width="25%">
        <h3>Bilibili Source</h3>
        <p>Search, recommendations, rankings, creators, music-like tracks.</p>
      </td>
      <td align="center" width="25%">
        <h3>Desktop Player</h3>
        <p>Tray, queue, playlists, lyrics, persisted playback state.</p>
      </td>
    </tr>
  </table>
</div>

<br />

<div align="center">
  <pre>
┌──────────────────────────────────────────────────────────────┐
│                        BiliMusic                             │
│  Discover · Search · Queue · Lyrics · Playlists               │
└──────────────────────────────────────────────────────────────┘
  </pre>
</div>

## Table of Contents

- [Vision](#vision)
- [Experience Highlights](#experience-highlights)
- [Feature Map](#feature-map)
- [Interface Design](#interface-design)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Desktop Packaging](#desktop-packaging)
- [Project Structure](#project-structure)
- [Persistence](#persistence)
- [Development Notes](#development-notes)
- [Roadmap](#roadmap)
- [Disclaimer](#disclaimer)

## Vision

BiliMusic is not just a simple video player wrapped in a desktop shell. Its goal is more specific: take the huge, loose, title-noisy, music-rich universe of Bilibili and shape it into something that feels like a real desktop music app.

Video titles are cleaned before lyric search. Search results become music-like track lists. Creator pages can be browsed like artist pages. Queues, favorites, recent tracks, and playlists gradually become a local library. The interface leans toward Apple Music: calm, translucent, animated, and refined, while still staying efficient as a desktop tool.


## Experience Highlights

### 1. Feels Like a Music App

- Discover, recommendations, search, playlists, and settings share one visual language.
- Page transitions, card hover states, player expansion, and lyric movement are animated.
- The bottom player stays compact, while the expanded player becomes immersive.
- Covers, background glow, rotating discs, and animated lyrics work together as one listening scene.

### 2. Turns Bilibili Videos Into Music

- Search Bilibili videos.
- Search users and browse creator spaces.
- Browse discovery, recommendations, and music rankings.
- Convert video results into a unified track model that works with queue, playlists, favorites, and history.

### 3. Built for Long-Term Listening

- Recently played tracks are recorded automatically.
- Favorite tracks have their own library page.
- Custom playlists are persisted locally.
- Playlists can be imported and exported as JSON.
- Playback queue and state are restored after restart.

### 4. Deep Desktop Integration

- Electron main process proxies Bilibili and lyric API requests.
- Closing the main window minimizes to tray.
- Tray state follows current playback.
- Packaging is configured for Windows, macOS, and Linux.

## Feature Map

### Search

The search page is designed as a music discovery surface, not just an input box:

- Video search and user search.
- Apple Music style result rows.
- User results can open creator-space browsing.
- Dedicated empty, loading, and error states.
- Each track supports play, play next, add to queue, and add to playlist.

### Recommendations and Discovery

- Recommendation page uses Bilibili music-related content.
- Discover page aggregates ranking-like content.
- Hero sections use cover art as the visual anchor.
- Track lists stay dense, readable, and quick to scan.

### Player

The bottom player includes:

- Play / pause.
- Previous / next.
- Shuffle.
- Repeat modes.
- Seekable progress.
- Volume and mute.
- Queue drawer.
- Add current track to playlist.
- Expand into the immersive player.

The immersive player includes:

- Large cover art and dynamic background.
- Rotating disc decoration.
- Lyric panel with manual lyric matching.
- Fullscreen toggle.
- Close to tray.
- Collapse back to the main interface.

### Lyrics

Bilibili titles often contain noisy words such as official MV, full version, cover, live, high quality, and more. BiliMusic processes titles before lyric search:

- Removes common video-title noise.
- Extracts quoted and bracketed candidate titles.
- Removes upload descriptions, collections, rankings, and livestream hints.
- Builds multiple search candidates.
- Scores lyric candidates by title similarity, artist, album, and duration.
- Caches both successful and failed matches.
- Supports manual lyric search and version selection.

### Playlists

- Create playlists from the sidebar.
- Configure playlist name and description.
- Playlists appear under the playlist area and in the playlist overview page.
- Tracks from any page can be added through a reusable modal.
- Playlist detail pages support play all, delete playlist, remove one track, and batch remove.
- Batch selection is only shown in edit mode to keep the default interface clean.

### Queue

- View the current queue.
- Current track has a live equalizer indicator.
- Add queued tracks to playlists.
- Remove one track from the queue.
- Enter selection mode for batch removal.

### Settings

The settings page follows a macOS / Apple Music preference style:

- Light / dark / system theme.
- Expanded / collapsed / automatic sidebar.
- Playback quality.
- Auto play.
- Lyric display.
- Download directory.
- Download quality.
- Playlist import and export.
- Account status and QR login entry.

## Interface Design

BiliMusic aims to be expressive without becoming noisy.

| Design Element | Usage                                                   |
| -------------- | ------------------------------------------------------- |
| Glassmorphism  | Sidebar, player, dialogs, and panels                    |
| Dynamic Covers | Hero sections, player background, playlist covers       |
| Spring Motion  | Player expansion, lyric scrolling, button feedback      |
| Icon Buttons   | Lucide icons keep controls compact and recognizable     |
| Light and Dark | Complete support for both themes                        |
| Dense Lists    | Track lists are optimized for scanning and repeated use |

## Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                         React UI                              │
│ Pages · Components · Contexts · Hooks · Services              │
└──────────────────────────────┬───────────────────────────────┘
                               │ window.electronAPI
┌──────────────────────────────▼───────────────────────────────┐
│                    Electron Preload Bridge                    │
│ Bili API · Lyrics API · Window Control · Tray Control         │
└──────────────────────────────┬───────────────────────────────┘
                               │ IPC
┌──────────────────────────────▼───────────────────────────────┐
│                    Electron Main Process                      │
│ Protocol · BrowserWindow · Tray · API Proxy · Persistence     │
└──────────────────────────────┬───────────────────────────────┘
                               │
        ┌──────────────────────┴──────────────────────┐
        │                                             │
┌───────▼────────┐                          ┌─────────▼─────────┐
│ Desktop Builds │                          │ OTA Renderer      │
│ Win/macOS/Linux│                          │ release/ota       │
└────────────────┘                          └───────────────────┘
```

### Frontend Layer

- `pages/` contains route-level pages.
- `components/` contains player, lyrics, queue, layout, and shared UI.
- `contexts/` manages playback, auth, now-playing, and add-to-playlist state.
- `services/` encapsulates Bilibili data, lyric matching, and local library storage.
- `hooks/` provides settings, theme, and lyric state logic.

### Electron Layer

- The main process registers Bilibili API, lyric API, and window-control IPC handlers.
- A custom `app://` protocol is used in production to avoid ESM/CORS issues under `file://`.
- Tray and main-window lifecycle are managed in the main process.
- `preload.cjs` exposes a limited bridge to the renderer.

## Getting Started

### Requirements

- Node.js 20 or newer.
- npm.
- A matching OS environment for desktop packaging.

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Start Electron

```bash
npm run electron:start
```

## Desktop Packaging

```bash
npm run electron:build
```

Artifacts are written to:

```text
release/
```

Configured targets:

- Windows: NSIS installer.
- macOS: DMG and ZIP.
- Linux: AppImage and DEB.

## Scripts

| Command                   | Description                              |
| ------------------------- | ---------------------------------------- |
| `npm run dev`             | Start Vite dev server                    |
| `npm run build`           | Build frontend and Electron main process |
| `npm run preview`         | Preview frontend build                   |
| `npm run electron:start`  | Build and start Electron                 |
| `npm run electron:build`  | Package desktop installers               |

## Project Structure

```text
BiliMusic
├─ electron/
│  ├─ main.ts                Electron main process
│  ├─ preload.cjs            Renderer bridge
│  ├─ biliApi.ts             Bilibili API proxy
│  ├─ lyricsApi.ts           Lyrics API proxy
│  ├─ icon.png               Desktop app icon
│  └─ tray.png               Tray icon
├─ src/
│  ├─ assets/                Frontend assets
│  ├─ components/            Player, queue, lyrics, layout, shared UI
│  ├─ contexts/              Playback, auth, now-playing, playlist modal state
│  ├─ hooks/                 Theme, settings, lyrics hooks
│  ├─ pages/                 Discover, search, recommendations, playlists, downloads, settings
│  ├─ services/              Bilibili data, lyric matching, local storage
│  ├─ styles/                Global styles and Apple Music design system
│  └─ types/                 Electron bridge and domain types
├─ scripts/
├─ dist/                     Frontend build output
├─ dist-electron/            Electron build output
└─ release/                  Desktop package output
```

## Persistence

BiliMusic stores:

- Current track.
- Playback queue.
- Playback progress.
- Volume, mute, shuffle, repeat.
- Recently played tracks.
- Favorites.
- Custom playlists.
- Lyric cache and manually selected matches.
- Theme and settings.
- Basic logged-in user display information.

Storage locations:

- `localStorage`: frontend state, library data, playlists, lyric cache.
- Electron `userData`: desktop data such as downloads.

## Development Notes

### Title Cleaning and Lyric Matching

Lyric matching lives in `src/services/lyrics.ts`. It performs:

- Unicode normalization.
- Common video-noise removal.
- Quoted-title extraction.
- Upload-description, collection, ranking, and livestream hint removal.
- Multiple keyword generation.
- Candidate scoring by similarity, artist, album, and duration.

### Playback State

Playback state lives in `src/contexts/PlayerContext.tsx`:

- Queue.
- Current track.
- Playing state.
- Volume.
- Progress.
- Shuffle and repeat.
- Auto play.
- Tray state sync.

### Playlists

Playlist behavior is split across services and UI:

- `src/services/playlists.ts` persists playlist data.
- `Sidebar` creates playlists.
- `AddToPlaylistContext` provides the reusable add modal.
- `Playlists` handles overview, detail, and batch editing.

### Window Strategy

Window behavior lives mainly in `electron/main.ts`:

- Regular platforms use custom window buttons.
- Closing the window hides it to tray.
- Production loads the renderer from `app://local/index.html`.

## Roadmap

- [ ] More complete local download management.
- [ ] Configurable lyric sources and fallback.
- [ ] More accurate Bilibili audio-quality selection.
- [ ] Editable playlist covers.
- [ ] Listening statistics.
- [ ] Mini player.
- [ ] More complete automated tests.

## Contributing

Issues, suggestions, and pull requests are welcome. This project is strongly experience-driven, so UI quality, motion, cross-platform behavior, lyric matching, and stability all matter.

Before submitting changes, at least run:

```bash
npm run build
```

## Disclaimer

BiliMusic is intended for learning, research, and personal use. It is not affiliated with, endorsed by, or commercially connected to Bilibili, Apple Music, Apple Inc., or any related service provider. The project does not bundle audio, video, or lyric resources.

Please respect platform terms, copyright rules, and local laws. Do not use this project for copyright infringement, platform abuse, or bypassing service restrictions.

## Author

Designed and built by MikannQAQ.
