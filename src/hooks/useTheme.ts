import { useState, useEffect, useCallback } from 'react'
import type { ThemeMode } from '@/types'

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(mode: ThemeMode) {
  const resolved = mode === 'system' ? getSystemTheme() : mode
  document.documentElement.setAttribute('data-theme', resolved)
}

function readStoredMode(): ThemeMode {
  return (localStorage.getItem('theme-mode') as ThemeMode) || 'system'
}

// 首次加载时同步设置主题，避免 FOUC
applyTheme(readStoredMode())

export function useTheme() {
  // 惰性读取：每次挂载都从 localStorage 取最新值，
  // 避免路由切回设置页时用陈旧的模块级初始值导致主题回退为「系统」
  const [mode, setMode] = useState<ThemeMode>(readStoredMode)

  useEffect(() => {
    applyTheme(mode)
    localStorage.setItem('theme-mode', mode)
  }, [mode])

  useEffect(() => {
    if (mode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      document.documentElement.setAttribute('data-theme', getSystemTheme())
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [mode])

  const toggle = () => {
    setMode(prev => {
      if (prev === 'light') return 'dark'
      if (prev === 'dark') return 'system'
      return 'light'
    })
  }

  return { mode, setMode, toggle }
}