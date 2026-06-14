/**
 * GameState Reducer — useImmerReducer 驱动，替代原项目 $SM + 路径解析
 *
 * Reducer 签名：(draft, action) => void
 * useImmerReducer 内部自动调用 produce，draft 是当前 state 的 Proxy 代理。
 *
 * 两种 action 模式：
 *   1. 语义 action — 有明确领域含义（LIGHT_FIRE、BUILDER_ADVANCE 等）
 *   2. 草稿回调 — 组件直接传 (draft) => { draft.xxx = yyy }，用于一次性操作
 */

import type { GameState } from './types'
import { FireLevel, TempLevel } from './types'

// ─── 常量 ────────────────────────────────────────────────

/** 数值上限（与原项目一致） */
export const MAX_STORE = 99999999999999

// ─── Action 类型 ──────────────────────────────────────────

export type GameAction =
  // ── 火堆操作 ──
  | { type: 'LIGHT_FIRE' }
  | { type: 'STOKE_FIRE' }
  | { type: 'FIRE_COOL' }
  // ── 温度调节 ──
  | { type: 'TEMP_INCREASE' }
  | { type: 'TEMP_DECREASE' }
  // ── 建造者推进 ──
  | { type: 'BUILDER_ADVANCE'; toLevel: number }
  // ── 功能解锁 ──
  | { type: 'UNLOCK_FEATURE'; feature: string }
  // ── 收入计时推进 ──
  | { type: 'INCOME_TICK' }
  // ── 存档加载 ──
  | { type: 'LOAD_SAVE'; state: GameState }
  // ── 通用草稿回调（一次性操作，不需要新建 action 类型） ──
  | { type: 'APPLY_RECIPE'; recipe: (draft: GameState) => void }

// ─── Reducer（draft recipe，供 useImmerReducer 使用）───────

export function gameReducer(draft: GameState, action: GameAction): GameState | void {
  switch (action.type) {
    // ── 火堆 ──────────────────────────────────────────

    case 'LIGHT_FIRE': {
      draft.stores.wood -= 5
      if (draft.stores.wood < 0) draft.stores.wood = 0
      draft.game.fire = FireLevel.Burning
      break
    }

    case 'STOKE_FIRE': {
      draft.stores.wood -= 1
      if (draft.stores.wood < 0) draft.stores.wood = 0
      const next = draft.game.fire + 1
      draft.game.fire =
        next > FireLevel.Roaring ? FireLevel.Roaring : (next as FireLevel)
      break
    }

    case 'FIRE_COOL': {
      const next = draft.game.fire - 1
      draft.game.fire =
        next < FireLevel.Dead ? FireLevel.Dead : (next as FireLevel)
      break
    }

    // ── 温度 ──────────────────────────────────────────

    case 'TEMP_INCREASE': {
      const next = draft.game.temperature + 1
      draft.game.temperature =
        next > TempLevel.Hot ? TempLevel.Hot : (next as TempLevel)
      break
    }

    case 'TEMP_DECREASE': {
      const next = draft.game.temperature - 1
      draft.game.temperature =
        next < TempLevel.Freezing ? TempLevel.Freezing : (next as TempLevel)
      break
    }

    // ── 建造者 ────────────────────────────────────────

    case 'BUILDER_ADVANCE': {
      draft.game.builder.level = action.toLevel
      break
    }

    // ── 功能解锁 ──────────────────────────────────────

    case 'UNLOCK_FEATURE': {
      draft.features[action.feature] = true
      break
    }

    // ── 收入 Tick ─────────────────────────────────────

    case 'INCOME_TICK': {
      for (const config of Object.values(draft.income)) {
        config.timeLeft -= 1

        if (config.timeLeft <= 0) {
          for (const [res, delta] of Object.entries(config.stores)) {
            const current = draft.stores[res] ?? 0
            let nextVal = current + delta
            if (nextVal > MAX_STORE) nextVal = MAX_STORE
            if (nextVal < 0) nextVal = 0
            draft.stores[res] = nextVal
          }
          config.timeLeft = config.delay
        }
      }
      break
    }

    // ── 存档加载（return 替换整个状态） ────────────────

    case 'LOAD_SAVE': {
      return action.state
    }

    // ── 通用草稿回调 ──────────────────────────────────

    case 'APPLY_RECIPE': {
      action.recipe(draft)
      break
    }

    default:
      break
  }
}

// ─── 便捷 Action 创建函数 ─────────────────────────────────

export const lightFire = (): GameAction => ({ type: 'LIGHT_FIRE' })
export const stokeFire = (): GameAction => ({ type: 'STOKE_FIRE' })
export const fireCool = (): GameAction => ({ type: 'FIRE_COOL' })
export const tempIncrease = (): GameAction => ({ type: 'TEMP_INCREASE' })
export const tempDecrease = (): GameAction => ({ type: 'TEMP_DECREASE' })

export const builderAdvance = (toLevel: number): GameAction => ({
  type: 'BUILDER_ADVANCE',
  toLevel,
})

export const unlockFeature = (feature: string): GameAction => ({
  type: 'UNLOCK_FEATURE',
  feature,
})

export const incomeTick = (): GameAction => ({ type: 'INCOME_TICK' })

export const loadSave = (state: GameState): GameAction => ({
  type: 'LOAD_SAVE',
  state,
})

/**
 * 通用草稿回调 action — 用于一次性资源/状态修改。
 * 范例：dispatch(applyRecipe(d => { d.stores.wood += 10 }))
 */
export const applyRecipe = (
  recipe: (draft: GameState) => void,
): GameAction => ({
  type: 'APPLY_RECIPE',
  recipe,
})
