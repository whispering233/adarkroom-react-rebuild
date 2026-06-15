/**
 * StoresPanel — 资源显示面板（右栏）
 *
 * 资源分类后纵向排列，每行显示类目、数值、瞬时变化率。
 * delta 基于 resourceLog 滑动窗口（最近 10s）计算，每 tick 一条 entry。
 */
import { useTranslation } from 'react-i18next'
import { useGameState } from '../state'
import type { ResourceTickLog } from '../state'

// ─── 常量 ─────────────────────────────────────────────────

/** delta 滑动窗口大小（秒） */
const DELTA_WINDOW = 10

// ─── 工具函数 ─────────────────────────────────────────────

/** 资源 key → i18n key 映射（处理含空格的资源名） */
const RESOURCE_I18N: Record<string, string> = {
  'cured meat': 'stores.cured_meat',
  'energy cell': 'stores.energy_cell',
}

function resI18nKey(rawKey: string): string {
  return RESOURCE_I18N[rawKey] ?? `stores.${rawKey}`
}

/**
 * 基于 resourceLog（per-tick）滑动窗口计算每个资源的净变化率（delta/秒）。
 * 窗口内各 tick entry 的 deltas.* 直接求和后归一化。
 */
function computeDeltas(
  log: ResourceTickLog[],
  currentTick: number,
): Record<string, number> {
  if (log.length === 0) return {}

  const cutoff = currentTick - DELTA_WINDOW
  const sums: Record<string, number> = {}
  let ticksInWindow = 0

  for (const entry of log) {
    if (entry.tick <= cutoff) continue
    ticksInWindow++
    for (const [key, d] of Object.entries(entry.deltas)) {
      sums[key] = (sums[key] ?? 0) + d
    }
  }

  // 用实际窗口 tick 数做分母（至少 1，避免除零）
  const span = Math.max(ticksInWindow, 1)

  const deltas: Record<string, number> = {}
  for (const [key, total] of Object.entries(sums)) {
    deltas[key] = total / span
  }
  return deltas
}

function formatDelta(delta: number): string {
  const sign = delta > 0 ? '+' : ''
  return `${sign}${delta.toFixed(2)}/s`
}

// ─── 资源分类 ─────────────────────────────────────────────

const CATEGORIES: { labelKey: string; keys: string[] }[] = [
  {
    labelKey: 'stores.cat_basic',
    keys: ['wood', 'fur', 'meat', 'scales', 'teeth'],
  },
  {
    labelKey: 'stores.cat_minerals',
    keys: ['iron', 'coal', 'steel', 'sulphur'],
  },
  {
    labelKey: 'stores.cat_crafted',
    keys: ['cloth', 'leather', 'cured meat', 'bullets'],
  },
  {
    labelKey: 'stores.cat_advanced',
    keys: ['energy cell', 'medicine', 'hypo', 'stim'],
  },
]

const KNOWN_KEYS = new Set(CATEGORIES.flatMap(c => c.keys))

// ─── 组件 ─────────────────────────────────────────────────

export function StoresPanel() {
  const { t } = useTranslation()
  const state = useGameState()
  const stores = state.stores
  const deltas = computeDeltas(state.resourceLog, state._globalTick)

  const dynamicKeys = Object.keys(stores).filter(
    k => !KNOWN_KEYS.has(k) && (stores[k] ?? 0) > 0,
  )

  const hasData =
    CATEGORIES.some(c => c.keys.some(k => stores[k] !== undefined)) ||
    dynamicKeys.length > 0

  if (!hasData) return null

  function renderRow(key: string, label: string) {
    const value = stores[key] ?? 0
    const delta = deltas[key]

    return (
      <div
        key={key}
        className="flex justify-between text-(--game-text-body) gap-2"
      >
        <span className="text-(--game-text-muted) truncate">{label}</span>
        <span className="flex items-baseline gap-2 shrink-0">
          <span className="text-(--game-accent) text-right min-w-[3ch]">
            {value}
          </span>
          {delta !== undefined && delta !== 0 && (
            <span
              className={`text-xs ${
                delta > 0 ? 'text-blue-500' : 'text-red-500'
              }`}
            >
              {formatDelta(delta)}
            </span>
          )}
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 text-sm">
      {CATEGORIES.map(cat => {
        const rows = cat.keys.filter(k => stores[k] !== undefined)
        if (rows.length === 0) return null
        return (
          <div key={cat.labelKey}>
            <div className="text-xs uppercase tracking-[0.2em] mb-2 text-(--game-accent)">
              {t(cat.labelKey)}
            </div>
            <div className="flex flex-col gap-1">
              {rows.map(key => renderRow(key, t(resI18nKey(key))))}
            </div>
          </div>
        )
      })}

      {dynamicKeys.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-[0.2em] mb-2 text-(--game-accent)">
            {t('stores.cat_other')}
          </div>
          <div className="flex flex-col gap-1">
            {dynamicKeys.map(key => renderRow(key, key))}
          </div>
        </div>
      )}

      {Object.keys(deltas).length === 0 && (
        <p className="text-xs text-(--game-text-muted) italic">
          {t('stores.no_income')}
        </p>
      )}
    </div>
  )
}
