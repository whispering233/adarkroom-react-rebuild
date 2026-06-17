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
import { CONFIG, WORKER_INCOME } from '../config'

// ─── 常量 ────────────────────────────────────────────────

export const MAX_STORE = CONFIG.MAX_STORE

// ─── 工人辅助函数 ──────────────────────────────────────

/**
 * 计算当前未分配的采集者人数。
 * gatherer = 总人口 − 所有已分配到各职业的工人数之和
 */
export function getNumGatherers(draft: GameState): number {
  let assigned = 0
  for (const count of Object.values(draft.game.workers)) {
    assigned += count
  }
  const gatherers = draft.game.population - assigned
  return gatherers < 0 ? 0 : gatherers
}

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
  // ── 工人分配 ──
  | { type: 'ASSIGN_WORKER'; role: string; count?: number }
  | { type: 'UNASSIGN_WORKER'; role: string; count?: number }
  // ── 人口变化 ──
  | { type: 'INCREASE_POPULATION'; num?: number }
  | { type: 'KILL_VILLAGERS'; count: number }
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

      // ①.5 flush _pendingSources → delta 叙事条目
      for (const ds of draft._pendingSources) {
        draft.deltaLog.unshift({
          id: draft._nextNarrativeId++,
          text: '',
          tick: draft._globalTick,
          delta: { source: ds.source, stores: { ...ds.stores } },
        })
      }
      draft._pendingSources = []
      if (draft.deltaLog.length > CONFIG.NARRATIVE_LOG_MAX) {
        draft.deltaLog = draft.deltaLog.slice(0, CONFIG.NARRATIVE_LOG_MAX)
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

      // ③ 处理收入（per-worker 动态产量）
      for (const [key, config] of Object.entries(draft.income)) {
        config.timeLeft -= 1

        if (config.timeLeft <= 0) {
          // 确定工人数：gatherer=剩余人口，worker职业=分配人数，其他=1(固定)
          const workerCount = key === 'gatherer'
            ? getNumGatherers(draft)
            : key in WORKER_INCOME
              ? (draft.game.workers[key] ?? 0)
              : 1

          if (workerCount > 0) {
            for (const [res, baseRate] of Object.entries(config.stores)) {
              const delta = baseRate * workerCount
              if (delta !== 0) {
                modifyResource(draft, res, delta, `income.${key}`)
              }
            }
          }
          config.timeLeft = config.delay
        }
      }

      // ④ 裁剪资源日志：保留最近 60 tick
      if (draft.resourceLog.length > CONFIG.RESOURCE_LOG_MAX) {
        draft.resourceLog = draft.resourceLog.slice(-CONFIG.RESOURCE_LOG_MAX)
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
      if (draft.narrativeLog.length > CONFIG.NARRATIVE_LOG_MAX) {
        draft.narrativeLog = draft.narrativeLog.slice(0, CONFIG.NARRATIVE_LOG_MAX)
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

    // ── 工人分配 ──────────────────────────────

    case 'ASSIGN_WORKER': {
      const amt = action.count ?? 1
      const available = getNumGatherers(draft)
      if (available >= amt) {
        draft.game.workers[action.role] = (draft.game.workers[action.role] ?? 0) + amt
      }
      break
    }

    case 'UNASSIGN_WORKER': {
      const amt = action.count ?? 1
      const current = draft.game.workers[action.role] ?? 0
      if (current >= amt) {
        draft.game.workers[action.role] = current - amt
      }
      break
    }

    // ── 人口增长 ──────────────────────────────

    case 'INCREASE_POPULATION': {
      const huts = draft.game.buildings['hut'] ?? 0
      if (huts <= 0) break
      const maxPop = huts * CONFIG.HUT_ROOM
      const current = draft.game.population
      const space = maxPop - current
      if (space <= 0) break
      // 使用传入值或随机增量：space/2 ~ space（至少 1）
      const num = action.num ?? Math.max(1, Math.floor(Math.random() * (space / 2) + space / 2))
      draft.game.population += Math.min(num, space)
      break
    }

    // ── 屠杀村民 ──────────────────────────────

    case 'KILL_VILLAGERS': {
      const count = action.count
      if (count <= 0) break
      // 先减总人口
      draft.game.population = Math.max(0, draft.game.population - count)
      // 若人口不足以支撑当前工人数，从各职业扣回
      let assigned = 0
      for (const w of Object.values(draft.game.workers)) {
        assigned += w
      }
      let shortfall = assigned - draft.game.population // 工人总数超出人口的部分
      if (shortfall > 0) {
        for (const role of Object.keys(draft.game.workers)) {
          const w = draft.game.workers[role] ?? 0
          if (w <= 0) continue
          const reduce = Math.min(w, shortfall)
          draft.game.workers[role] = w - reduce
          shortfall -= reduce
          if (shortfall <= 0) break
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
export const assignWorker = (role: string, count = 1): GameAction => ({
  type: 'ASSIGN_WORKER',
  role,
  count,
})

export const unassignWorker = (role: string, count = 1): GameAction => ({
  type: 'UNASSIGN_WORKER',
  role,
  count,
})

export const increasePopulation = (num?: number): GameAction => ({
  type: 'INCREASE_POPULATION',
  num,
})

export const killVillagers = (count: number): GameAction => ({
  type: 'KILL_VILLAGERS',
  count,
})

export const applyRecipe = (
  recipe: (draft: GameState) => void,
): GameAction => ({
  type: 'APPLY_RECIPE',
  recipe,
})
