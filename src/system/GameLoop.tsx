/**
 * GameLoop — 全局游戏循环（始终挂载）
 *
 * 单主循环驱动，通过时间累加器触发各子系统：
 *   - 火堆冷却 + 温度调节（每 5000 game-ms）
 *   - 建造者 NPC 状态机（每 5000 game-ms）
 *   - 收入系统 tick（每 1000 game-ms）
 *
 * 游戏速度由 gameSpeed 模块控制（1×/2×/3×），
 * 每个真实 tick = 100ms × speed 的游戏时间。
 *
 * 叙事推送走 dispatch(pushNarrative(...))，渲染在左栏 NarrativePanel。
 */
import { useEffect, useRef } from 'react'
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
  pushNarrative,
  modifyResource,
  applyRecipe,
  FireLevel,
  TempLevel,
} from '../state'
import { CONFIG } from '../config'
import { getSpeed } from './gameSpeed'

// ─── 常量 ─────────────────────────────────────────────────

/** 主循环间隔（真实毫秒） */
const LOOP_INTERVAL = 100

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

  // ═══════════════════════════════════════════════════════
  //  单主循环（驱动所有子系统）
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    // 时间累加器（game-ms）
    const accum = { fire: 0, builder: 0, income: 0 }

    // 建造者森林解锁倒计时（game-ms），0 = 未在倒计时
    let forestTimer = 0
    let forestUnlocked = false

    const id = setInterval(() => {
      const speed = getSpeed()
      const dt = LOOP_INTERVAL * speed // game-ms per real tick

      // ── 收入 tick（每 1000 game-ms） ──
      accum.income += dt
      while (accum.income >= CONFIG.INCOME_TICK_INTERVAL) {
        accum.income -= CONFIG.INCOME_TICK_INTERVAL
        dispatch(incomeTick())
      }

      const s = stateRef.current

      // ── 环境 tick（火堆 + 温度，每 5000 game-ms） ──
      accum.fire += dt
      while (accum.fire >= CONFIG.FIRE_TICK_INTERVAL) {
        accum.fire -= CONFIG.FIRE_TICK_INTERVAL
        const fire = s.game.fire
        const builderLvl = s.game.builder.level
        const wood = s.stores.wood

        if (fire <= FireLevel.Flickering && builderLvl > 3 && wood > 0) {
          dispatch(stokeFire())
        } else if (fire > FireLevel.Dead) {
          dispatch(fireCool())
        }

        const s2 = stateRef.current
        const newFire = s2.game.fire
        const newTemp = s2.game.temperature

        if (newTemp > TempLevel.Freezing && newTemp > newFire) {
          dispatch(tempDecrease())
        } else if (newTemp < TempLevel.Hot && newTemp < newFire) {
          dispatch(tempIncrease())
        }
      }

      // ── 建造者 NPC tick（每 5000 game-ms） ──
      accum.builder += dt
      while (accum.builder >= CONFIG.BUILDER_TICK_INTERVAL) {
        accum.builder -= CONFIG.BUILDER_TICK_INTERVAL

        // 森林解锁倒计时
        if (forestTimer > 0) {
          forestTimer -= CONFIG.BUILDER_TICK_INTERVAL
          if (forestTimer <= 0 && !forestUnlocked) {
            forestUnlocked = true
            const s3 = stateRef.current
            if (s3.game.builder.level === 1) {
              dispatch(unlockFeature('location.outside'))
              dispatch(applyRecipe(draft => {
                modifyResource(draft, 'wood', CONFIG.STRANGER_GIFT_WOOD)
              }))
              dispatch(pushNarrative(t('room.stranger_gives_wood')))
            }
          }
        }

        const s3 = stateRef.current
        const fire = s3.game.fire
        const temp = s3.game.temperature
        const lvl = s3.game.builder.level

        if (lvl === 0 && fire < FireLevel.Flickering) continue

        // 0 → 1
        if (lvl === 0 && fire >= FireLevel.Flickering) {
          dispatch(builderAdvance(1))
          dispatch(pushNarrative(t('room.stranger_arrives')))
          forestTimer = CONFIG.FOREST_UNLOCK_DELAY
          continue
        }

        // 1 → 2
        if (lvl === 1 && temp >= TempLevel.Warm) {
          dispatch(builderAdvance(2))
          dispatch(pushNarrative(t('room.stranger_shivers')))
          continue
        }

        // 2 → 3
        if (lvl === 2 && temp >= TempLevel.Warm) {
          dispatch(builderAdvance(3))
          dispatch(pushNarrative(t('room.stranger_stops')))
          continue
        }

        // 3 → 4
        if (lvl === 3) {
          dispatch(builderAdvance(4))
          dispatch(pushNarrative(t('room.stranger_helps')))
          dispatch(registerIncome('builder', CONFIG.BUILDER_INCOME))
          continue
        }
      }
    }, LOOP_INTERVAL)

    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
