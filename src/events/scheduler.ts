/**
 * Events — 调度器
 *
 * 纯函数式设计，调度状态由 GameLoop 的 ref 持有。
 * 每个 game-second 调用一次 scheduleTick()，检查冷却、扫描池、选事件。
 *
 * 设计决策：
 *   - 不做独立 setTimeout（接入 GameLoop 主循环）
 *   - 调度状态不存 redux（纯函数 + ref 持有，避免不必要重渲染）
 *   - 事件池由 registry 提供，调度器不持有池
 */

import type { GameState } from '../state/types'
import type { GameAction } from '../state/reducer'
import type { EventDef } from './types'

// ─── 常量 ────────────────────────────────────────────────

/** 默认调度冷却范围（分钟），对应原版 3-6 分钟 */
const DEFAULT_COOLDOWN_RANGE: [number, number] = [1, 5]

/** 无可用事件时的重试间隔（game-seconds） */
const RETRY_COOLDOWN = 30

// ─── 调度状态（由 GameLoop 的 ref 持有） ────────────────

export interface SchedulingState {
  /** 剩余冷却（game-seconds） */
  cooldown: number
}

/** 创建初始调度状态（随机首次冷却） */
export function createSchedulingState(): SchedulingState {
  const [min, max] = DEFAULT_COOLDOWN_RANGE
  return {
    cooldown: randomInt(min, max) * 60, // 分钟 → 秒
  }
}

// ─── 核心 Tick ───────────────────────────────────────────

/**
 * 每 game-second 调用一次。
 *
 * @param sched  当前调度状态
 * @param state  当前游戏状态（检查 activeEvent + isAvailable）
 * @param dispatch  用于 dispatch START_EVENT
 * @param pool  事件池（由 registry.getAllEvents() 提供）
 * @returns 新的 SchedulingState（调用方通过 ref 更新）
 */
export function scheduleTick(
  sched: SchedulingState,
  state: GameState,
  dispatch: (action: GameAction) => void,
  pool: EventDef[],
): SchedulingState {
  // 事件进行中 → 不推进冷却
  if (state.game.activeEvent) {
    return sched
  }

  const next = sched.cooldown - 1
  if (next > 0) {
    return { cooldown: next }
  }

  // 冷却归零 → 扫描事件池
  const available = pool.filter(e => e.isAvailable(state))

  if (available.length > 0) {
    const picked = available[Math.floor(Math.random() * available.length)]
    dispatch({ type: 'START_EVENT', eventId: picked.id })

    // 使用事件专属冷却范围（缺省走默认）
    const [min, max] = picked.cooldownMinutes ?? DEFAULT_COOLDOWN_RANGE
    return { cooldown: randomInt(min, max) * 60 } // 分钟 → 秒
  }

  // 无可用事件 → 短时间后重试
  return { cooldown: RETRY_COOLDOWN }
}

// ─── 辅助 ────────────────────────────────────────────────

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min
}
