/**
 * Ship — 古老星舰场景
 *
 * 飞船加固/引擎升级/起飞决策。
 * Phase 2 将在此接入 Space 模块出口。
 */
import { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameState, useGameDispatch, applyRecipe, modifyResource } from '../state'
import { Button } from '../components/Button'

export function Ship() {
  const { t } = useTranslation()
  const state = useGameState()
  const dispatch = useGameDispatch()

  // ── 初始化 spaceShip 状态（首次访问时） ──
  useEffect(() => {
    if (!state.game.spaceShip) {
      dispatch(applyRecipe(d => {
        d.game.spaceShip = { hull: 0, thrusters: 1 }
      }))
    }
  }, [dispatch, state.game.spaceShip])

  const hull = state.game.spaceShip?.hull ?? 0
  const thrusters = state.game.spaceShip?.thrusters ?? 1
  const hasSeenWarning = state.game.spaceShip?.seenWarning ?? false
  const alloy = state.stores['alien alloy'] ?? 0

  const handleReinforce = useCallback(() => {
    if (alloy < 1) return
    dispatch(applyRecipe(d => {
      modifyResource(d, 'alien alloy', -1, 'cost.ship.reinforce')
      if (d.game.spaceShip) d.game.spaceShip.hull += 1
    }))
  }, [dispatch, alloy])

  const handleUpgrade = useCallback(() => {
    if (alloy < 1) return
    dispatch(applyRecipe(d => {
      modifyResource(d, 'alien alloy', -1, 'cost.ship.upgrade')
      if (d.game.spaceShip) d.game.spaceShip.thrusters += 1
    }))
  }, [dispatch, alloy])

  const handleLiftOff = useCallback(() => {
    if (!hasSeenWarning) {
      dispatch(applyRecipe(d => {
        if (d.game.spaceShip) d.game.spaceShip.seenWarning = true
      }))
      return
    }
    dispatch(applyRecipe(d => {
      d.currentRoom = 'space' as any
    }))
  }, [dispatch, hasSeenWarning])

  return (
    <div className="flex flex-col items-start justify-start min-h-full text-left px-4 gap-6 py-8">
      <div className="text-xs uppercase tracking-[0.2em] text-(--game-accent)">
        {t('nav.ship')}
      </div>

      {/* Stats */}
      <div className="flex flex-col gap-2 text-sm text-(--game-text-body)">
        <div>
          {t('ship.hull')}: <span className="text-(--game-accent) font-semibold">{hull}</span>
        </div>
        <div>
          {t('ship.engine')}: <span className="text-(--game-accent) font-semibold">{thrusters}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <Button
          id="ship-reinforce"
          label={t('ship.reinforce')}
          onClick={handleReinforce}
          cost={{ 'alien alloy': 1 }}
          disabled={alloy < 1}
        />
        <Button
          id="ship-upgrade"
          label={t('ship.upgrade')}
          onClick={handleUpgrade}
          cost={{ 'alien alloy': 1 }}
          disabled={alloy < 1}
        />
      </div>

      {/* Lift Off */}
      <div className="mt-4">
        <Button
          id="ship-liftoff"
          text={hasSeenWarning ? t('ship.liftoff') : t('ship.liftoff_warn')}
          onClick={handleLiftOff}
          disabled={hull <= 0}
          tooltip={hull <= 0 ? t('ship.need_hull') : undefined}
        />
      </div>

      {!hasSeenWarning && (
        <p className="text-xs text-(--game-text-muted) mt-2">{t('ship.warning')}</p>
      )}
    </div>
  )
}
