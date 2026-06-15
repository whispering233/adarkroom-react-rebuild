/**
 * StoresPanel — 资源显示面板（右栏）
 *
 * 资源分类后纵向排列，每行显示类目、数值、瞬时变化率。
 * 已知资源始终显示（即使为 0），动态资源（后期解锁）只在 > 0 时显示。
 * 资源名通过 react-i18next 的 t() 查表。
 */
import { useTranslation } from 'react-i18next'
import { useGameState } from '../state'
import type { IncomeConfig } from '../state'

// ─── 工具函数 ─────────────────────────────────────────────

/** 资源 key → i18n key 映射（处理含空格的资源名） */
const RESOURCE_I18N: Record<string, string> = {
  'cured meat': 'stores.cured_meat',
  'energy cell': 'stores.energy_cell',
}

/** 获取资源的 i18n key */
function resI18nKey(rawKey: string): string {
  return RESOURCE_I18N[rawKey] ?? `stores.${rawKey}`
}

/**
 * 从所有收入来源计算每个资源的净变化率（delta/秒）。
 * 正数 = 净产出，负数 = 净消耗。
 */
function computeDeltas(
  income: Record<string, IncomeConfig>,
): Record<string, number> {
  const deltas: Record<string, number> = {}
  for (const config of Object.values(income)) {
    if (config.delay <= 0) continue
    for (const [res, amount] of Object.entries(config.stores)) {
      deltas[res] = (deltas[res] ?? 0) + amount / config.delay
    }
  }
  return deltas
}

/** 格式化 delta 值，统一保留 2 位小数 */
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
  const deltas = computeDeltas(state.income)

  const dynamicKeys = Object.keys(stores).filter(
    k => !KNOWN_KEYS.has(k) && (stores[k] ?? 0) > 0,
  )

  const hasData =
    CATEGORIES.some(c => c.keys.some(k => stores[k] !== undefined)) ||
    dynamicKeys.length > 0

  if (!hasData) return null

  /** 单行渲染：资源名 | 数值 | delta */
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

      {/* 无活跃收入时提示 */}
      {Object.keys(deltas).length === 0 && (
        <p className="text-xs text-(--game-text-muted) italic">
          {t('stores.no_income')}
        </p>
      )}
    </div>
  )
}
