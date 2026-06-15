/**
 * Toolbar — 右下角工具栏
 *
 * 固定定位，横向排列工具按钮。当前提供夜间模式切换。
 * 主题偏好持久化到 localStorage。
 */
import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const THEME_KEY = 'adr-theme'

function getInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'dark' || stored === 'light') return stored
  return 'light'
}

function applyTheme(theme: 'light' | 'dark') {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}

export function Toolbar() {
  const { t } = useTranslation()
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const toggle = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem(THEME_KEY, next)
      return next
    })
  }, [])

  return (
    <div className="fixed bottom-4 right-4 z-50 flex gap-2">
      <button
        type="button"
        onClick={toggle}
        className="rounded border px-3 py-1.5 font-mono text-xs transition cursor-pointer bg-(--game-bg-header) border-(--game-border) text-(--game-text-body)"
        title={theme === 'light' ? t('toolbar.switch_dark') : t('toolbar.switch_light')}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    </div>
  )
}
