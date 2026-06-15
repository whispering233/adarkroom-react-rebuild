/**
 * GameState Reducer — useImmerReducer 驱动，替代原项目 $SM + 路径解析
 *
 * Reducer 签名：(draft, action) => void
 * useImmerReducer 内部自动调用 produce，draft 是当前 state 的 Proxy 代理。
 *
 * 两种 action 模式：
 *   1. 语义 action — 有明确领域含义（LIGHT_FIRE、BUILDER_ADVANCE 等）
 *   2. 草稿回调 — 组件直接传 (draft) => { draft.xxx = yyy }，用于一次性操作
 *
 * 所有 draft.stores 变更统一通过 modifyResource()，自动记录资源变更日志。
 */
import type { GameState, IncomeConfig, ResourceLogEntry } from './types'
import { FireLevel, TempLevel } from './types'
import { CONFIG } from '../config'

// ─── 常量 ────────────────────────────────────────────────

export const MAX_STORE = CONFIG.MAX_STORE

// ─── 资源变更统一入口 ────────────────────────────────────

/**
 * 修改资源值并记录变更日志。
 * player-initiated actions（applyRecipe）不经过此函数。
 */
function modifyResource(
  draft: GameState,
  key: string,
  delta: number,
  source: string,
) {
  const prev = draft.stores[key] ?? 0
  let next = prev + delta
  if (next > MAX_STORE) next = MAX_STORE
  if (next < 0) next = 0
  draft.stores[key] = next

  const actualDelta = next - prev
  if (actualDelta !== 0) {
    const entry: ResourceLogEntry = {
      key,
      delta: actualDelta,
      source,
      tick: draft._globalTick,
    }
    draft.resourceLog.push(entry)
  }
}

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
  // ── 注册收入来源 ──
  | { type: 'REGISTER_INCOME'; key: string; config: IncomeConfig }
  // ── 通用草稿回调（一次性操作，不需要新建 action 类型） ──
  | { type: 'APPLY_RECIPE'; recipe: (draft: GameState) => void }

// ─── Reducer（draft recipe，供 useImmerReducer 使用）───────

export function gameReducer(draft: GameState, action: GameAction): GameState | void {
  switch (action.type) {
    // ── 火堆 ──────────────────────────────────────────

    case 'LIGHT_FIRE': {
      modifyResource(draft, 'wood', -5, 'lightFire')
      draft.game.fire = FireLevel.Burning
      break
    }

    case 'STOKE_FIRE': {
      modifyResource(draft, 'wood', -1, 'stokeFire')
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
      draft._globalTick += 1

      for (const [sourceKey, config] of Object.entries(draft.income)) {
        config.timeLeft -= 1

        if (config.timeLeft <= 0) {
          for (const [res, delta] of Object.entries(config.stores)) {
            modifyResource(draft, res, delta, sourceKey)
          }
          config.timeLeft = config.delay
        }
      }

      // 裁剪日志：只保留最近 60 tick 的记录
      const cutoff = draft._globalTick - 60
      draft.resourceLog = draft.resourceLog.filter(e => e.tick > cutoff)
      break
    }

    // ── 存档加载（return 替换整个状态） ────────────────

    case 'LOAD_SAVE': {
      return action.state
    }

    // ── 注册收入来源 ──────────────────────────────

    case 'REGISTER_INCOME': {
      // 幂等：key 不存在才注册，避免覆盖已有配置
      if (!(action.key in draft.income)) {
        draft.income[action.key] = action.config
      }
      break
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
 * 注册收入来源（幂等）。
 * 范例：dispatch(registerIncome('builder', { delay: 10, stores: { wood: 2 }, timeLeft: 10 }))
 */
export const registerIncome = (
  key: string,
  config: IncomeConfig,
): GameAction => ({
  type: 'REGISTER_INCOME',
  key,
  config,
})

/**
 * 通用草稿回调 action — 用于一次性资源/状态修改。
 * 范例：dispatch(applyRecipe(d => { d.stores.wood += 10 }))
 * 注意：走此通道的资源变更不会记录到 resourceLog（不参与 delta 计算）。
 */
export const applyRecipe = (
  recipe: (draft: GameState) => void,
): GameAction => ({
  type: 'APPLY_RECIPE',
  recipe,
})
