/**
 * Room — 暗室场景（纯 UI）
 *
 * 所有全局定时器（火堆冷却、Builder NPC、收入）已迁移至 GameLoop。
 * 本组件负责火堆交互 + 建造/制造按钮。
 */
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useGameState,
  useGameDispatch,
  lightFire,
  stokeFire,
  FireLevel,
} from '../state'
import { CONFIG } from '../config'
import { Button } from '../components/Button'
import { CRAFTABLES, evaluateUnlock, buildCraftable } from './craftables'
import type { CraftableDef } from './craftables'

export function Room() {
  const { t } = useTranslation()
  const state = useGameState()
  const dispatch = useGameDispatch()

  const fireLevel = state.game.fire
  const builderLevel = state.game.builder.level

  // ── 火堆按钮回调 ────────────────────────────────────
  const handleLightFire = useCallback(() => {
    dispatch(lightFire())
  }, [dispatch])

  const handleStokeFire = useCallback(() => {
    dispatch(stokeFire())
  }, [dispatch])

  // ── 建造按钮回调 ────────────────────────────────────
  const handleBuild = useCallback(
    (id: string) => {
      dispatch(buildCraftable(id))
    },
    [dispatch],
  )

  // ── 筛选可建造项目 ──────────────────────────────
  const buildables = useMemo(() => {
    if (builderLevel < 4) return []
    return Object.values(CRAFTABLES)
      .filter((def): def is CraftableDef => def.type === 'building')
      .map((def) => ({
        def,
        unlockState: evaluateUnlock(state, def),
      }))
  }, [builderLevel, state])

  // ── 当前数值（用于 tooltip） ──────────────────────────
  const currentBuildings = state.game.buildings

  // ── 渲染 ────────────────────────────────────────────
  const isFireDead = fireLevel === FireLevel.Dead
  const isFireMax = fireLevel === FireLevel.Roaring

  return (
    <div className="flex flex-col items-center justify-center min-h-full text-center px-4 gap-6 py-8">
      {/* 火堆区域 */}
      <div className="flex gap-3 flex-wrap justify-center">
        {isFireDead ? (
          <Button
            id="light"
            text={t('room.light_fire')}
            onClick={handleLightFire}
            cost={CONFIG.LIGHT_FIRE_COST}
          />
        ) : (
          <Button
            id="stoke"
            text={t('room.stoke_fire')}
            onClick={handleStokeFire}
            cost={CONFIG.STOKE_FIRE_COST}
            disabled={isFireMax}
            tooltip={isFireMax ? t('room.fire_max') : undefined}
          />
        )}
      </div>

      {/* 建造区域 */}
      {buildables.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-xs uppercase tracking-[0.2em] mb-1 text-(--game-accent)">
            {t('build.header')}
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            {buildables.map(({ def, unlockState }) => {
              if (unlockState === 'hidden') return null

              const current = currentBuildings[def.id] ?? 0
              const isMaxed = current >= def.max
              const isLocked = unlockState === 'locked' || isMaxed
              const cost = def.cost(state)

              // 生成 tooltip
              let tooltip: string | undefined
              if (isMaxed) {
                tooltip = t(`build.${def.id.replace(/ /g, '_')}.max`)
              } else if (isLocked) {
                const missing = Object.entries(cost)
                  .filter(([k, v]) => (state.stores[k] ?? 0) < v)
                  .map(([k]) => t(`stores.${k.replace(/ /g, '_')}`))
                if (missing.length > 0) {
                  tooltip = `${t('stores.no_income')}: ${missing.join(', ')}`
                }
              }

              return (
                <Button
                  key={def.id}
                  id={`build_${def.id.replace(/ /g, '-')}`}
                  text={t(`build.${def.id.replace(/ /g, '_')}.name`)}
                  onClick={() => handleBuild(def.id)}
                  cost={cost}
                  disabled={isLocked}
                  tooltip={tooltip}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
