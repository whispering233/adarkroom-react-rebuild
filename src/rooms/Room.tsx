/**
 * Room — 暗室场景
 *
 * 核心游戏循环模块，包含：
 *   - 火堆交互（light / stoke / cooling / temperature）
 *   - 建造者 NPC 状态机（→解锁 Outside）
 *   - 收入系统（自动资源生产）
 *   - 通知消息系统
 *   - 资源面板
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  useGameState,
  useGameDispatch,
  lightFire,
  stokeFire,
  fireCool,
  tempIncrease,
  tempDecrease,
  builderAdvance,
  unlockFeature,
  incomeTick,
  applyRecipe,
  FireLevel,
  TempLevel,
  FIRE_TEXT,
  TEMP_TEXT,
} from '../state'
import { Button } from '../components/Button'
import { StoresPanel } from '../components/StoresPanel'

// ─── 通知消息 ─────────────────────────────────────────────

interface Notification {
  id: number
  text: string
}

// ─── 组件 ─────────────────────────────────────────────────

export function Room() {
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
    }, 4000)
  }, [])

  // ── 从 state 取值（全默认初始化，无需 ?? 守卫） ──────
  const fireLevel = state.game.fire
  const tempLevel = state.game.temperature
  const builderLevel = state.game.builder.level

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
    }, 5000)

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

      // Level -1：初始等待，什么都不做
      if (lvl === -1) return

      // 0 → 1：火堆亮起
      if (lvl === 0 && fire >= FireLevel.Flickering) {
        dispatch(builderAdvance(1))
        addNotification('a ragged stranger stumbles through the door...')

        // 30 秒后解锁森林
        setTimeout(() => {
          const s2 = stateRef.current
          if (s2.game.builder.level === 1 && !forestUnlockedRef.current) {
            forestUnlockedRef.current = true
            dispatch(unlockFeature('location.outside'))
            dispatch(applyRecipe(draft => { draft.stores.wood += 4 }))
            addNotification('the stranger gives you 4 wood and points outside')
          }
        }, 30000)
        return
      }

      // 1 → 2：温度达到 Warm
      if (lvl === 1 && temp >= TempLevel.Warm) {
        dispatch(builderAdvance(2))
        addNotification('the stranger shivers...')
        return
      }

      // 2 → 3：仍然温暖
      if (lvl === 2 && temp >= TempLevel.Warm) {
        dispatch(builderAdvance(3))
        addNotification('the stranger stops shivering...')
        return
      }

      // 3 → 4：自动推进
      if (lvl === 3) {
        dispatch(builderAdvance(4))
        addNotification('standing by the fire, she says she can help')
        dispatch(applyRecipe(draft => {
          draft.income.builder = {
            delay: 10,
            stores: { wood: 2 },
            timeLeft: 10,
          }
        }))
        return
      }
    }, 5000)

    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ═══════════════════════════════════════════════════════
  //  收入系统（每秒 tick，reducer 统一处理）
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    const id = setInterval(() => {
      dispatch(incomeTick())
    }, 1000)

    return () => clearInterval(id)
  }, [dispatch])

  // ═══════════════════════════════════════════════════════
  //  按钮回调
  // ═══════════════════════════════════════════════════════
  const handleLightFire = useCallback(() => {
    dispatch(lightFire())
  }, [dispatch])

  const handleStokeFire = useCallback(() => {
    dispatch(stokeFire())
  }, [dispatch])

  const handleGatherWood = useCallback(() => {
    dispatch(applyRecipe(draft => { draft.stores.wood += 1 }))
  }, [dispatch])

  // ═══════════════════════════════════════════════════════
  //  渲染
  // ═══════════════════════════════════════════════════════
  const isFireDead = fireLevel === FireLevel.Dead
  const isFireMax = fireLevel === FireLevel.Roaring

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-41px)] text-center">
      <StoresPanel />

      <div className="mt-8 px-4 max-w-lg">
        {/* 标题 */}
        <h1
          className="text-4xl tracking-[0.3em] text-[#f4e4c1]"
          style={{
            textShadow: '0 0 20px rgba(201, 75, 26, 0.5)',
            animation: 'roomFlicker 3s infinite alternate',
          }}
        >
          {fireLevel >= FireLevel.Flickering ? 'A Firelit Room' : 'A Dark Room'}
        </h1>

        {/* 状态描述 */}
        <p className="mt-3 text-base text-gray-500 tracking-[0.15em]">
          the fire is {isFireDead ? '❄️ dead' : `🔥 ${FIRE_TEXT[fireLevel]}`}
        </p>
        <p className="text-sm text-gray-600 tracking-[0.1em]">
          the room is {TEMP_TEXT[tempLevel]}
        </p>

        {/* 建造者状态 */}
        {builderLevel >= 1 && builderLevel < 4 && (
          <p className="mt-3 text-xs text-gray-600 italic">
            {builderLevel === 1 && 'a stranger huddles near the door'}
            {builderLevel === 2 && 'the stranger shivers by the fire'}
            {builderLevel === 3 && 'the stranger warms by the fire'}
          </p>
        )}
        {builderLevel >= 4 && (
          <p className="mt-3 text-xs text-green-700">
            +2 wood / 10s (builder)
          </p>
        )}

        {/* 操作按钮 */}
        <div className="mt-6 flex gap-3 flex-wrap justify-center">
          {isFireDead ? (
            <Button
              id="light"
              text="light fire (5 wood)"
              onClick={handleLightFire}
              cost={{ wood: 5 }}
            />
          ) : (
            <Button
              id="stoke"
              text="stoke fire (1 wood)"
              onClick={handleStokeFire}
              cost={{ wood: 1 }}
              disabled={isFireMax}
              tooltip={isFireMax ? 'fire is already roaring' : undefined}
            />
          )}

          <Button
            id="gather"
            text="gather wood"
            onClick={handleGatherWood}
          />
        </div>

        {/* 通知消息 */}
        {notifications.length > 0 && (
          <div className="mt-6 space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="rounded border border-gray-700/50 bg-gray-900/60 px-4 py-2 font-mono text-sm text-gray-300"
                style={{ animation: 'notifFadeIn 0.3s ease-out' }}
              >
                {n.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
