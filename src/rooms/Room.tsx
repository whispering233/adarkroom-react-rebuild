/**
 * Room — 暗室场景（纯 UI）
 *
 * 所有全局定时器（火堆冷却、Builder NPC、收入）已迁移至 GameLoop。
 * 本组件仅负责火堆交互按钮。
 */
import { useCallback } from 'react'
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
    </div>
  )
}
