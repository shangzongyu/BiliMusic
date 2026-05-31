import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  FileDown,
  FileUp,
  Download,
  FolderOpen,
  Github,
  Info,
  LogIn,
  LogOut,
  Monitor,
  Moon,
  Music2,
  Palette,
  RefreshCw,
  Settings as SettingsIcon,
  Sun,
  UserRound,
} from 'lucide-react'
import { ActionButton, MusicHero, MusicPageShell, MusicSection } from '@/components/AppleMusicPage'
import { useTheme } from '@/hooks/useTheme'
import { useAppSettings } from '@/hooks/useAppSettings'
import { useAuth } from '@/contexts/AuthContext'
import { createPlaylistsExport, importPlaylistsFromText } from '@/utils/storage'
import type { AppSettings, SidebarState, ThemeMode } from '@/types'

export default function Settings() {
  const { mode, setMode } = useTheme()
  const { settings, setAppSettings } = useAppSettings()
  const { isLoggedIn, username, avatar, logout, setShowLogin } = useAuth()
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const [playlistTransferMessage, setPlaylistTransferMessage] = useState('')
  const [appVersion, setAppVersion] = useState('1.0.0')
  const [updateStatus, setUpdateStatus] = useState('')
  const [updateAction, setUpdateAction] = useState<'restart' | 'reload' | null>(null)

  useEffect(() => {
    window.electronAPI?.getAppVersion?.()?.then((v) => {
      if (v) setAppVersion(v)
    })
    return window.electronAPI?.onUpdaterEvent?.((event) => {
      switch (event.type) {
        case 'checking':
          setUpdateStatus('正在检查更新…'); setUpdateAction(null); break
        case 'up-to-date':
          setUpdateStatus(`已是最新版本（v${event.version}）`); setUpdateAction(null); break
        case 'available':
          setUpdateStatus(`发现新版本 v${event.version}，正在下载…`); setUpdateAction(null); break
        case 'progress':
          setUpdateStatus(`正在下载更新… ${event.percent}%`); break
        case 'downloaded':
          setUpdateStatus(`新版本 v${event.version} 已下载`); setUpdateAction('restart'); break
        case 'manual':
          setUpdateStatus('已打开下载页，请手动下载最新版本'); setUpdateAction(null); break
        case 'renderer-available':
          setUpdateStatus(`发现界面更新 v${event.version}，正在下载…`); setUpdateAction(null); break
        case 'renderer-progress':
          setUpdateStatus(`正在下载界面更新… ${event.percent}%`); break
        case 'renderer-ready-to-apply':
          setUpdateStatus(`界面更新 v${event.version} 已就绪`); setUpdateAction('reload'); break
        case 'error':
          setUpdateStatus(`检查更新失败：${event.message}`); setUpdateAction(null); break
      }
    })
  }, [])

  const checkUpdate = () => {
    setUpdateStatus('正在检查更新…')
    setUpdateAction(null)
    window.electronAPI?.checkForUpdate?.()
  }
  const runUpdateAction = () => {
    if (updateAction === 'restart') window.electronAPI?.quitAndInstall?.()
    else if (updateAction === 'reload') window.electronAPI?.applyRendererUpdate?.()
  }

  const changeDownloadDir = () => {
    const next = window.prompt('请输入下载目录', settings.downloadDir)
    if (next?.trim()) setAppSettings({ downloadDir: next.trim() })
  }

  const exportPlaylists = () => {
    const payload = createPlaylistsExport()
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `bilimusic-playlists-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    setPlaylistTransferMessage(`已导出 ${payload.playlists.length} 个歌单`)
  }

  const importPlaylists = async (file?: File) => {
    if (!file) return
    try {
      const result = importPlaylistsFromText(await file.text())
      setPlaylistTransferMessage(`已导入 ${result.imported} 个歌单${result.skipped ? `，跳过 ${result.skipped} 个无效项目` : ''}`)
    } catch (error) {
      setPlaylistTransferMessage(error instanceof Error ? error.message : '导入失败，请检查文件格式')
    } finally {
      if (importInputRef.current) importInputRef.current.value = ''
    }
  }

  return (
    <MusicPageShell>
      <MusicHero
        eyebrow="Preferences"
        title="设置"
        subtitle="整理外观、播放、下载和账号，让每一次打开都保持熟悉的节奏。"
        tone="red"
        action={(
          isLoggedIn ? (
            <ActionButton tone="subtle" onClick={logout}>
              <LogOut size={16} />
              退出登录
            </ActionButton>
          ) : (
            <ActionButton onClick={() => setShowLogin(true)}>
              <LogIn size={16} />
              扫码登录
            </ActionButton>
          )
        )}
      />

      <div className="settings-grid">
        <div className="settings-column">
          <SettingsGroup title="外观" icon={<Palette size={20} />}>
            <SettingsRow label="主题模式">
              <SegmentedControl
                options={[
                  { value: 'light' as ThemeMode, label: '浅色', icon: <Sun size={14} /> },
                  { value: 'dark' as ThemeMode, label: '深色', icon: <Moon size={14} /> },
                  { value: 'system' as ThemeMode, label: '系统', icon: <Monitor size={14} /> },
                ]}
                value={mode}
                onChange={setMode}
              />
            </SettingsRow>
            <SettingsRow label="侧边栏">
              <SegmentedControl
                options={[
                  { value: 'expanded' as SidebarState, label: '展开' },
                  { value: 'collapsed' as SidebarState, label: '折叠' },
                  { value: 'auto' as SidebarState, label: '自动' },
                ]}
                value={settings.sidebarState}
                onChange={(sidebarState) => setAppSettings({ sidebarState })}
              />
            </SettingsRow>
          </SettingsGroup>

          <SettingsGroup title="播放" icon={<Music2 size={20} />}>
            <SettingsRow label="音质">
              <StyledSelect
                value={settings.playQuality}
                onChange={(playQuality) => setAppSettings({ playQuality: playQuality as AppSettings['playQuality'] })}
                options={['标准', '高品质', '无损']}
              />
            </SettingsRow>
            <SettingsRow label="自动播放" description="播放结束时自动播放推荐">
              <ToggleSwitch checked={settings.autoPlay} onChange={() => setAppSettings({ autoPlay: !settings.autoPlay })} />
            </SettingsRow>
            <SettingsRow label="歌词显示" description="播放页自动显示歌词">
              <ToggleSwitch checked={settings.showLyrics} onChange={() => setAppSettings({ showLyrics: !settings.showLyrics })} />
            </SettingsRow>
          </SettingsGroup>
        </div>

        <div className="settings-column">
          <SettingsGroup title="下载" icon={<Download size={20} />}>
            <SettingsRow label="下载目录">
              <div className="settings-path">
                <span>{settings.downloadDir}</span>
                <button type="button" onClick={changeDownloadDir}>
                  <FolderOpen size={14} />
                  更改
                </button>
              </div>
            </SettingsRow>
            <SettingsRow label="下载音质">
              <StyledSelect
                value={settings.downloadQuality}
                onChange={(downloadQuality) => setAppSettings({ downloadQuality: downloadQuality as AppSettings['downloadQuality'] })}
                options={['标准', '高品质', '无损']}
              />
            </SettingsRow>
          </SettingsGroup>

          <SettingsGroup title="歌单数据" icon={<FileDown size={20} />}>
            <div className="settings-actions settings-actions--stacked">
              <button type="button" onClick={exportPlaylists}>
                <FileDown size={14} />
                导出歌单
              </button>
              <button type="button" onClick={() => importInputRef.current?.click()}>
                <FileUp size={14} />
                导入歌单
              </button>
              <input
                ref={importInputRef}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={(e) => importPlaylists(e.target.files?.[0])}
              />
              {playlistTransferMessage && <span>{playlistTransferMessage}</span>}
            </div>
          </SettingsGroup>

          <SettingsGroup title="账号" icon={<UserRound size={20} />}>
            <div className="settings-account">
              <div className="settings-account__avatar">
                {isLoggedIn && avatar ? <img src={avatar} alt="" /> : <UserRound size={22} />}
              </div>
              <div className="settings-account__body">
                <span className={isLoggedIn ? 'is-online' : ''}>{isLoggedIn ? '已登录' : '未登录'}</span>
                <strong>{isLoggedIn ? username : 'BiliBili 账号'}</strong>
              </div>
              <button type="button" onClick={isLoggedIn ? logout : () => setShowLogin(true)}>
                {isLoggedIn ? <LogOut size={14} /> : <LogIn size={14} />}
                {isLoggedIn ? '退出' : '登录'}
              </button>
            </div>
          </SettingsGroup>

          <SettingsGroup title="关于" icon={<Info size={20} />}>
            <SettingsRow label="版本">
              <span className="settings-version">BiliMusic v{appVersion}</span>
            </SettingsRow>
            <div className="settings-actions">
              <button type="button" onClick={checkUpdate}>
                <SettingsIcon size={14} />
                检查更新
              </button>
              {updateAction && (
                <button type="button" onClick={runUpdateAction}>
                  <RefreshCw size={14} />
                  {updateAction === 'restart' ? '重启并安装' : '立即重载'}
                </button>
              )}
              <button type="button" onClick={() => window.electronAPI?.openExternal?.('https://github.com/HanversionOvO/BiliMusic')}>
                <Github size={14} />
                关于项目
              </button>
              {updateStatus && <span>{updateStatus}</span>}
            </div>
          </SettingsGroup>
        </div>
      </div>
    </MusicPageShell>
  )
}

function SettingsGroup({
  title,
  icon,
  children,
}: {
  title: string
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <MusicSection title={title} icon={icon}>
      <div className="settings-panel">{children}</div>
    </MusicSection>
  )
}

function SettingsRow({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: ReactNode
}) {
  return (
    <div className="settings-row">
      <div className="settings-row__text">
        <strong>{label}</strong>
        {description && <span>{description}</span>}
      </div>
      <div className="settings-row__control">{children}</div>
    </div>
  )
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon?: ReactNode }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="settings-segment">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={value === opt.value ? 'is-active' : ''}
          onClick={() => onChange(opt.value)}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function StyledSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (value: string) => void
  options: string[]
}) {
  return (
    <select className="settings-select" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map(option => <option key={option}>{option}</option>)}
    </select>
  )
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      className={`settings-toggle ${checked ? 'is-on' : ''}`}
      role="switch"
      aria-checked={checked}
      onClick={onChange}
    >
      <span />
    </button>
  )
}
