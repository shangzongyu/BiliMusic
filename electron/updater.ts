import { app, BrowserWindow, ipcMain, shell } from 'electron'
import electronUpdater from 'electron-updater'
import { emitUpdater, setUpdaterWindow } from './updaterBus'
import {
  currentRendererVersion,
  fetchManifest,
  getActiveRendererRoot,
  initOtaUpdater,
  semverGt,
  stageRendererUpdate,
} from './otaUpdater'

// electron-updater 为 CJS，主进程为 ESM：默认导入取其 module.exports，再解构 autoUpdater
const { autoUpdater } = electronUpdater

const RELEASES_URL = 'https://github.com/HanversionOvO/BiliMusic/releases/latest'
const CHECK_INTERVAL = 6 * 60 * 60 * 1000
const STARTUP_DELAY = 10 * 1000

// 供 main.ts 的 app:// 处理器解析当前生效渲染层根目录
export { getActiveRendererRoot }

let busy = false

// 整包自动更新依赖系统级安装器与签名：mac 未签名不可用，鸿蒙非 Electron 安装器。
function canAutoUpdateShell(): boolean {
  if (process.platform === 'darwin') return false
  if ((process.platform as string) === 'openharmony') return false
  return true
}

function wireElectronUpdater(): void {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.on('update-available', (info) =>
    emitUpdater({
      type: 'available',
      version: info.version,
      notes: typeof info.releaseNotes === 'string' ? info.releaseNotes : undefined,
    }),
  )
  autoUpdater.on('download-progress', (p) => emitUpdater({ type: 'progress', percent: Math.round(p.percent) }))
  autoUpdater.on('update-downloaded', (info) => emitUpdater({ type: 'downloaded', version: info.version }))
  autoUpdater.on('error', (err) =>
    emitUpdater({ type: 'error', message: err instanceof Error ? err.message : String(err) }),
  )
}

// 统一检查：manifest 为唯一检测源。渲染补丁优先；需整包时由 electron-updater(Win/Linux) 或手动(mac) 接管。
export async function checkForUpdates(manual: boolean): Promise<void> {
  if (busy) return
  busy = true
  try {
    if (manual) emitUpdater({ type: 'checking' })
    if (!app.isPackaged) {
      if (manual) emitUpdater({ type: 'up-to-date', version: app.getVersion() })
      return
    }

    const manifest = await fetchManifest()
    if (!manifest) {
      if (manual) emitUpdater({ type: 'up-to-date', version: app.getVersion() })
      return
    }

    const appV = app.getVersion()

    // 1) 渲染补丁优先（全平台，含 mac）：有更新且当前外壳满足 minShellVersion
    if (
      semverGt(manifest.rendererVersion, currentRendererVersion()) &&
      !semverGt(manifest.minShellVersion || '0.0.0', appV)
    ) {
      await stageRendererUpdate(manifest)
      return
    }

    // 2) 需要整包（新外壳）
    if (semverGt(manifest.shellVersion, appV)) {
      if (canAutoUpdateShell()) {
        await autoUpdater.checkForUpdates() // electron-updater 接管下载安装，事件经监听器回传
      } else if (manual) {
        void shell.openExternal(RELEASES_URL) // mac 未签名等：引导手动下载
        emitUpdater({ type: 'manual', url: RELEASES_URL })
      }
      return
    }

    // 3) 已最新
    if (manual) emitUpdater({ type: 'up-to-date', version: appV })
  } catch (err) {
    emitUpdater({ type: 'error', message: err instanceof Error ? err.message : String(err) })
  } finally {
    busy = false
  }
}

export function initUpdates(opts: {
  window: () => BrowserWindow | null
  bundledRendererRoot: string
  reload: () => void
}): void {
  setUpdaterWindow(opts.window)
  wireElectronUpdater()
  initOtaUpdater({ bundledRendererRoot: opts.bundledRendererRoot, reload: opts.reload })

  ipcMain.handle('updater:check', () => {
    void checkForUpdates(true)
  })
  ipcMain.on('updater:quit-and-install', () => {
    if (canAutoUpdateShell()) autoUpdater.quitAndInstall()
  })
  ipcMain.handle('app:get-version', () => app.getVersion())

  // 仅打包态：启动后延迟首检 + 周期检查（dev 无 app-update.yml / 无 OTA）
  if (app.isPackaged) {
    setTimeout(() => {
      void checkForUpdates(false)
    }, STARTUP_DELAY)
    setInterval(() => {
      void checkForUpdates(false)
    }, CHECK_INTERVAL)
  }
}
