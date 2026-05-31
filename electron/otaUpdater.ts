import { app, ipcMain, net } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import crypto from 'node:crypto'
import { emitUpdater } from './updaterBus'

// 渲染热补丁：从 GitHub Releases 下发 renderer-<version>.asar，校验后由 app:// 从可写沙箱加载。
// 单文件 asar（net.fetch 读 asar 内部已被现有打包路径证明可用），无需解压，原子可回滚。
const REPO = 'HanversionOvO/BiliMusic'
const RELEASE_BASE = `https://github.com/${REPO}/releases/latest/download`
export const OTA_MANIFEST_URL = `${RELEASE_BASE}/ota.json`

export interface OtaManifest {
  rendererVersion: string
  shellVersion: string
  minShellVersion: string
  file: string
  sha512: string
  size?: number
  notes?: string
}

interface OtaState {
  activeVersion: string | null // 当前生效的 OTA 渲染版本（null = 用包内 dist）
  activeFile: string | null
  verified: boolean // active 版本是否已通过渲染层 ready 心跳（未通过则下次启动回滚）
  pendingVersion: string | null // 已下载、待下次启动或手动重载生效
  pendingFile: string | null
}

let state: OtaState = {
  activeVersion: null,
  activeFile: null,
  verified: false,
  pendingVersion: null,
  pendingFile: null,
}
let bundledRoot = '' // 包内 dist 目录，由 init 传入
let reloadWindow: () => void = () => {}
let staging = false

function otaDir(): string {
  return path.join(app.getPath('userData'), 'ota')
}
function statePath(): string {
  return path.join(otaDir(), 'state.json')
}

function readState(): void {
  try {
    const raw = JSON.parse(fs.readFileSync(statePath(), 'utf8'))
    state = { ...state, ...raw }
  } catch {
    /* 首次无状态文件，用默认值 */
  }
}
function writeState(): void {
  try {
    fs.mkdirSync(otaDir(), { recursive: true })
    fs.writeFileSync(statePath(), JSON.stringify(state, null, 2))
  } catch {
    /* 持久化失败不致命，下次重试 */
  }
}

// 仅比较 x.y.z 主体，忽略 -alpha 之类后缀；a > b 返回 true
export function semverGt(a: string, b: string): boolean {
  const pa = a.split('-')[0].split('.').map((n) => Number(n) || 0)
  const pb = b.split('-')[0].split('.').map((n) => Number(n) || 0)
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return true
    if ((pa[i] || 0) < (pb[i] || 0)) return false
  }
  return false
}

// 当前生效的渲染层根：OTA asar（存在）否则包内 dist。app:// 处理器据此 join 资源路径。
export function getActiveRendererRoot(): string {
  if (state.activeVersion && state.activeFile) {
    const p = path.join(otaDir(), state.activeFile)
    if (fs.existsSync(p)) return p
  }
  return bundledRoot
}

export function currentRendererVersion(): string {
  return state.activeVersion || app.getVersion()
}

export async function fetchManifest(): Promise<OtaManifest | null> {
  const res = await net.fetch(OTA_MANIFEST_URL, { cache: 'no-store' })
  if (!res.ok) throw new Error(`获取更新信息失败 HTTP ${res.status}`)
  const manifest = (await res.json()) as OtaManifest
  if (!manifest?.rendererVersion || !manifest?.file || !manifest?.sha512) return null
  return manifest
}

async function downloadBuffer(url: string, onProgress: (pct: number) => void): Promise<Buffer> {
  const res = await net.fetch(url)
  if (!res.ok) throw new Error(`下载失败 HTTP ${res.status}`)
  const total = Number(res.headers.get('content-length') || 0)
  const reader = res.body?.getReader()
  if (!reader) return Buffer.from(await res.arrayBuffer())
  const chunks: Uint8Array[] = []
  let received = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) {
      chunks.push(value)
      received += value.length
      if (total > 0) onProgress(Math.round((received / total) * 100))
    }
  }
  return Buffer.concat(chunks)
}

// 下载 + 校验 + 原子暂存为 pending（不立即套用，等下次启动或手动重载）
export async function stageRendererUpdate(manifest: OtaManifest): Promise<void> {
  if (staging) return
  staging = true
  try {
    emitUpdater({ type: 'renderer-available', version: manifest.rendererVersion })
    const buf = await downloadBuffer(`${RELEASE_BASE}/${manifest.file}`, (pct) =>
      emitUpdater({ type: 'renderer-progress', percent: pct }),
    )
    const digest = crypto.createHash('sha512').update(buf).digest('base64')
    if (digest !== manifest.sha512) throw new Error('校验失败：渲染包指纹不匹配')

    fs.mkdirSync(otaDir(), { recursive: true })
    const tmp = path.join(otaDir(), `${manifest.file}.tmp`)
    const dest = path.join(otaDir(), manifest.file)
    await fsp.writeFile(tmp, buf)
    await fsp.rename(tmp, dest)

    state.pendingVersion = manifest.rendererVersion
    state.pendingFile = manifest.file
    writeState()
    emitUpdater({ type: 'renderer-ready-to-apply', version: manifest.rendererVersion })
  } finally {
    staging = false
  }
}

// 启动时对账：回滚未验证的坏包；套用上次已下载的 pending
function bootReconcile(): void {
  readState()
  // 1) 上次 active 未确认 ready → 视为坏包，删除并回退包内 dist
  if (state.activeVersion && !state.verified) {
    if (state.activeFile) {
      try {
        fs.rmSync(path.join(otaDir(), state.activeFile), { force: true })
      } catch {
        /* ignore */
      }
    }
    state.activeVersion = null
    state.activeFile = null
    state.verified = false
    writeState()
  }
  // 2) 有已下载 pending → 本次启动套用为 active（待 ready 心跳确认）
  if (state.pendingVersion && state.pendingFile) {
    if (fs.existsSync(path.join(otaDir(), state.pendingFile))) {
      state.activeVersion = state.pendingVersion
      state.activeFile = state.pendingFile
      state.verified = false
    }
    state.pendingVersion = null
    state.pendingFile = null
    writeState()
  }
}

// 渲染层挂载成功后回报：标记当前 active 为已验证，避免下次启动误回滚
export function markRendererVerified(): void {
  if (state.activeVersion && !state.verified) {
    state.verified = true
    writeState()
  }
}

// 手动「立即重载」：把 pending 提升为 active 并重载窗口
function applyNow(): void {
  if (!state.pendingVersion || !state.pendingFile) return
  if (!fs.existsSync(path.join(otaDir(), state.pendingFile))) return
  state.activeVersion = state.pendingVersion
  state.activeFile = state.pendingFile
  state.verified = false
  state.pendingVersion = null
  state.pendingFile = null
  writeState()
  reloadWindow()
}

export function initOtaUpdater(opts: { bundledRendererRoot: string; reload: () => void }): void {
  bundledRoot = opts.bundledRendererRoot
  reloadWindow = opts.reload
  bootReconcile()
  ipcMain.on('updater:renderer-ready', () => markRendererVerified())
  ipcMain.on('updater:apply-now', () => applyNow())
}
