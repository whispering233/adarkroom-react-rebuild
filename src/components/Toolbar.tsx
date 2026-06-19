/**
 * Toolbar — 右下角工具栏
 *
 * 固定定位，横向排列工具按钮：
 *   - 游戏速度 1×/2×/3×/5×（持久化 localStorage）
 *   - 字体缩放 A⁺ / A⁻（持久化 localStorage，范围 12–24px）
 *   - 夜间/浅色模式切换（持久化 localStorage）
 */
import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSpeed, type SpeedMultiplier } from '../system/gameSpeed'
import { useGameState, useGameDispatch, loadSave, pushNarrative } from '../state'
import { INITIAL_STATE } from '../state/types'
import { saveState, clearSave } from '../system/saveManager'
import { SaveModal } from './SaveModal'

// ─── 常量 ─────────────────────────────────────────────────

const THEME_KEY = 'adr-theme'
const FONT_SIZE_KEY = 'adr-font-size'
const FONT_SIZE_MIN = 12
const FONT_SIZE_MAX = 24
const FONT_SIZE_STEP = 1
const FONT_SIZE_DEFAULT = 16

const SPEED_OPTIONS: SpeedMultiplier[] = [1, 2, 3, 5]

// ─── 工具函数 ─────────────────────────────────────────────

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

function getInitialFontSize(): number {
  if (typeof window === 'undefined') return FONT_SIZE_DEFAULT
  const stored = localStorage.getItem(FONT_SIZE_KEY)
  if (stored) {
    const parsed = parseInt(stored, 10)
    if (!isNaN(parsed) && parsed >= FONT_SIZE_MIN && parsed <= FONT_SIZE_MAX) {
      return parsed
    }
  }
  return FONT_SIZE_DEFAULT
}

function applyFontSize(px: number) {
  document.documentElement.style.setProperty('--game-font-size', `${px}px`)
}

// ─── 组件 ─────────────────────────────────────────────────

const BTN_STYLE =
  'rounded border px-2.5 py-1 font-mono text-xs transition cursor-pointer bg-(--game-bg-header) border-(--game-border) text-(--game-text-body) hover:bg-(--game-btn-hover-bg)'

const BTN_ACTIVE =
  'rounded border px-2.5 py-1 font-mono text-xs transition cursor-pointer bg-(--game-accent-soft) border-(--game-border-accent) text-(--game-accent)'

export function Toolbar() {
  const { t } = useTranslation()
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme)
  const [fontSize, setFontSize] = useState<number>(getInitialFontSize)
  const [speed, setSpeed] = useSpeed()
  const state = useGameState()
  const dispatch = useGameDispatch()
  const [modalMode, setModalMode] = useState<'export' | 'import' | null>(null)

  // 应用主题
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // 应用字体大小
  useEffect(() => {
    applyFontSize(fontSize)
  }, [fontSize])

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem(THEME_KEY, next)
      return next
    })
  }, [])

  const increaseFont = useCallback(() => {
    setFontSize(prev => {
      const next = Math.min(prev + FONT_SIZE_STEP, FONT_SIZE_MAX)
      localStorage.setItem(FONT_SIZE_KEY, String(next))
      return next
    })
  }, [])

  const decreaseFont = useCallback(() => {
    setFontSize(prev => {
      const next = Math.max(prev - FONT_SIZE_STEP, FONT_SIZE_MIN)
      localStorage.setItem(FONT_SIZE_KEY, String(next))
      return next
    })
  }, [])

  const atMin = fontSize <= FONT_SIZE_MIN
  const atMax = fontSize >= FONT_SIZE_MAX

  const handleSave = useCallback(() => {
    saveState(state)
    dispatch(pushNarrative(t('save.save_ok')))
  }, [state, dispatch, t])

  const handleExport = useCallback(() => {
    setModalMode('export')
  }, [])

  const handleImport = useCallback(() => {
    setModalMode('import')
  }, [])

  const handleNewGame = useCallback(() => {
    if (!window.confirm(t('save.confirm_new'))) return
    clearSave()
    dispatch(loadSave(INITIAL_STATE))
    dispatch(pushNarrative(t('save.confirm_new')))
    setModalMode(null)
  }, [dispatch, t])

  return (
    <div className="fixed bottom-4 right-4 z-50 flex gap-1.5">
      {/* 游戏速度 */}
      <div className="flex gap-0.5">
        {SPEED_OPTIONS.map(s => (
          <button
            key={s}
            type="button"
            onClick={() => setSpeed(s)}
            title={t('toolbar.speed', { speed: s })}
            className={s === speed ? BTN_ACTIVE : BTN_STYLE}
          >
            {s}×
          </button>
        ))}
      </div>

      {/* 字体缩小 */}
      <button
        type="button"
        onClick={decreaseFont}
        disabled={atMin}
        title={t('toolbar.font_smaller', { size: fontSize })}
        className={BTN_STYLE}
      >
        A⁻
      </button>

      {/* 字体放大 */}
      <button
        type="button"
        onClick={increaseFont}
        disabled={atMax}
        title={t('toolbar.font_larger', { size: fontSize })}
        className={BTN_STYLE}
      >
        A⁺
      </button>

      {/* 主题切换 */}
      <button
        type="button"
        onClick={toggleTheme}
        title={theme === 'light' ? t('toolbar.switch_dark') : t('toolbar.switch_light')}
        className={BTN_STYLE}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      {/* 保存 */}
      <button
        type="button"
        onClick={handleSave}
        title={t('save.save')}
        className={BTN_STYLE}
      >
        💾
      </button>

      {/* 导出 */}
      <button
        type="button"
        onClick={handleExport}
        title={t('save.export')}
        className={BTN_STYLE}
      >
        📤
      </button>

      {/* 导入 */}
      <button
        type="button"
        onClick={handleImport}
        title={t('save.import')}
        className={BTN_STYLE}
      >
        📥
      </button>

      {/* 重新开始 */}
      <button
        type="button"
        onClick={handleNewGame}
        title={t('save.new_game')}
        className={BTN_STYLE}
      >
        🔄
      </button>

      {modalMode && (
        <SaveModal mode={modalMode} onClose={() => setModalMode(null)} />
      )}
    </div>
  )
}
