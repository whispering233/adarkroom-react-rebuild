/**
 * StoresPanel — 资源显示面板（右栏）
 *
 * 资源分类后纵向排列，每行显示类目、数值、趋势箭头。
 * 趋势基于 resourceLog 滑动窗口（最近 10 tick）的总变化量。
 */
import { useTranslation } from 'react-i18next'
import { useGameState } from '../state'
import type { ResourceTickLog } from '../state'
import { RESOURCES, getResourceCategories } from '../config'

// ─── 常量 ─────────────────────────────────────────────────

/** 趋势滑动窗口大小（tick 数） */
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
 * 基于 resourceLog（per-tick）滑动窗口计算每个资源的净变化趋势。
 * 返回窗口内的总变化量（非速率），配合方向箭头 ↑/↓ 显示。
 */
function computeTrends(
  log: ResourceTickLog[],
  currentTick: number,
): Record<string, number> {
  if (log.length === 0) return {}

  const cutoff = currentTick - DELTA_WINDOW
  const sums: Record<string, number> = {}

  for (const entry of log) {
    if (entry.tick <= cutoff) continue
    for (const [key, d] of Object.entries(entry.deltas)) {
      sums[key] = (sums[key] ?? 0) + d
    }
  }

  return sums
}

function formatTrend(total: number): string {
  const arrow = total > 0 ? '↑' : total < 0 ? '↓' : ''
  const sign = total > 0 ? '+' : ''
  return `${sign}${total.toFixed(1)}${arrow} ${DELTA_WINDOW}t`
}

// ─── 资源分类 ─────────────────────────────────────────────

/** 从 RESOURCES 配置自动生成，新增资源只需在 config.ts 加一行 */
const CATEGORIES = getResourceCategories()

/** 已知资源 key 集合（用于区分动态资源） */
const KNOWN_KEYS = new Set(Object.keys(RESOURCES))

// ─── 组件 ─────────────────────────────────────────────────

export function StoresPanel() {
  const { t } = useTranslation()
  const state = useGameState()
  const stores = state.stores
  const trends = computeTrends(state.resourceLog, state._globalTick)

  const dynamicKeys = Object.keys(stores).filter(
    k => !KNOWN_KEYS.has(k) && (stores[k] ?? 0) > 0,
  )

  const hasData =
    CATEGORIES.some(c => c.keys.some(k => stores[k] !== undefined)) ||
    dynamicKeys.length > 0

  if (!hasData) return null

  function renderRow(key: string, label: string) {
    const value = stores[key] ?? 0
    const trend = trends[key] ?? 0
    const isPositive = trend > 0
    const isNegative = trend < 0

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
          <span
            className={`text-xs min-w-[6em] text-right ${
              isPositive ? 'text-blue-500' : isNegative ? 'text-red-500' : 'text-(--game-text-muted)'
            }`}
          >
            {formatTrend(trend)}
          </span>
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
    </div>
  )
}
