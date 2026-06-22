# AGENTS.md instructions

## Project Overview

BiliMusic is a Vite + React 19 + Electron desktop music player for Bilibili content.

- Renderer: `src/`
- Electron main/preload: `electron/`
- OTA renderer bundle script: `scripts/build-ota.mjs`
- Release workflow: `.github/workflows/build.yml`
- Package and electron-builder config: `package.json`

## Commands

```bash
npm ci
npm run dev
npm run build
npm run electron:start
npm run electron:build
npm run build:ota
```

There is no dedicated test script in `package.json`. Use `npm run build` as the minimum validation after TypeScript or bundling changes.

## Code Layout

- `src/pages/`: route pages.
- `src/components/`: reusable UI, player, layout, queue, lyrics, dialogs.
- `src/contexts/`: app-wide state for player, auth, now playing, playlists.
- `src/hooks/`: app settings, theme, lyrics, sync helpers.
- `src/services/`: Bilibili API, lyrics, local app data services.
- `src/utils/`: persistence and sync utilities.
- `electron/main.ts`: BrowserWindow, tray, protocol, IPC registration, request header handling.
- `electron/preload.cjs`: renderer bridge exposed as `window.electronAPI`.
- `electron/*Api.ts`: main-process API handlers.
- `electron/updater*.ts`: full app update and renderer OTA update logic.

## Conventions

- TypeScript is strict. Keep unused locals/params out of commits.
- Prefer `@/` imports for renderer code under `src/`.
- Keep Electron runtime dependencies externalized in `vite.config.ts` when they need to remain real runtime modules.
- Do not add new abstractions for one call site. Small direct changes are preferred.
- Keep Chinese user-facing copy consistent with the existing app.
- Do not reintroduce HarmonyOS code, docs, scripts, or release targets.

## Electron And OTA Notes

- Production renderer loads through the custom `app://` protocol, not `file://`.
- Bilibili request header/CORS handling is centralized in `electron/main.ts`; avoid registering competing `webRequest` listeners.
- `npm run build` copies `electron/preload.cjs`, `electron/icon.png`, and optional `electron/tray.png` into `dist-electron/`.
- `scripts/build-ota.mjs` packages `dist/` into `release/ota/renderer-<version>.asar` and writes `ota.json`.
- If renderer changes require new main-process IPC, raise `OTA_MIN_SHELL` when generating OTA assets.

## Releases

`.github/workflows/build.yml` builds desktop artifacts for Windows, macOS, and Linux on `v*` tags, uploads artifacts, then publishes them to GitHub Releases.

The configured release repo is `shangzongyu/BiliMusic`.
