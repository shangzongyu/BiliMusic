import { useEffect, useState, useCallback } from "react";
import { BarChart3, Clock, Disc3, Play, Timer, Trash2, UserRound } from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";
import { loadRecentTracks, RECENT_CHANGED_EVENT, saveRecentTracks } from "@/utils/storage";
import {
  ActionButton,
  EmptyLibrary,
  formatDuration,
  MusicHero,
  MusicPageShell,
  MusicSection,
  TrackList,
  TrackListRow,
  defaultIconFor,
} from "@/components/AppleMusicPage";
import type { Track } from "@/types";
import type { PlayHistoryStats } from "@/types/electron";

const EMPTY_STATS: PlayHistoryStats = {
  totalPlays: 0,
  totalDuration: 0,
  topArtist: null,
  topTrack: null,
}

export default function Recent() {
  const [tracks, setTracks] = useState<Track[]>(() => loadRecentTracks());
  const [stats, setStats] = useState<PlayHistoryStats>(EMPTY_STATS);
  const player = usePlayer();

  useEffect(() => {
    const refresh = () => setTracks(loadRecentTracks());
    window.addEventListener(RECENT_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(RECENT_CHANGED_EVENT, refresh);
  }, []);

  useEffect(() => {
    let cancelled = false
    const loadStats = async () => {
      try {
        const next = await window.electronAPI?.getPlayHistoryStats?.()
        if (!cancelled && next) setStats(next)
      } catch {
        if (!cancelled) setStats(EMPTY_STATS)
      }
    }
    loadStats()
    return () => { cancelled = true }
  }, [tracks.length]);

  const handleClear = useCallback(() => {
    saveRecentTracks([]);
  }, []);

  const handleResetStats = useCallback(async () => {
    try {
      await window.electronAPI?.clearPlayHistory?.()
      setStats(EMPTY_STATS)
    } catch {
      // ignore reset failures
    }
  }, []);

  const handlePlayAll = useCallback(() => {
    if (tracks.length > 0) player.playAll(tracks);
  }, [tracks, player]);

  const heroImage = tracks[0]?.coverUrl;
  const statCards = [
    { label: "总播放次数", value: `${stats.totalPlays} 次`, note: "按本地完整播放历史累计", icon: <Disc3 size={18} /> },
    { label: "累计时长", value: formatDuration(stats.totalDuration), note: "按每次播放记录的曲目时长累计", icon: <Timer size={18} /> },
    { label: "常听作者", value: stats.topArtist?.name || "暂无", note: stats.topArtist ? `共播放 ${stats.topArtist.plays} 次` : "播放后将自动统计", icon: <UserRound size={18} /> },
    { label: "最常播放曲目", value: stats.topTrack?.title || "暂无", note: stats.topTrack ? `${stats.topTrack.artist} · ${stats.topTrack.plays} 次` : "播放后将自动统计", icon: <BarChart3 size={18} /> },
  ];

  return (
    <MusicPageShell>
      <MusicHero
        eyebrow="Recently Played"
        title="最近播放"
        subtitle={
          tracks.length
            ? `继续回到刚刚听过的 ${tracks.length} 首音乐。`
            : "播放歌曲后，最近听过的内容会在这里聚合。"
        }
        image={heroImage}
        tone="blue"
        action={
          tracks.length > 0 && (
            <>
              <ActionButton onClick={handlePlayAll}>
                <Play size={17} fill="currentColor" />
                播放全部
              </ActionButton>
              <ActionButton onClick={handleResetStats} tone="subtle">
                <BarChart3 size={16} />
                重置统计
              </ActionButton>
              <ActionButton onClick={handleClear} tone="subtle">
                <Trash2 size={16} />
                清空
              </ActionButton>
            </>
          )
        }
      />

      {tracks.length === 0 ? (
        <>
          <MusicSection title="历史统计" icon={<BarChart3 size={22} />}>
            <div className="recent-stats-grid">
              {statCards.map((stat) => (
                <article key={stat.label} className="recent-stat-card">
                  <div className="recent-stat-card__icon">{stat.icon}</div>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                  <small>{stat.note}</small>
                </article>
              ))}
            </div>
          </MusicSection>
          <EmptyLibrary
            icon={defaultIconFor("recent")}
            title="暂无播放记录"
            subtitle="播放歌曲后将在此显示。"
          />
        </>
      ) : (
        <>
          <MusicSection title="历史统计" icon={<BarChart3 size={22} />}>
            <div className="recent-stats-grid">
              {statCards.map((stat) => (
                <article key={stat.label} className="recent-stat-card">
                  <div className="recent-stat-card__icon">{stat.icon}</div>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                  <small>{stat.note}</small>
                </article>
              ))}
            </div>
          </MusicSection>
          <MusicSection title="播放记录" icon={<Clock size={22} />}>
            <TrackList>
              {tracks.map((track, index) => (
                <TrackListRow
                  key={track.id + String(index)}
                  track={track}
                  index={index + 1}
                  isCurrent={player.currentTrack?.id === track.id}
                  isPlaying={player.isPlaying}
                  onPlay={() => player.playNow(track)}
                />
              ))}
            </TrackList>
          </MusicSection>
        </>
      )}
    </MusicPageShell>
  );
}
