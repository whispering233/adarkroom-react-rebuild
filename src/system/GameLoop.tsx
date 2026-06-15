/**
 * GameLoop — 全局游戏循环（始终挂载）
 *
 * 集中管理所有跨场景定时器，不依赖场景挂载/卸载：
 *   - 火堆冷却 + 温度调节（5s）
 *   - 建造者 NPC 状态机（5s）
 *   - 收入系统 tick（1s）
 *   - 全局通知消息
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useGameState,
  useGameDispatch,
  stokeFire,
  fireCool,
  tempIncrease,
  tempDecrease,
  builderAdvance,
  unlockFeature,
  incomeTick,
  registerIncome,
  applyRecipe,
  FireLevel,
  TempLevel,
} from '../state'
import { CONFIG } from '../config'

// ─── 通知消息 ─────────────────────────────────────────────

interface Notification {
  id: number
  text: string
}

// ─── 组件 ─────────────────────────────────────────────────

export function GameLoop() {
  const { t } = useTranslation()
  const state = useGameState()
  const dispatch = useGameDispatch()

  // ── 状态 ref（供定时器读取最新值） ────────────────────
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  })

  // ── 通知系统 ────────────────────────────────────────
  const [notifications, setNotifications] = useState<Notification[]>([])
  const notifIdRef = useRef(0)

  const addNotification = useCallback((text: string) => {
    const id = ++notifIdRef.current
    setNotifications((prev) => [...prev, { id, text }])
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, CONFIG.NOTIFICATION_DURATION)
  }, [])

  // ═══════════════════════════════════════════════════════
  //  环境定时器 — 火堆冷却 + 温度调节（每 5 秒）
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    const id = setInterval(() => {
      const s = stateRef.current
      const fire = s.game.fire
      const builderLvl = s.game.builder.level
      const wood = s.stores.wood

      // 建造者自动添柴（builder level > 3 且火堆不够旺）
      if (fire <= FireLevel.Flickering && builderLvl > 3 && wood > 0) {
        dispatch(stokeFire())
      } else if (fire > FireLevel.Dead) {
        // 自然冷却
        dispatch(fireCool())
      }

      // 温度向火堆等级靠拢
      const s2 = stateRef.current
      const newFire = s2.game.fire
      const newTemp = s2.game.temperature

      if (newTemp > TempLevel.Freezing && newTemp > newFire) {
        dispatch(tempDecrease())
      } else if (newTemp < TempLevel.Hot && newTemp < newFire) {
        dispatch(tempIncrease())
      }
    }, CONFIG.FIRE_TICK_INTERVAL)

    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ═══════════════════════════════════════════════════════
  //  建造者 NPC 状态机（每 5 秒推进）
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    // 确保每个 encounter 只解锁一次森林
    const forestUnlockedRef = { current: false }

    const id = setInterval(() => {
      const s = stateRef.current
      const fire = s.game.fire
      const temp = s.game.temperature
      const lvl = s.game.builder.level

      // Level 0：等待火堆亮起，什么都不做
      if (lvl === 0 && fire < FireLevel.Flickering) return

      // 0 → 1：火堆亮起
      if (lvl === 0 && fire >= FireLevel.Flickering) {
        dispatch(builderAdvance(1))
        addNotification(t('room.stranger_arrives'))

        // 30 秒后解锁森林
        setTimeout(() => {
          const s2 = stateRef.current
          if (s2.game.builder.level === 1 && !forestUnlockedRef.current) {
            forestUnlockedRef.current = true
            dispatch(unlockFeature('location.outside'))
            dispatch(applyRecipe(draft => { draft.stores.wood += CONFIG.STRANGER_GIFT_WOOD }))
            addNotification(t('room.stranger_gives_wood'))
          }
        }, CONFIG.FOREST_UNLOCK_DELAY)
        return
      }

      // 1 → 2：温度达到 Warm
      if (lvl === 1 && temp >= TempLevel.Warm) {
        dispatch(builderAdvance(2))
        addNotification(t('room.stranger_shivers'))
        return
      }

      // 2 → 3：仍然温暖
      if (lvl === 2 && temp >= TempLevel.Warm) {
        dispatch(builderAdvance(3))
        addNotification(t('room.stranger_stops'))
        return
      }

      // 3 → 4：自动推进
      if (lvl === 3) {
        dispatch(builderAdvance(4))
        addNotification(t('room.stranger_helps'))
        dispatch(registerIncome('builder', CONFIG.BUILDER_INCOME))
        return
      }
    }, CONFIG.BUILDER_TICK_INTERVAL)

    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ═══════════════════════════════════════════════════════
  //  收入系统（每秒 tick，reducer 统一处理）
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    const id = setInterval(() => {
      dispatch(incomeTick())
    }, CONFIG.INCOME_TICK_INTERVAL)

    return () => clearInterval(id)
  }, [dispatch])

  // ═══════════════════════════════════════════════════════
  //  渲染：通知栏
  // ═══════════════════════════════════════════════════════
  if (notifications.length === 0) return null

  return (
    <div className="px-4 pt-3 space-y-2 w-full max-w-sm mx-auto">
      {notifications.map((n) => (
        <div
          key={n.id}
          className="rounded border border-gray-700/50 bg-gray-900/60 px-4 py-2 font-mono text-sm text-gray-300 animate-[notifFadeIn_0.3s_ease-out]"
        >
          {n.text}
        </div>
      ))}
    </div>
  )
}
