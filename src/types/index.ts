export interface Track {
  id: string
  title: string
  artist: string
  coverUrl: string
  duration: number
  videoUrl: string
  bvid: string
  // 音乐中心曲目的顶层 avid+cid：当 bvid 稿件不存在（-404）时回退直取音乐流
  aid?: string | number
  cid?: string | number
  playCount: number
  isLiked: boolean
}

export interface Playlist {
  id: string
  name: string
  description?: string
  coverUrl: string
  tracks: Track[]
  createdAt: string
  updatedAt: string
}

export type ThemeMode = 'light' | 'dark' | 'system'
export type RepeatMode = 'none' | 'one' | 'all'
export type SidebarState = 'expanded' | 'collapsed' | 'auto'

export interface AppSettings {
  sidebarState: SidebarState
  playQuality: '标准' | '高品质' | '无损'
  downloadQuality: '标准' | '高品质' | '无损'
  downloadDir: string
  autoPlay: boolean
  showLyrics: boolean
}

export type NavItem = {
  icon: string
  label: string
  path: string
}

export interface UserInfo {
  isLogin: boolean
  mid: number
  uname: string
  face: string
  vipType: number
  vipStatus: number
}
