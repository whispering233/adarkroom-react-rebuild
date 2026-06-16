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
 * 所有 draft.stores 变更统一通过 modifyResource()，累加到 _pendingDeltas；
 * INCOME_TICK 时 flush 为单条 ResourceTickLog（每个 tick 一条，避免高频 key 挤占）。
 */
import type { GameState, IncomeConfig } from './types'
import { FireLevel, TempLevel } from './types'
import { CONFIG } from '../config'

// ─── 常量 ────────────────────────────────────────────────

export const MAX_STORE = CONFIG.MAX_STORE

// ─── 资源变更统一入口 ────────────────────────────────────

/**
 * 修改资源值并累加到当前 tick 的 _pendingDeltas。
 * 实际的 ResourceTickLog 由 INCOME_TICK 统一 flush。
 *
 * @param source 可选来源标签（如 income.builder、cost.fire_light），
 *   传入后自动归并到 _pendingSources，INCOME_TICK 时生成叙事条目。
 */
export function modifyResource(
  draft: GameState,
  key: string,
  delta: number,
  source?: string,
) {
  const prev = draft.stores[key] ?? 0
  let next = prev + delta
  if (next > MAX_STORE) next = MAX_STORE
  if (next < 0) next = 0
  draft.stores[key] = next

  const actualDelta = next - prev
  if (actualDelta !== 0) {
    draft._pendingDeltas[key] = (draft._pendingDeltas[key] ?? 0) + actualDelta

    // 带 source 的变更归并到 _pendingSources（按 source 去重合并）
    if (source) {
      const existing = draft._pendingSources.find(s => s.source === source)
      if (existing) {
        existing.stores[key] = (existing.stores[key] ?? 0) + actualDelta
      } else {
        draft._pendingSources.push({
          source,
          stores: { [key]: actualDelta },
        })
      }
    }
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
  // ── 叙事推送 ──
  | { type: 'PUSH_NARRATIVE'; text: string }
  // ── 冷却控制 ──
  | { type: 'START_COOLDOWN'; id: string; seconds: number; reward?: { stores: Record<string, number>; source?: string } }
  // ── 通用草稿回调（一次性操作，不需要新建 action 类型） ──
  | { type: 'APPLY_RECIPE'; recipe: (draft: GameState) => void }

// ─── Reducer（draft recipe，供 useImmerReducer 使用）───────

export function gameReducer(draft: GameState, action: GameAction): GameState | void {
  switch (action.type) {
    // ── 火堆 ──────────────────────────────────────────

    case 'LIGHT_FIRE': {
      modifyResource(draft, 'wood', -5, 'cost.fire_light')
      draft.game.fire = FireLevel.Burning
      break
    }

    case 'STOKE_FIRE': {
      modifyResource(draft, 'wood', -1, 'cost.fire_stoke')
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
      // ① flush 上一 tick 的累加结果 → 一条 ResourceTickLog
      const pendingKeys = Object.keys(draft._pendingDeltas)
      if (pendingKeys.length > 0) {
        draft.resourceLog.push({
          tick: draft._globalTick,
          deltas: { ...draft._pendingDeltas },
        })
        draft._pendingDeltas = {}
      }

      // ①.5 flush _pendingSources → 叙事条目（每条一个来源）
      for (const ds of draft._pendingSources) {
        draft.narrativeLog.unshift({
          id: draft._nextNarrativeId++,
          text: '', // 由 NarrativePanel 根据 delta 格式化
          tick: draft._globalTick,
          delta: { source: ds.source, stores: { ...ds.stores } },
        })
      }
      draft._pendingSources = []
      // 裁剪叙事日志
      if (draft.narrativeLog.length > 50) {
        draft.narrativeLog = draft.narrativeLog.slice(0, 50)
      }

      // ② 推进全局时钟
      draft._globalTick += 1

      // ②.5 冷却递减 + 延迟奖励发放
      for (const [key, remaining] of Object.entries(draft.cooldown)) {
        const next = remaining - 1
        if (next < 0) {
          delete draft.cooldown[key]
        } else if (next === 0) {
          draft.cooldown[key] = 0
          const reward = draft.pendingRewards[key]
          if (reward) {
            for (const [res, delta] of Object.entries(reward.stores)) {
              modifyResource(draft, res, delta, reward.source ?? `reward.${key}`)
            }
            delete draft.pendingRewards[key]
          }
        } else {
          draft.cooldown[key] = next
        }
      }

      // ③ 处理收入
      for (const [key, config] of Object.entries(draft.income)) {
        config.timeLeft -= 1

        if (config.timeLeft <= 0) {
          for (const [res, delta] of Object.entries(config.stores)) {
            modifyResource(draft, res, delta, `income.${key}`)
          }
          config.timeLeft = config.delay
        }
      }

      // ④ 裁剪资源日志：保留最近 60 tick
      if (draft.resourceLog.length > 60) {
        draft.resourceLog = draft.resourceLog.slice(-60)
      }
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

    // ── 叙事推送 ──────────────────────────────────

    case 'PUSH_NARRATIVE': {
      draft.narrativeLog.unshift({
        id: draft._nextNarrativeId++,
        text: action.text,
        tick: draft._globalTick,
      })
      // 保留最近 50 条
      if (draft.narrativeLog.length > 50) {
        draft.narrativeLog = draft.narrativeLog.slice(0, 50)
      }
      break
    }

    // ── 冷却控制 ──────────────────────────────────

    case 'START_COOLDOWN': {
      draft.cooldown[action.id] = action.seconds
      if (action.reward) {
        draft.pendingRewards[action.id] = {
          cooldownKey: action.id,
          stores: { ...action.reward.stores },
          source: action.reward.source,
        }
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
 * 推送一条叙事文本到叙事日志。
 * 文本应为已解析的 i18n 字符串（在调用处用 t() 转换）。
 */
export const pushNarrative = (text: string): GameAction => ({
  type: 'PUSH_NARRATIVE',
  text,
})

/**
 * 启动冷却并可选附加延迟奖励。
 * 冷却在 INCOME_TICK 中每秒递减；归零时自动发放 reward 并清理。
 */
export const startCooldown = (
  id: string,
  seconds: number,
  reward?: { stores: Record<string, number>; source?: string },
): GameAction => ({
  type: 'START_COOLDOWN',
  id,
  seconds,
  reward,
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
