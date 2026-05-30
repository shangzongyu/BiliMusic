import { Download, FolderOpen, HardDrive, Music, WifiOff } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  ActionButton,
  EmptyLibrary,
  MusicHero,
  MusicPageShell,
  MusicSection,
} from '@/components/AppleMusicPage'

export default function Downloads() {
  return (
    <MusicPageShell>
      <MusicHero
        eyebrow="Downloads"
        title="本地下载"
        subtitle="离线音乐会整齐地收在这里，像 Apple Music 资料库一样干净。"
        tone="blue"
        action={(
          <ActionButton tone="subtle">
            <FolderOpen size={16} />
            打开目录
          </ActionButton>
        )}
      />

      <div className="download-dashboard">
        <DownloadMetric icon={<Download size={19} />} label="已下载" value="0 首" />
        <DownloadMetric icon={<HardDrive size={19} />} label="占用空间" value="0 KB" />
        <DownloadMetric icon={<WifiOff size={19} />} label="离线可听" value="未开始" />
      </div>

      <MusicSection title="下载列表" icon={<Music size={22} />}>
        <div className="download-empty-shell">
          <EmptyLibrary
            icon={<Download size={40} />}
            title="还没有本地音乐"
            subtitle="完成下载后，歌曲会显示在这里。"
          />
        </div>
      </MusicSection>
    </MusicPageShell>
  )
}

function DownloadMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <article className="download-metric">
      <span>{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </article>
  )
}
