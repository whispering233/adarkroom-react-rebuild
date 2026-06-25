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
import type { EventResult } from '../events/types'
import type { CombatState } from '../combat/types'
import { FireLevel, TempLevel } from './types'
import { CONFIG, WORKER_INCOME, shouldKeepOnReturn } from '../config'
import type { MapDef, PlacedEntity, TerrainType, MapTile } from '../world/types'
import { WORLD, TERRAINS, LANDMARKS } from '../world/constants'
import { hasPrestigeStores, savePrestigeToState, collectPrestigeStoresToState } from '../system/scoring'
import { generateMap, createNewMask, createMask, lightMap } from '../world/generator'
import type { EntityCatalog } from '../world/entity/types'
import { buildEntityCellMap } from '../world/entity/types'
import { getAllEntities } from '../world/entity/catalog'

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
  // ── 事件系统 ──
  | { type: 'START_EVENT'; eventId: string; sceneId?: string }
  | { type: 'GO_TO_SCENE'; sceneId: string }
  | { type: 'END_EVENT' }
  | { type: 'COMPLETE_EVENT'; eventId: string; result: EventResult }
  | { type: 'SET_NARRATIVE_FLAG'; key: string; value: boolean }
  // ── 战斗系统 ──
  | { type: 'START_COMBAT'; config: CombatState }
  | { type: 'END_COMBAT' }
  // ── 角色 ──
  | { type: 'ADD_PERK'; perk: string }
  // ── 世界地图 ──
  | { type: 'EMBARK_WORLD' }
  | { type: 'RETURN_FROM_WORLD'; died: boolean }
  | { type: 'ENTER_MAP'; mapId: string; pos?: [number, number] }
  | { type: 'LEAVE_MAP' }
  // ── 配置 ──
  | { type: 'SET_VIEWPORT_MODE'; mode: 'normal' | 'fullmap' }

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
      // v1.3 → v1.4 migration: tiles → worldMap
      if (action.state.version < 1.4) {
        migrateV1_3toV1_4(action.state)
      }
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

    // ── 事件系统 ──────────────────────────────────────

    case 'START_EVENT': {
      draft.game.activeEvent = {
        eventId: action.eventId,
        currentScene: action.sceneId ?? 'start',
        sceneHistory: [],
      }
      break
    }

    case 'GO_TO_SCENE': {
      const ev = draft.game.activeEvent
      if (ev) {
        ev.sceneHistory.push(ev.currentScene)
        ev.currentScene = action.sceneId
      }
      break
    }

    case 'END_EVENT': {
      draft.game.activeEvent = null
      break
    }

    case 'COMPLETE_EVENT': {
      draft.game.narrative.eventsCompleted[action.eventId] = action.result
      break
    }

    case 'SET_NARRATIVE_FLAG': {
      draft.game.narrative.flags[action.key] = action.value
      break
    }

    // ── 战斗系统 ──────────────────────────────────────

    case 'START_COMBAT': {
      draft.combat = { ...action.config, active: true }
      break
    }

    case 'END_COMBAT': {
      draft.combat = null
      break
    }

    // ── 角色 Perk ────────────────────────────────────
    case 'ADD_PERK': {
      draft.character.perks[action.perk] = true
      break
    }

    // ── 世界地图 ──────────────────────────────────────

    case 'EMBARK_WORLD': {
      // 扣减 outfit
      for (const [key, count] of Object.entries(draft.outfit)) {
        modifyResource(draft, key, -count, 'cost.embark')
      }
      // Cache 地标仅在存在 prestige 存档时生成
      const filteredLandmarks = LANDMARKS.filter(lm => {
        if (lm.type === 'cache') return hasPrestigeStores(draft)
        return true
      })
      // 首次生成地图
      const worldDef: MapDef = {
        id: 'world',
        size: WORLD.DEFAULT_MAP_RADIUS,
        terrainTypes: TERRAINS,
        landmarks: filteredLandmarks,
        encounterPool: [],
        isAvailable: () => true,
      }
      if (!draft.game.world) {
        const { worldMap, mask, explored, traveled } = generateMap(worldDef)
        draft.game.world = {
          mapId: 'world',
          worldMap,
          mask,
          explored,
          traveled,
          usedOutposts: {},
        }
      }
      // 初始化运行时
      const maxW = getMaxWater(draft)
      const maxH = getMaxHealth(draft)
      const embarkSpawnPos: [number, number] = worldDef.spawnPos ?? [WORLD.DEFAULT_MAP_RADIUS, WORLD.DEFAULT_MAP_RADIUS]
      draft.game.worldRuntime = {
        curPos: embarkSpawnPos,
        water: maxW,
        health: maxH,
        maxHealth: maxH,
        foodMove: 0,
        waterMove: 0,
        fightCounter: 0,
        starvation: false,
        thirst: false,
        mask: draft.game.world.mask.map(row => [...row]),
        explored: draft.game.world.explored.map(row => [...row]),
        traveled: draft.game.world.traveled.map(row => [...row]),
        usedOutposts: { ...draft.game.world.usedOutposts },
        minesFound: {},
        mapStack: [],
      }
      draft.features['location.world'] = true
      draft.currentRoom = 'world'
      const baseLightRadius = draft.stores.torch > 0 ? WORLD.LIGHT_RADIUS * 2 : WORLD.LIGHT_RADIUS
      const lightRadius = draft.character.perks?.scout ? baseLightRadius * 2 : baseLightRadius
      lightMap(
        draft.game.worldRuntime.mask,
        embarkSpawnPos,
        lightRadius,
      )
      lightMap(
        draft.game.worldRuntime.explored,
        embarkSpawnPos,
        lightRadius,
      )
      break
    }

    case 'RETURN_FROM_WORLD': {
      const wr = draft.game.worldRuntime
      if (!wr) break
      if (action.died) {
        delete draft.game.worldRuntime
        draft.cooldown['embark'] = WORLD.DEATH_COOLDOWN
        draft.currentRoom = 'room'
        draft.outfit = {}
      } else {
        if (draft.game.world) {
          draft.game.world.mask = wr.mask
          draft.game.world.explored = wr.explored
          draft.game.world.traveled = wr.traveled
          draft.game.world.usedOutposts = wr.usedOutposts
          if (wr.minesFound?.iron && !draft.game.buildings['iron mine']) {
            draft.game.buildings['iron mine'] = 1
          }
          if (wr.minesFound?.coal && !draft.game.buildings['coal mine']) {
            draft.game.buildings['coal mine'] = 1
          }
          if (wr.minesFound?.sulphur && !draft.game.buildings['sulphur mine']) {
            draft.game.buildings['sulphur mine'] = 1
          }
          if (wr.shipFound && !draft.features['location.spaceShip']) {
            draft.features['location.spaceShip'] = true
          }
          if (wr.executionerFound && !draft.features['location.fabricator']) {
            draft.features['location.fabricator'] = true
          }
        }
        delete draft.game.worldRuntime
        draft.currentRoom = 'path'
        for (const [key, count] of Object.entries(draft.outfit)) {
          if (shouldKeepOnReturn(key)) {
            modifyResource(draft, key, count, 'return.embark')
          } else {
            draft.outfit[key] = 0
          }
        }
      }
      break
    }

    case 'ENTER_MAP': {
      const wr = draft.game.worldRuntime
      if (!wr) break
      wr.mapStack.push({
        mapId: draft.game.world!.mapId,
        pos: [...wr.curPos],
        terrainMap: draft.game.world!.worldMap.terrainMap,
        entityLayer: draft.game.world!.worldMap.entityLayer,
        mask: wr.mask,
        explored: wr.explored.map(row => [...row]),
        traveled: wr.traveled.map(row => [...row]),
        usedOutposts: { ...wr.usedOutposts },
      })
      draft.game.world!.mapId = action.mapId
      wr.curPos = action.pos ?? [0, 0]
      const mapSize = draft.game.world!.worldMap.terrainMap.length
      wr.mask = createNewMask(mapSize, wr.curPos)
      wr.explored = createMask(mapSize)
      wr.traveled = createMask(mapSize)
      wr.usedOutposts = {}
      break
    }

    case 'LEAVE_MAP': {
      const wr = draft.game.worldRuntime
      if (!wr) break
      if (wr.mapStack.length > 0) {
        const prev = wr.mapStack.pop()!
        draft.game.world!.mapId = prev.mapId
        if (draft.game.world) {
          draft.game.world.worldMap.terrainMap = prev.terrainMap
          draft.game.world.worldMap.entityLayer = prev.entityLayer
          const entityCatalog: EntityCatalog = {}
          for (const e of getAllEntities()) {
            entityCatalog[e.type] = e
          }
          draft.game.world.worldMap.entityCellMap = buildEntityCellMap(prev.entityLayer, entityCatalog)
        }
        wr.curPos = prev.pos
        wr.mask = prev.mask
        wr.explored = prev.explored
        wr.traveled = prev.traveled
        wr.usedOutposts = prev.usedOutposts
      }
      break
    }

    // ── 配置 ──
    case 'SET_VIEWPORT_MODE': {
      draft.config.viewportMode = action.mode
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

// ── 事件 Action Creator ──────────────────────────────────

export const startEvent = (eventId: string, sceneId?: string): GameAction => ({
  type: 'START_EVENT',
  eventId,
  sceneId,
})

export const goToScene = (sceneId: string): GameAction => ({
  type: 'GO_TO_SCENE',
  sceneId,
})

export const endEvent = (): GameAction => ({ type: 'END_EVENT' })

export const completeEvent = (eventId: string, result: EventResult): GameAction => ({
  type: 'COMPLETE_EVENT',
  eventId,
  result,
})

export const setNarrativeFlag = (key: string, value: boolean): GameAction => ({
  type: 'SET_NARRATIVE_FLAG',
  key,
  value,
})

// ── 战斗 Action Creator ──────────────────────────────────

export const startCombat = (config: CombatState): GameAction => ({
  type: 'START_COMBAT',
  config,
})

export const endCombat = (): GameAction => ({ type: 'END_COMBAT' })

// ── Perk Action Creator ────────────────────────────────

export const addPerk = (perk: string): GameAction => ({ type: 'ADD_PERK', perk })

/**
 * 判断角色是否已拥有指定 perk。
 */
export function hasPerk(state: GameState, perk: string): boolean {
  return state.character.perks[perk] === true
}

// ── Prestige Action Creators ────────────────────────────

/**
 * 保存 prestige 数据（资源快照 + 累计积分）。
 * 在游戏结束时调用（如飞船起飞前）。
 */
export const savePrestige = (): GameAction => ({
  type: 'APPLY_RECIPE' as const,
  recipe: savePrestigeToState,
})

/**
 * 收集上局的 prestige 资源到当前库存。
 * 由 Cache 地标事件触发。
 */
export const collectPrestigeStores = (): GameAction => ({
  type: 'APPLY_RECIPE' as const,
  recipe: collectPrestigeStoresToState,
})

// ── 世界地图 Action Creators ────────────────────────────

export const embarkWorld = (): GameAction => ({ type: 'EMBARK_WORLD' })
export const returnFromWorld = (died: boolean): GameAction => ({ type: 'RETURN_FROM_WORLD', died })
export const enterMap = (mapId: string, pos?: [number, number]): GameAction => ({ type: 'ENTER_MAP', mapId, pos })
export const leaveMap = (): GameAction => ({ type: 'LEAVE_MAP' })

// ── 配置 Action Creator ────────────────────────────────
export const setViewportMode = (mode: 'normal' | 'fullmap'): GameAction => ({
  type: 'SET_VIEWPORT_MODE',
  mode,
})

// ─── World 辅助函数 ────────────────────────────────────

function getMaxHealth(draft: GameState): number {
  const s = draft.stores
  if (s['kinetic armour'] > 0) return WORLD.BASE_HEALTH + 75
  if (s['s armour'] > 0) return WORLD.BASE_HEALTH + 35
  if (s['i armour'] > 0) return WORLD.BASE_HEALTH + 15
  if (s['l armour'] > 0) return WORLD.BASE_HEALTH + 5
  return WORLD.BASE_HEALTH
}

function getMaxWater(draft: GameState): number {
  const s = draft.stores
  if (s['fluid recycler'] > 0) return WORLD.BASE_WATER + 100
  if (s['water tank'] > 0) return WORLD.BASE_WATER + 50
  if (s.cask > 0) return WORLD.BASE_WATER + 20
  if (s.waterskin > 0) return WORLD.BASE_WATER + 10
  return WORLD.BASE_WATER
}

// ─── 存档迁移 ──────────────────────────────────────

/**
 * 从 v1.3 迁移到 v1.4：将旧格式的 tiles (MapTile[][]) 转换为 WorldMap 结构。
 *
 * 旧格式：persistentWorldData.tiles — 每个格子包含 terrain + optional landmark
 * 新格式：persistentWorldData.worldMap — { terrainMap, entityLayer, entityCellMap }
 *
 * 迁移步骤：
 *   1. 扫描 tiles → 提取 terrain → terrainMap
 *   2. 扫描 tiles → 分组地标 → entityLayer（含多格 footprint 处理）
 *   3. buildEntityCellMap → entityCellMap
 *   4. 原子验证：地形维度、地标覆盖完整性
 *   5. 赋值后删除旧 tiles
 *
 * 若验证失败则 throw Error，保留原 tiles 不删除。
 */
function migrateV1_3toV1_4(state: GameState): void {
  const pw = state.game.world
  if (!pw || !pw.tiles) return

  const tiles: MapTile[][] = pw.tiles
  const size = tiles.length

  const terrainMap: TerrainType[][] = Array.from({ length: size }, (_, x) =>
    Array.from({ length: size }, (_, y) => tiles[x][y].terrain),
  )

  const entityLayer: PlacedEntity[] = []
  const processed = new Set<string>()

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      const tile = tiles[x][y]
      if (!tile.landmark) continue
      const key = `${x},${y}`
      if (processed.has(key)) continue

      const lm = tile.landmark
      const lmDef = LANDMARKS.find(l => l.type === lm)
      const fp = lmDef?.footprint ?? { w: 1, h: 1 }

      // 判断是否为多格 footprint 的左上角锚点
      const isTopLeft =
        (x === 0 || tiles[x - 1]?.[y]?.landmark !== lm) &&
        (y === 0 || tiles[x]?.[y - 1]?.landmark !== lm)

      if (isTopLeft) {
        for (let dx = 0; dx < fp.w; dx++) {
          for (let dy = 0; dy < fp.h; dy++) {
            processed.add(`${x + dx},${y + dy}`)
          }
        }
        entityLayer.push({ entityId: lm, anchorX: x, anchorY: y })
      }
    }
  }

  const entityCatalog: EntityCatalog = {}
  for (const e of getAllEntities()) {
    entityCatalog[e.type] = e
  }
  const entityCellMap = buildEntityCellMap(entityLayer, entityCatalog)

  // 原子验证
  if (!terrainMap || terrainMap.length !== size) {
    throw new Error(
      `v1.3→v1.4 migration: terrainMap dimension mismatch (expected ${size}, got ${terrainMap?.length ?? 0})`,
    )
  }
  for (let x = 0; x < size; x++) {
    if (!terrainMap[x] || terrainMap[x].length !== size) {
      throw new Error(`v1.3→v1.4 migration: terrainMap row ${x} dimension mismatch`)
    }
  }

  // 验证所有旧地标格都被实体 footprint 覆盖
  const actualLandmarkCells = new Set<string>()
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      if (tiles[x][y].landmark) {
        actualLandmarkCells.add(`${x},${y}`)
      }
    }
  }
  const expectedLandmarkCells = new Set<string>()
  for (const placed of entityLayer) {
    const def = LANDMARKS.find(l => l.type === placed.entityId)
    const fp = def?.footprint ?? { w: 1, h: 1 }
    for (let dx = 0; dx < fp.w; dx++) {
      for (let dy = 0; dy < fp.h; dy++) {
        expectedLandmarkCells.add(`${placed.anchorX + dx},${placed.anchorY + dy}`)
      }
    }
  }
  for (const cell of actualLandmarkCells) {
    if (!expectedLandmarkCells.has(cell)) {
      throw new Error(`v1.3→v1.4 migration: landmark cell ${cell} not covered by entity footprint`)
    }
  }

  pw.worldMap = {
    size,
    terrainMap,
    entityLayer,
    entityCellMap,
  }
  delete pw.tiles
  state.version = 1.4
}
