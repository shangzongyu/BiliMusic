import { app, ipcMain } from 'electron'
import { DatabaseSync } from 'node:sqlite'
import path from 'path'

type HistoryTrackInput = {
  id: string
  title: string
  artist: string
  coverUrl?: string
  duration?: number
  bvid?: string
}

type HistoryStats = {
  totalPlays: number
  totalDuration: number
  topArtist: { name: string; plays: number } | null
  topTrack: { id: string; title: string; artist: string; plays: number } | null
}

let db: DatabaseSync | null = null

function getDb(): DatabaseSync {
  if (db) return db

  const dbPath = path.join(app.getPath('userData'), 'bilimusic.db')
  db = new DatabaseSync(dbPath)
  db.exec('PRAGMA journal_mode = WAL')
  db.exec(`
    CREATE TABLE IF NOT EXISTS play_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      track_id TEXT NOT NULL,
      title TEXT NOT NULL,
      artist TEXT NOT NULL,
      cover_url TEXT,
      duration INTEGER NOT NULL DEFAULT 0,
      bvid TEXT,
      played_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_play_history_played_at ON play_history (played_at);
    CREATE INDEX IF NOT EXISTS idx_play_history_track_id ON play_history (track_id);
    CREATE INDEX IF NOT EXISTS idx_play_history_artist ON play_history (artist);
  `)
  return db
}

function sanitizeTrack(input: HistoryTrackInput | null | undefined): HistoryTrackInput | null {
  if (!input || typeof input.id !== 'string' || typeof input.title !== 'string' || typeof input.artist !== 'string') {
    return null
  }
  return {
    id: input.id,
    title: input.title.trim() || '未知曲目',
    artist: input.artist.trim() || '未知作者',
    coverUrl: typeof input.coverUrl === 'string' ? input.coverUrl : '',
    duration: Math.max(0, Number(input.duration || 0)),
    bvid: typeof input.bvid === 'string' ? input.bvid : '',
  }
}

function recordPlay(track: HistoryTrackInput): void {
  getDb().prepare(`
    INSERT INTO play_history (track_id, title, artist, cover_url, duration, bvid, played_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    track.id,
    track.title,
    track.artist,
    track.coverUrl || '',
    Math.max(0, Number(track.duration || 0)),
    track.bvid || '',
    Date.now(),
  )
}

function getStats(): HistoryStats {
  const database = getDb()
  const total = database.prepare(`
    SELECT COUNT(*) AS totalPlays, COALESCE(SUM(duration), 0) AS totalDuration
    FROM play_history
  `).get() as { totalPlays: number; totalDuration: number }

  const topArtist = database.prepare(`
    SELECT artist AS name, COUNT(*) AS plays
    FROM play_history
    GROUP BY artist
    ORDER BY plays DESC, MAX(played_at) DESC
    LIMIT 1
  `).get() as HistoryStats['topArtist'] | undefined

  const topTrack = database.prepare(`
    SELECT track_id AS id, title, artist, COUNT(*) AS plays
    FROM play_history
    GROUP BY track_id, title, artist
    ORDER BY plays DESC, MAX(played_at) DESC
    LIMIT 1
  `).get() as HistoryStats['topTrack'] | undefined

  return {
    totalPlays: Number(total?.totalPlays || 0),
    totalDuration: Number(total?.totalDuration || 0),
    topArtist: topArtist?.name ? topArtist : null,
    topTrack: topTrack?.id ? topTrack : null,
  }
}

function clearHistory(): void {
  getDb().prepare('DELETE FROM play_history').run()
}

export function registerPlayHistoryHandlers() {
  ipcMain.handle('history:record', (_event, payload: HistoryTrackInput) => {
    const track = sanitizeTrack(payload)
    if (!track) return { ok: false }
    recordPlay(track)
    return { ok: true }
  })

  ipcMain.handle('history:stats', () => getStats())
  ipcMain.handle('history:clear', () => {
    clearHistory()
    return { ok: true }
  })
}
