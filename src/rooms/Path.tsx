/**
 * Path — 出发准备场景
 *
 * 在出发探索世界前，从村庄仓库中选择装备装入背包。
 * 第一版硬编码 World 为唯一目的地。
 */
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameState, useGameDispatch, applyRecipe, embarkWorld } from '../state'
import { RESOURCES, ITEM_WEIGHT, BAG_UPGRADES } from '../config'
import { WORLD } from '../world/constants'
import { Button } from '../components/Button'
import { calculateScore } from '../system/scoring'
import styles from './Path.module.css'

function resourceI18nKey(key: string): string {
  return `stores.${key.replace(/ /g, '_')}`
}

export function Path() {
  const { t } = useTranslation()
  const state = useGameState()
  const dispatch = useGameDispatch()

  const outfit = state.outfit ?? {}
  const stores = state.stores
  const perks = state.character.perks ?? {}

  // ── 背包容量 ──
  const capacity = useMemo(() => {
    let cap = WORLD.BASE_BAG_SPACE
    for (const [upgrade, bonus] of Object.entries(BAG_UPGRADES)) {
      if ((stores[upgrade] ?? 0) > 0) cap += bonus
    }
    return cap
  }, [stores])

  // ── 当前背包重量 ──
  const usedWeight = useMemo(() => {
    let w = 0
    for (const [key, count] of Object.entries(outfit)) {
      w += count * (ITEM_WEIGHT[key] ?? 1)
    }
    return w
  }, [outfit])

  const freeSpace = capacity - usedWeight

  // ── 可携带物品列表（从 RESOURCES 中有库存的筛选） ──
  const carryableItems = useMemo(() => {
    const excludeBasic = new Set([
      'wood', 'fur', 'meat', 'scales', 'teeth', 'bait',
      'iron', 'coal', 'steel', 'sulphur', 'cloth', 'leather',
    ])
    const items: string[] = []
    for (const key of Object.keys(RESOURCES)) {
      if ((stores[key] ?? 0) > 0 && !excludeBasic.has(key)) {
        items.push(key)
      }
    }
    return items
  }, [stores])

  // ── 护甲名称 ──
  const armourName = useMemo(() => {
    if ((stores['kinetic armour'] ?? 0) > 0) return t('armour.kinetic')
    if ((stores['s armour'] ?? 0) > 0) return t('armour.steel')
    if ((stores['i armour'] ?? 0) > 0) return t('armour.iron')
    if ((stores['l armour'] ?? 0) > 0) return t('armour.leather')
    return t('armour.none')
  }, [stores, t])

  // ── 水量上限 ──
  const maxWater = useMemo(() => {
    if ((stores['fluid recycler'] ?? 0) > 0) return WORLD.BASE_WATER + 100
    if ((stores['water tank'] ?? 0) > 0) return WORLD.BASE_WATER + 50
    if ((stores.cask ?? 0) > 0) return WORLD.BASE_WATER + 20
    if ((stores.waterskin ?? 0) > 0) return WORLD.BASE_WATER + 10
    return WORLD.BASE_WATER
  }, [stores])

  // ── 增减装备 ──
  const adjustOutfit = useCallback(
    (key: string, delta: number) => {
      dispatch(applyRecipe(d => {
        const cur = d.outfit[key] ?? 0
        const weight = ITEM_WEIGHT[key] ?? 1
        // freeSpace is stale in this closure — recalc
        let currentUsed = 0
        for (const [k, c] of Object.entries(d.outfit)) {
          currentUsed += c * (ITEM_WEIGHT[k] ?? 1)
        }
        const cap = capacity  // captured from above
        const free = cap - currentUsed
        const maxByWeight = Math.floor(free / weight) + cur
        const maxByStore = d.stores[key] ?? 0
        const next = Math.max(0, Math.min(cur + delta, maxByWeight, maxByStore))
        if (next === cur) return
        d.outfit[key] = next
        if (next === 0) {
          delete d.outfit[key]
        }
      }))
    },
    [dispatch, capacity],
  )

  const hasMeat = (outfit['cured meat'] ?? 0) > 0

  return (
    <div className={styles.pathPanel}>
      {/* 状态信息 */}
      <div className={styles.statRow}>
        <span className={styles.statLabel}>{t('path.armour')}</span>
        <span className={styles.statValue}>{armourName}</span>
      </div>
      <div className={styles.statRow}>
        <span className={styles.statLabel}>{t('path.water_capacity')}</span>
        <span className={styles.statValue}>{maxWater}</span>
      </div>

      {/* 背包空间 */}
      <div className={styles.bagSpace}>
        {t('path.bag_space', { used: Math.floor(usedWeight), total: capacity })}
      </div>

      {/* 装备列表 */}
      <div className={styles.outfitting}>
        {carryableItems.map(key => {
          const count = outfit[key] ?? 0
          const inStore = stores[key] ?? 0
          const weight = ITEM_WEIGHT[key] ?? 1
          const canAdd = freeSpace >= weight && count < inStore
          const canRemove = count > 0

          return (
            <div key={key} className={styles.outfitRow}>
              <span className={styles.itemName}>{t(resourceI18nKey(key))}</span>
              <span className={styles.itemCount}>{count}</span>
              <div className={styles.itemBtnGroup}>
                <button
                  className={styles.itemBtn}
                  onClick={() => adjustOutfit(key, -1)}
                  disabled={!canRemove}
                >-1</button>
                <button
                  className={styles.itemBtn}
                  onClick={() => adjustOutfit(key, -10)}
                  disabled={!canRemove}
                >-10</button>
                <button
                  className={styles.itemBtn}
                  onClick={() => adjustOutfit(key, 1)}
                  disabled={!canAdd}
                >+1</button>
                <button
                  className={styles.itemBtn}
                  onClick={() => adjustOutfit(key, 10)}
                  disabled={!canAdd}
                >+10</button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Perks */}
      {Object.keys(perks).length > 0 && (
        <div className={styles.perks}>
          {Object.entries(perks)
            .filter(([, v]) => v)
            .map(([k]) => (
              <span key={k}>{t(`perk.${k}`)}</span>
            ))}
        </div>
      )}

      {/* 指南针提示 */}
      {(stores.compass ?? 0) > 0 && (
        <div className={styles.compass}>{t('path.compass')}</div>
      )}

      {/* 积分显示 */}
      <div className={styles.score}>{t('path.score', { score: calculateScore(state) })}</div>

      {/* 出发按钮 */}
      <div className={styles.embarkBtn}>
        <Button
          id="embark"
          text={t('path.embark')}
          onClick={() => dispatch(embarkWorld())}
          disabled={!hasMeat}
          cooldown={WORLD.DEATH_COOLDOWN}
          tooltip={!hasMeat ? t('path.need_meat') : undefined}
        />
      </div>
    </div>
  )
}
