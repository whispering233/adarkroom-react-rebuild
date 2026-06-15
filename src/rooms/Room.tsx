/**
 * Room — 暗室场景（纯 UI）
 *
 * 所有全局定时器（火堆冷却、Builder NPC、收入）已迁移至 GameLoop。
 * 本组件仅负责按钮交互和状态展示。
 */
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useGameState,
  useGameDispatch,
  lightFire,
  stokeFire,
  applyRecipe,
  FireLevel,
} from '../state'
import { Button } from '../components/Button'

export function Room() {
  const { t } = useTranslation()
  const state = useGameState()
  const dispatch = useGameDispatch()

  const fireLevel = state.game.fire

  // ── 按钮回调 ────────────────────────────────────────
  const handleLightFire = useCallback(() => {
    dispatch(lightFire())
  }, [dispatch])

  const handleStokeFire = useCallback(() => {
    dispatch(stokeFire())
  }, [dispatch])

  const handleGatherWood = useCallback(() => {
    dispatch(applyRecipe(draft => { draft.stores.wood += 1 }))
  }, [dispatch])

  // ── 渲染 ────────────────────────────────────────────
  const isFireDead = fireLevel === FireLevel.Dead
  const isFireMax = fireLevel === FireLevel.Roaring

  return (
    <div className="flex flex-col items-center justify-center min-h-full text-center px-4">
      <div className="flex gap-3 flex-wrap justify-center">
        {isFireDead ? (
          <Button
            id="light"
            text={t('room.light_fire')}
            onClick={handleLightFire}
            cost={{ wood: 5 }}
          />
        ) : (
          <Button
            id="stoke"
            text={t('room.stoke_fire')}
            onClick={handleStokeFire}
            cost={{ wood: 1 }}
            disabled={isFireMax}
            tooltip={isFireMax ? t('room.fire_max') : undefined}
          />
        )}

        <Button
          id="gather"
          text={t('room.gather_wood')}
          onClick={handleGatherWood}
        />
      </div>
    </div>
  )
}
