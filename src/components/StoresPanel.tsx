/**
 * StoresPanel — 右栏数据面板
 *
 * 三块可折叠数据区：
 *   1. 建筑物 — game.buildings 数量 + 人口
 *   2. 库存 — 资源按分类展示（二级折叠）+ 趋势
 *   3. 武器 — 武器/工具类物品数量
 */
import { useTranslation } from 'react-i18next'
import { useGameState } from '../state'
import type { ResourceTickLog } from '../state'
import { RESOURCES, getResourceCategories } from '../config'
import { CRAFTABLES } from '../rooms/craftables'
import { CollapsibleSection } from './CollapsibleSection'

// ─── 常量 ─────────────────────────────────────────────────

const DELTA_WINDOW = 10

// ─── 工具函数 ─────────────────────────────────────────────

const RESOURCE_I18N: Record<string, string> = {
  'cured meat': 'stores.cured_meat',
  'energy cell': 'stores.energy_cell',
}

function resI18nKey(rawKey: string): string {
  return RESOURCE_I18N[rawKey] ?? `stores.${rawKey}`
}

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

const CATEGORIES = getResourceCategories()
const KNOWN_KEYS = new Set(Object.keys(RESOURCES))

// ─── 组件 ─────────────────────────────────────────────────

export function StoresPanel() {
  const { t } = useTranslation()
  const state = useGameState()
  const stores = state.stores
  const buildings = state.game.buildings
  const trends = computeTrends(state.resourceLog, state._globalTick)

  // ── 建筑物 ──────────────────────────────────────────
  const buildingEntries = Object.entries(buildings)
    .filter(([, count]) => count > 0)
  const hasBuildings = buildingEntries.length > 0 || state.game.population > 0

  // ── 动态资源（不在 RESOURCES 中的） ────────────────
  const dynamicKeys = Object.keys(stores).filter(
    k => !KNOWN_KEYS.has(k) && (stores[k] ?? 0) > 0,
  )

  // ── 武器（CRAFTABLES 中类型为 weapon/tool 且有库存的）──
  const weaponKeys = Object.values(CRAFTABLES)
    .filter(d => (d.type === 'weapon' || d.type === 'tool') && (stores[d.id] ?? 0) > 0)
    .map(d => d.id)
  const hasWeapons = weaponKeys.length > 0

  // ── 库存是否有数据 ──────────────────────────────
  const hasStores =
    CATEGORIES.some(c => c.keys.some(k => stores[k] !== undefined)) ||
    dynamicKeys.length > 0

  // 三块全空则不渲染
  if (!hasBuildings && !hasStores && !hasWeapons) return null

  /** 单行数值 + 趋势 */
  function renderRow(key: string, label: string) {
    const value = stores[key] ?? 0
    const trend = trends[key] ?? 0
    const isPositive = trend > 0
    const isNegative = trend < 0

    return (
      <div key={key} className="flex justify-between text-(--game-text-body) gap-2">
        <span className="text-(--game-text-muted) truncate text-xs">{label}</span>
        <span className="flex items-baseline gap-2 shrink-0">
          <span className="text-(--game-accent) text-right min-w-[3ch] text-xs">
            {value}
          </span>
          <span
            className={`text-[0.6rem] min-w-[5.5em] text-right ${
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
    <div className="flex flex-col gap-3 text-sm">
      {/* ── 建筑物 ── */}
      {hasBuildings && (
        <CollapsibleSection title={t('panel.buildings')} defaultOpen>
          <div className="flex flex-col gap-1">
            {buildingEntries.map(([id, count]) => {
              const nameKey = `build.${id.replace(/ /g, '_')}.name`
              const name = t(nameKey, { defaultValue: id })
              return (
                <div key={id} className="flex justify-between text-(--game-text-body) gap-2">
                  <span className="text-(--game-text-muted) truncate text-xs">{name}</span>
                  <span className="text-(--game-accent) text-right min-w-[3ch] text-xs">
                    {count}
                  </span>
                </div>
              )
            })}
            {state.game.population > 0 && (
              <div className="flex justify-between text-(--game-text-body) gap-2">
                <span className="text-(--game-text-muted) truncate text-xs">
                  {t('stores.population')}
                </span>
                <span className="text-(--game-accent) text-right min-w-[3ch] text-xs">
                  {state.game.population}
                </span>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* ── 库存 ── */}
      {hasStores && (
        <CollapsibleSection title={t('panel.stores')} defaultOpen>
          <div className="flex flex-col gap-1.5">
            {CATEGORIES.map(cat => {
              const rows = cat.keys.filter(k => stores[k] !== undefined)
              if (rows.length === 0) return null
              return (
                <CollapsibleSection
                  key={cat.labelKey}
                  title={t(cat.labelKey)}
                  defaultOpen
                >
                  <div className="flex flex-col gap-0.5">
                    {rows.map(key => renderRow(key, t(resI18nKey(key))))}
                  </div>
                </CollapsibleSection>
              )
            })}
            {dynamicKeys.length > 0 && (
              <CollapsibleSection title={t('stores.cat_other')} defaultOpen={false}>
                <div className="flex flex-col gap-0.5">
                  {dynamicKeys.map(key => renderRow(key, key))}
                </div>
              </CollapsibleSection>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* ── 武器 ── */}
      {hasWeapons && (
        <CollapsibleSection title={t('panel.weapons')} defaultOpen>
          <div className="flex flex-col gap-1">
            {weaponKeys.map(key => {
              const nameKey = `build.${key.replace(/ /g, '_')}.name`
              const name = t(nameKey, { defaultValue: key })
              return (
                <div key={key} className="flex justify-between text-(--game-text-body) gap-2">
                  <span className="text-(--game-text-muted) truncate text-xs">{name}</span>
                  <span className="text-(--game-accent) text-right min-w-[3ch] text-xs">
                    {stores[key] ?? 0}
                  </span>
                </div>
              )
            })}
          </div>
        </CollapsibleSection>
      )}
    </div>
  )
}
