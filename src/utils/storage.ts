import type { AppSettings, Playlist, Track } from '@/types'

const RECENT_KEY = 'bilimusic_recent'
const FAVORITES_KEY = 'bilimusic_favorites'
const PLAYLISTS_KEY = 'bilimusic_playlists'
const SETTINGS_KEY = 'bilimusic_settings'
export const PLAYLISTS_CHANGED_EVENT = 'bilimusic:playlists-changed'
export const SETTINGS_CHANGED_EVENT = 'bilimusic:settings-changed'

export const DEFAULT_APP_SETTINGS: AppSettings = {
  sidebarState: 'auto',
  playQuality: '高品质',
  downloadQuality: '高品质',
  downloadDir: 'D:\\Music\\biliMusic',
  autoPlay: true,
  showLyrics: true,
}

function notifySettingsChanged() {
  window.dispatchEvent(new CustomEvent(SETTINGS_CHANGED_EVENT))
}

export function loadRecentTracks(): Track[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveRecentTracks(tracks: Track[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(tracks.slice(0, 50)))
  } catch { /* ignore */ }
}

export function addRecentTrack(track: Track) {
  const recent = loadRecentTracks().filter(t => t.id !== track.id)
  recent.unshift({ ...track, isLiked: track.isLiked })
  saveRecentTracks(recent)
}

export function loadFavoriteTracks(): Track[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveFavoriteTracks(tracks: Track[]) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(tracks))
  } catch { /* ignore */ }
}

export function toggleFavoriteTrack(track: Track): Track[] {
  const favs = loadFavoriteTracks()
  const idx = favs.findIndex(t => t.id === track.id)
  if (idx >= 0) {
    favs.splice(idx, 1)
  } else {
    favs.unshift({ ...track, isLiked: true })
  }
  saveFavoriteTracks(favs)
  return favs
}

function notifyPlaylistsChanged() {
  window.dispatchEvent(new CustomEvent(PLAYLISTS_CHANGED_EVENT))
}

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `playlist_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function loadPlaylists(): Playlist[] {
  try {
    const raw = localStorage.getItem(PLAYLISTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function savePlaylists(playlists: Playlist[]) {
  try {
    localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists))
    notifyPlaylistsChanged()
  } catch {
    // ignore
  }
}

export function createPlaylist(input: { name: string; description?: string; coverUrl?: string }): Playlist {
  const now = new Date().toISOString()
  const playlist: Playlist = {
    id: createId(),
    name: input.name.trim(),
    description: input.description?.trim() || '',
    coverUrl: input.coverUrl?.trim() || '',
    tracks: [],
    createdAt: now,
    updatedAt: now,
  }
  savePlaylists([playlist, ...loadPlaylists()])
  return playlist
}

export function getPlaylist(id: string): Playlist | null {
  return loadPlaylists().find(p => p.id === id) || null
}

export function updatePlaylist(updated: Playlist): void {
  const playlists = loadPlaylists()
  savePlaylists(playlists.map(p => p.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : p))
}

export function deletePlaylist(id: string): void {
  savePlaylists(loadPlaylists().filter(p => p.id !== id))
}

export function addTrackToPlaylist(playlistId: string, track: Track): Playlist | null {
  const playlists = loadPlaylists()
  let updatedPlaylist: Playlist | null = null
  const updated = playlists.map((playlist) => {
    if (playlist.id !== playlistId) return playlist
    const exists = playlist.tracks.some(t => t.id === track.id)
    updatedPlaylist = {
      ...playlist,
      coverUrl: playlist.coverUrl || track.coverUrl,
      tracks: exists ? playlist.tracks : [...playlist.tracks, track],
      updatedAt: new Date().toISOString(),
    }
    return updatedPlaylist
  })
  if (updatedPlaylist) savePlaylists(updated)
  return updatedPlaylist
}

export function loadAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_APP_SETTINGS
    return { ...DEFAULT_APP_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_APP_SETTINGS
  }
}

export function saveAppSettings(settings: AppSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    notifySettingsChanged()
  } catch {
    // ignore
  }
}

export function updateAppSettings(patch: Partial<AppSettings>): AppSettings {
  const next = { ...loadAppSettings(), ...patch }
  saveAppSettings(next)
  return next
}

export function createPlaylistsExport() {
  return {
    app: 'biliMusic',
    type: 'playlists',
    version: 1,
    exportedAt: new Date().toISOString(),
    playlists: loadPlaylists(),
  }
}

function isPlainPlaylist(value: unknown): value is Playlist {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<Playlist>
  return typeof item.name === 'string' && Array.isArray(item.tracks)
}

export function importPlaylistsFromText(text: string): { imported: number; skipped: number } {
  const parsed = JSON.parse(text)
  const incoming = Array.isArray(parsed) ? parsed : parsed?.playlists
  if (!Array.isArray(incoming)) {
    throw new Error('文件中没有找到歌单列表')
  }

  const now = new Date().toISOString()
  const existing = loadPlaylists()
  const existingIds = new Set(existing.map(playlist => playlist.id))
  const existingNames = new Set(existing.map(playlist => playlist.name.trim()))
  const imported: Playlist[] = []
  let skipped = 0

  for (const item of incoming) {
    if (!isPlainPlaylist(item)) {
      skipped += 1
      continue
    }

    const name = item.name.trim()
    if (!name) {
      skipped += 1
      continue
    }

    const id = item.id && !existingIds.has(item.id) ? item.id : createId()
    existingIds.add(id)
    const finalName = existingNames.has(name) ? `${name} 导入` : name
    existingNames.add(finalName)

    imported.push({
      id,
      name: finalName,
      description: item.description || '',
      coverUrl: item.coverUrl || item.tracks[0]?.coverUrl || '',
      tracks: item.tracks,
      createdAt: item.createdAt || now,
      updatedAt: now,
    })
  }

  if (imported.length > 0) {
    savePlaylists([...imported, ...existing])
  }

  return { imported: imported.length, skipped }
}

export function removeTracksFromPlaylist(playlistId: string, trackIds: string[]): Playlist | null {
  const ids = new Set(trackIds)
  if (ids.size === 0) return getPlaylist(playlistId)
  const playlists = loadPlaylists()
  let updatedPlaylist: Playlist | null = null
  const updated = playlists.map((playlist) => {
    if (playlist.id !== playlistId) return playlist
    updatedPlaylist = {
      ...playlist,
      tracks: playlist.tracks.filter(track => !ids.has(track.id)),
      updatedAt: new Date().toISOString(),
    }
    return updatedPlaylist
  })
  if (updatedPlaylist) savePlaylists(updated)
  return updatedPlaylist
}
