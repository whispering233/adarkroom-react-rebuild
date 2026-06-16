/**
 * Room — 暗室场景（纯 UI）
 *
 * 所有全局定时器（火堆冷却、Builder NPC、收入）已迁移至 GameLoop。
 * 本组件负责火堆交互 + 建造按钮（grid 分栏布局）。
 *
 * 按钮可访问性统一由 computeButtonState 计算，不再分散判断。
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
import { CRAFTABLES, computeButtonState, buildCraftable } from './craftables'
import type { CraftableDef } from './craftables'

export function Room() {
  const { t } = useTranslation()
  const state = useGameState()
  const dispatch = useGameDispatch()

  const fireLevel = state.game.fire
  const builderLevel = state.game.builder.level
  const currentBuildings = state.game.buildings

  const handleLightFire = useCallback(() => dispatch(lightFire()), [dispatch])
  const handleStokeFire = useCallback(() => dispatch(stokeFire()), [dispatch])
  const handleBuild = useCallback(
    (id: string) => dispatch(buildCraftable(id)),
    [dispatch],
  )

  // ── 建造按钮状态（统一入口） ─────────────────────
  const buildables = useMemo(() => {
    if (builderLevel < 4) return []
    return Object.values(CRAFTABLES)
      .filter((def): def is CraftableDef => def.type === 'building')
      .map((def) => ({
        def,
        btn: computeButtonState(state, def),
      }))
  }, [builderLevel, state])

  const isFireDead = fireLevel === FireLevel.Dead
  const isFireMax = fireLevel === FireLevel.Roaring

  return (
    <div className="flex flex-col items-start justify-start min-h-full text-left px-4 gap-6 py-8">
      {/* 火堆 — 单独一行 */}
      <div>
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
            cost={isFireMax ? undefined : CONFIG.STOKE_FIRE_COST}
            disabled={isFireMax}
            tooltip={isFireMax ? t('room.fire_max') : undefined}
          />
        )}
      </div>

      {/* 建造区域 — grid 分栏 */}
      {buildables.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="text-xs uppercase tracking-[0.2em] text-(--game-accent)">
            {t('build.header')}
          </div>
          <div className="flex flex-col gap-2">
            {buildables
              .filter(b => b.btn.visible)
              .map(({ def, btn }) => {
                const current = currentBuildings[def.id] ?? 0
                const isMaxed = current >= def.max
                const maxKey = `build.${def.id.replace(/ /g, '_')}.max`
                return (
                  <Button
                    key={def.id}
                    id={`build_${def.id.replace(/ /g, '-')}`}
                    label={t(`build.${def.id.replace(/ /g, '_')}.name`)}
                    count={`${current}/${def.max}`}
                    onClick={() => handleBuild(def.id)}
                    cost={isMaxed ? undefined : def.cost(state)}
                    disabled={btn.disabled}
                    tooltip={isMaxed ? t(maxKey) : undefined}
                  />
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
