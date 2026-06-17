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
  increasePopulation,
  FireLevel,
  TempLevel,
} from '../state'
import { CONFIG } from '../config'
import { getSpeed, forceSpeed, releaseSpeed } from './gameSpeed'
import { createSchedulingState, scheduleTick } from '../events/scheduler'
import type { SchedulingState } from '../events/scheduler'
import { getAllEvents } from '../events/registry'

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
    const accum = { fire: 0, builder: 0, income: 0, event: 0 }

    // 事件调度状态（由 ref 持有，不触发重渲染）
    let schedulingRef: SchedulingState = createSchedulingState()
    let prevCombatActive = false

    // 建造者森林解锁倒计时（game-ms），0 = 未在倒计时
    let forestTimer = 0
    let forestUnlocked = false

    // 人口增长倒计时（game-seconds），0 = 需要重新调度
    let popTimer = 0

    const id = setInterval(() => {
      const speed = getSpeed()
      const dt = LOOP_INTERVAL * speed // game-ms per real tick

      // ── 收入 tick（每 1000 game-ms） ──
      accum.income += dt
      let incomeTicks = 0
      while (accum.income >= CONFIG.INCOME_TICK_INTERVAL) {
        accum.income -= CONFIG.INCOME_TICK_INTERVAL
        dispatch(incomeTick())
        incomeTicks += 1
      }

      // ── 人口增长倒计时（在 income ticks 批量处理完后统一推进）──
      if (incomeTicks > 0) {
        const s0 = stateRef.current
        const huts = s0.game.buildings['hut'] ?? 0
        if (huts > 0) {
          for (let i = 0; i < incomeTicks; i++) {
            if (popTimer <= 0) {
              const [min, max] = CONFIG.POP_INCREASE_INTERVAL
              popTimer = Math.floor(Math.random() * (max - min)) + min
            }
            popTimer -= 1
          }
          if (popTimer <= 0) {
            const maxPop = huts * CONFIG.HUT_ROOM
            const space = Math.min(maxPop - s0.game.population, CONFIG.HUT_ROOM * 4)
            if (space > 0) {
              const num = Math.max(1, Math.floor(Math.random() * space))
              dispatch(increasePopulation(num))
              if (num === 1) {
                dispatch(pushNarrative(t('outside.pop_increase_1')))
              } else if (num < CONFIG.HUT_ROOM * 1) {
                dispatch(pushNarrative(t('outside.pop_increase_few')))
              } else if (num < CONFIG.HUT_ROOM * 2) {
                dispatch(pushNarrative(t('outside.pop_increase_small')))
              } else if (num < CONFIG.HUT_ROOM * 3) {
                dispatch(pushNarrative(t('outside.pop_increase_convoy')))
              } else {
                dispatch(pushNarrative(t('outside.pop_increase_boom')))
              }
            }
          }
        } else {
          popTimer = 0
        }

        // 检测 compass 解锁 Path
        const currentState = stateRef.current
        if ((currentState.stores['compass'] ?? 0) >= 1 && !currentState.features['location.path']) {
          dispatch(unlockFeature('location.path'))
          dispatch(pushNarrative(t('path.unlocked')))
        }
      }

      // ── 事件调度 tick（每 1000 game-ms） ──
      accum.event += dt
      while (accum.event >= CONFIG.INCOME_TICK_INTERVAL) {
        accum.event -= CONFIG.INCOME_TICK_INTERVAL
        if (!stateRef.current.game.activeEvent) {
          schedulingRef = scheduleTick(schedulingRef, stateRef.current, dispatch, getAllEvents())
        }
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
              dispatch(registerIncome('gatherer', { delay: 10, stores: { wood: 1 }, timeLeft: 10 }))
              dispatch(applyRecipe(draft => {
                modifyResource(draft, 'wood', CONFIG.STRANGER_GIFT_WOOD, 'event.stranger_gift')
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

      // ── 战斗倍速控制 ──
      const sCombat = stateRef.current
      const inCombat = sCombat.combat?.active ?? false
      if (inCombat && !prevCombatActive) {
        forceSpeed(1)
      } else if (!inCombat && prevCombatActive) {
        releaseSpeed()
      }
      prevCombatActive = inCombat
    }, LOOP_INTERVAL)

    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
