import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
  Volume2,
  VolumeX,
  ListMusic,
  Mic,
  Music,
} from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { usePlayer } from '@/contexts/PlayerContext'
import PlayQueue from '@/components/PlayQueue'

export default function PlayerBar() {
  const player = usePlayer()
  const [queueOpen, setQueueOpen] = useState(false)
  const trackDuration = player.duration || player.currentTrack?.duration || 0

  return (
    <div
      style={{
        height: 72,
        background: 'var(--glass-bg-heavy)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid var(--glass-border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 var(--space-lg)',
        gap: 'var(--space-lg)',
        flexShrink: 0,
      } as React.CSSProperties}
    >
      {/* Left — Track Info */}
      <div
        style={{
          width: 220,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-md)',
            background: player.currentTrack
              ? 'var(--color-card)'
              : 'var(--color-border)',
            overflow: 'hidden',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {player.currentTrack?.coverUrl ? (
            <img
              src={player.currentTrack.coverUrl}
              alt={player.currentTrack.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Music size={20} style={{ color: 'var(--color-muted)' }} />
          )}
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            className="text-body"
            style={{
              color: player.currentTrack
                ? 'var(--color-foreground)'
                : 'var(--color-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {player.currentTrack?.title || '未在播放'}
          </div>
          <div
            className="text-caption"
            style={{
              color: 'var(--color-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {player.currentTrack?.artist || '搜索并添加音乐'}
          </div>
        </div>

        {player.currentTrack && (
          <button
            onClick={() => player.toggleLike(player.currentTrack!.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: player.currentTrack.isLiked
                ? 'var(--color-primary)'
                : 'var(--color-muted)',
              padding: 4,
              transition: 'color var(--duration-fast)',
            }}
          >
            <Heart
              size={18}
              fill={player.currentTrack.isLiked ? 'currentColor' : 'none'}
            />
          </button>
        )}
      </div>

      {/* Center — Controls + Progress */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          maxWidth: 600,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <ControlButton
            icon={<Shuffle size={18} />}
            active={player.isShuffled}
            onClick={() => player.setIsShuffled(!player.isShuffled)}
          />
          <ControlButton icon={<SkipBack size={20} />} onClick={player.prev} />
          <PlayButton isPlaying={player.isPlaying} loading={player.loadingAudio} onClick={player.togglePlay} />
          <ControlButton icon={<SkipForward size={20} />} onClick={player.next} />
          <ControlButton
            icon={<Repeat size={18} />}
            active={player.repeatMode !== 'none'}
            onClick={() => {
              const modes = ['none', 'all', 'one'] as const
              const idx = modes.indexOf(player.repeatMode)
              player.setRepeatMode(modes[(idx + 1) % 3])
            }}
          />
        </div>

        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            className="text-caption"
            style={{
              color: 'var(--color-muted)',
              fontVariantNumeric: 'tabular-nums',
              minWidth: 36,
              textAlign: 'right',
            }}
          >
            {formatTime(player.progress)}
          </span>
          <PlayerSlider
            ariaLabel="播放进度"
            value={player.progress}
            max={trackDuration}
            onChange={player.setProgress}
            disabled={trackDuration <= 0}
            formatValue={formatTime}
            variant="progress"
          />
          <span
            className="text-caption"
            style={{
              color: 'var(--color-muted)',
              fontVariantNumeric: 'tabular-nums',
              minWidth: 36,
            }}
          >
            {formatTime(trackDuration)}
          </span>
        </div>
      </div>

      {/* Right — Volume + Extras */}
      <div
        style={{
          width: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 12,
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => player.setIsMuted(!player.isMuted)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: player.isMuted ? 'var(--color-destructive)' : 'var(--color-muted-foreground)',
            padding: 4,
            transition: 'color var(--duration-fast)',
          }}
        >
          {player.isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <PlayerSlider
          ariaLabel="音量"
          value={player.isMuted ? 0 : player.volume}
          max={100}
          onChange={(value) => {
            player.setVolume(Math.round(value))
            if (player.isMuted && value > 0) player.setIsMuted(false)
          }}
          width={80}
          step={5}
          variant="volume"
        />
        <button
          onClick={() => setQueueOpen(o => !o)}
          title="播放队列"
          style={{
            position: 'relative',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: queueOpen ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
            padding: 4,
            transition: 'color var(--duration-fast)',
          }}
        >
          <ListMusic size={18} />
          {player.queue.length > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                minWidth: 15,
                height: 15,
                padding: '0 3px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-primary)',
                color: 'var(--color-on-primary)',
                fontSize: 9,
                fontWeight: 700,
                lineHeight: '15px',
                textAlign: 'center',
              }}
            >
              {player.queue.length}
            </span>
          )}
        </button>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted-foreground)', padding: 4 }}>
          <Mic size={18} />
        </button>
      </div>

      <PlayQueue open={queueOpen} onClose={() => setQueueOpen(false)} />
    </div>
  )
}

interface PlayerSliderProps {
  ariaLabel: string
  value: number
  max: number
  onChange: (value: number) => void
  min?: number
  step?: number
  width?: number | string
  disabled?: boolean
  formatValue?: (value: number) => string
  variant: 'progress' | 'volume'
}

function PlayerSlider({
  ariaLabel,
  value,
  max,
  onChange,
  min = 0,
  step,
  width = '100%',
  disabled = false,
  formatValue,
  variant,
}: PlayerSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const safeMax = Math.max(max, min)
  const valueRange = safeMax - min
  const clampedValue = clamp(value, min, safeMax)
  const percent = valueRange > 0 ? ((clampedValue - min) / valueRange) * 100 : 0
  const isActive = isHovered || isDragging
  const keyboardStep = step ?? Math.max(valueRange / 100, 1)

  const updateFromClientX = useCallback((clientX: number) => {
    if (disabled || valueRange <= 0) return
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect || rect.width <= 0) return
    const nextPercent = clamp((clientX - rect.left) / rect.width, 0, 1)
    onChange(min + nextPercent * valueRange)
  }, [disabled, min, onChange, valueRange])

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }, [])

  return (
    <div
      ref={trackRef}
      role="slider"
      aria-label={ariaLabel}
      aria-valuemin={min}
      aria-valuemax={safeMax}
      aria-valuenow={Math.round(clampedValue)}
      aria-valuetext={formatValue ? formatValue(clampedValue) : String(Math.round(clampedValue))}
      aria-disabled={disabled || undefined}
      data-slider={variant}
      tabIndex={disabled ? -1 : 0}
      onPointerDown={(event) => {
        if (disabled) return
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        setIsDragging(true)
        updateFromClientX(event.clientX)
      }}
      onPointerMove={(event) => {
        if (isDragging) updateFromClientX(event.clientX)
      }}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={(event) => {
        if (disabled) return

        if (event.key === 'Home') {
          event.preventDefault()
          onChange(min)
          return
        }

        if (event.key === 'End') {
          event.preventDefault()
          onChange(safeMax)
          return
        }

        const direction = event.key === 'ArrowRight' || event.key === 'ArrowUp'
          ? 1
          : event.key === 'ArrowLeft' || event.key === 'ArrowDown'
            ? -1
            : 0

        if (direction !== 0) {
          event.preventDefault()
          onChange(clamp(clampedValue + direction * keyboardStep, min, safeMax))
        }
      }}
      style={{
        flex: width === '100%' ? 1 : undefined,
        width,
        height: 20,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.75 : 1,
        touchAction: 'none',
        outline: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '50%',
          height: isActive ? 6 : 4,
          transform: 'translateY(-50%)',
          background: 'var(--color-border)',
          borderRadius: 'var(--radius-full)',
          transition: 'height var(--duration-fast)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: '50%',
          height: isActive ? 6 : 4,
          width: `${percent}%`,
          transform: 'translateY(-50%)',
          background: 'var(--color-accent)',
          borderRadius: 'var(--radius-full)',
          transition: isDragging
            ? 'height var(--duration-fast)'
            : 'width 200ms linear, height var(--duration-fast)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: `${percent}%`,
          top: '50%',
          width: 12,
          height: 12,
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-on-accent)',
          border: '2px solid var(--color-accent)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.18)',
          opacity: isActive && !disabled ? 1 : 0,
          transform: `translate(-50%, -50%) scale(${isActive ? 1 : 0.7})`,
          transition: 'opacity var(--duration-fast), transform var(--duration-fast)',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

function PlayButton({ isPlaying, loading, onClick }: { isPlaying: boolean; loading?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        width: 40,
        height: 40,
        borderRadius: 'var(--radius-full)',
        background: 'var(--color-accent)',
        color: 'var(--color-on-accent)',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: loading ? 'wait' : 'pointer',
        opacity: loading ? 0.7 : 1,
        transition: 'transform var(--duration-fast), box-shadow var(--duration-fast)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)'
        e.currentTarget.style.boxShadow = 'var(--shadow-glow)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.boxShadow = 'none'
      }}
      onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)' }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
    >
      {loading ? (
        <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} />
      ) : isPlaying ? <Pause size={20} /> : <Play size={20} />}
    </button>
  )
}

function ControlButton({ icon, active = false, onClick }: { icon: React.ReactNode; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: active ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
        padding: 4,
        display: 'flex',
        alignItems: 'center',
        transition: 'color var(--duration-fast)',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = 'var(--color-primary)' }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'var(--color-muted-foreground)' }}
    >
      {icon}
    </button>
  )
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function formatTime(seconds: number): string {
  if (!seconds) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
