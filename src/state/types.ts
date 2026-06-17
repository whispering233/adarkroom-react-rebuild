/**
 * A Dark Room — 核心状态类型定义
 *
 * Immer 时代：状态全默认值初始化，draft 直接操作，无需路径解析。
 * 索引签名 [key: string] 仅用于运行时解锁的动态键（资源、建筑、工人等）。
 */

import type { ResourceId } from '../config'
import type { CombatState } from '../combat/types'
import type { EventResult } from '../events/types'
import { getInitialStores } from '../config'

// ─── 资源存储 ────────────────────────────────────────────

/**
 * 资源存储：已知资源 extends ResourceId 提供类型安全，
 * 索引签名允许运行时解锁的动态资源（如 blueprint、alien alloy 等）。
 * 新增资源只需在 config.ts 的 RESOURCES 表中加一行。
 */
export interface Stores extends Record<ResourceId, number> {
  [key: string]: number
}

// ─── 角色 ────────────────────────────────────────────────

export interface CharacterState {
  /** 已获得的 perks */
  perks: Record<string, boolean>
  /** 拳击次数 */
  punches: number
  /** 当前血量 */
  health: number
  /** 是否已清除城市 */
  cityCleared?: boolean
  /** 是否饿死过 */
  starved?: boolean
  /** 是否脱水过 */
  dehydrated?: boolean
}

// ─── 收入配置 ────────────────────────────────────────────

export interface IncomeConfig {
  /** 收入间隔（秒） */
  delay: number
  /** 每次收入的资源变化（正数为收入，负数为消耗） */
  stores: Record<string, number>
  /** 剩余时间（动态计算） */
  timeLeft: number
}

// ─── 游戏核心数据（game 子对象）──────────────────────────

export interface GameData {
  /** 火堆等级 */
  fire: FireLevel
  /** 温度等级 */
  temperature: TempLevel
  /** 建造者状态 */
  builder: { level: number }
  /** 建筑数量（hut, trap, "sulphur mine" 等 — 运行时解锁） */
  buildings: Record<string, number>
  /** 村庄人口 */
  population: number
  /** 工人分配（trapper, hunter 等 — 运行时解锁） */
  workers: Record<string, number>
  /** 盗贼数量 */
  thieves?: number
  /** 被盗资源记录 */
  stolen?: Record<string, number>
  /** 地图数据（后期解锁） */
  world?: { map: unknown; mask: unknown }
  /** 飞船数据（后期解锁） */
  spaceShip?: {
    hull: number
    thrusters: number
    seenWarning?: boolean
    seenShip?: boolean
  }
  /** Outside 探索标记 */
  outside?: { seenForest?: boolean }

  /** 当前进行中的事件（null = 无） */
  activeEvent: {
    /** 事件唯一标识 */
    eventId: string
    /** 当前场景 ID */
    currentScene: string
    /** 场景历史（用于回溯或剧情依赖） */
    sceneHistory: string[]
  } | null

  /** 叙事标记（跨事件持久化） */
  narrative: {
    /** 已完结的事件记录 */
    eventsCompleted: Record<string, EventResult>
    /** 自由命名的叙事标记 */
    flags: Record<string, boolean>
  }
}

// ─── 场景路由 ────────────────────────────────────────────

/** 游戏场景名称 */
export const RoomName = {
  Room: 'room',
  Outside: 'outside',
  Path: 'path',
  World: 'world',
  Space: 'space',
  Fabricator: 'fabricator',
  Ship: 'ship',
} as const
export type RoomName = (typeof RoomName)[keyof typeof RoomName]

// ─── 枚举（const object + type 模式，兼容 erasableSyntaxOnly）───

/** 火堆状态 */
export const FireLevel = {
  Dead: 0,
  Smoldering: 1,
  Flickering: 2,
  Burning: 3,
  Roaring: 4,
} as const
export type FireLevel = (typeof FireLevel)[keyof typeof FireLevel]

/** 温度状态 */
export const TempLevel = {
  Freezing: 0,
  Cold: 1,
  Mild: 2,
  Warm: 3,
  Hot: 4,
} as const
export type TempLevel = (typeof TempLevel)[keyof typeof TempLevel]


// ─── 配置 ────────────────────────────────────────────────

export interface ConfigData {
  soundOn: boolean
  lightsOff: boolean
  hyperMode: boolean
}

// ─── 叙事日志 ────────────────────────────────────────────

/** 单条叙事文本 */
export interface NarrativeEntry {
  /** 自增 ID（用于 React key） */
  id: number
  /** 已解析的 i18n 文本（手写叙事） */
  text: string
  /** 产生时的 tick */
  tick: number
  /** 可选：带来源的资源变更（自动叙事用，由 NarrativePanel 格式化） */
  delta?: DeltaSource
}

// ─── 延迟奖励 ────────────────────────────────────────────

/** 冷却结束后发放的资源奖励 */
export interface PendingReward {
  /** 归属的 cooldown key */
  cooldownKey: string
  /** 资源变更（正=收入） */
  stores: Record<string, number>
  /** 可选：叙事来源标识（如 reward.gather_wood），缺省用 reward.${cooldownKey} */
  source?: string
}

// ─── 资源变更日志 ────────────────────────────────────────

/** 单 tick 内所有资源的净变化 */
export interface ResourceTickLog {
  /** 全局 tick（秒） */
  tick: number
  /** 该 tick 内每项资源的净变化量（正=收入，负=消耗） */
  deltas: Record<string, number>
}

/** 单 tick 内按来源分组的资源变更（用于叙事生成） */
export interface DeltaSource {
  /** 变更来源标识（如 income.builder、cost.fire_light） */
  source: string
  /** 该来源产生的资源变更 */
  stores: Record<string, number>
}

// ─── 根状态 ──────────────────────────────────────────────

export interface GameState {
  /** 功能解锁标记 */
  features: Record<string, boolean>
  /** 当前场景 */
  currentRoom: RoomName
  /** 资源存储（17 已知 + 动态扩展） */
  stores: Stores
  /** 角色数据 */
  character: CharacterState
  /** 收入配置（builder, hunter, trapper 等 — 运行时注册） */
  income: Record<string, IncomeConfig>
  /** 通用计时器残留值 */
  timers: Record<string, number>
  /** 游戏核心状态（火堆、温度、建筑等） */
  game: GameData
  /** 游玩统计 */
  playStats: Record<string, number>
  /** 上一局数据（prestige） */
  previous: Record<string, unknown>
  /** 出征装备（torch, waterskin 等 — 运行时获取） */
  outfit: Record<string, number>
  /** 用户配置 */
  config: ConfigData
  /** 延迟事件等待队列 */
  wait: Record<string, number>
  /** 按钮冷却残留值（game-seconds） */
  cooldown: Record<string, number>
  /** 冷却结束待发放的奖励 */
  pendingRewards: Record<string, PendingReward>
  /** 每个 tick 的净资源日志（滑动窗口，用于计算 delta 面板） */
  resourceLog: ResourceTickLog[]
  /** 叙事日志（手动推送，上限 50 条，新条目在前） */
  narrativeLog: NarrativeEntry[]
  /** 资源变更日志（自动生成，上限 50 条，新条目在前） */
  deltaLog: NarrativeEntry[]
  /** 叙事自增 ID */
  _nextNarrativeId: number

  /** 战斗状态（null = 非战斗） */
  combat: CombatState | null
  /** 当前 tick 内尚未 flush 的累加 delta */
  _pendingDeltas: Record<string, number>
  /** 当前 tick 内按来源分组的资源变更（叙事生成用） */
  _pendingSources: DeltaSource[]
  /** 全局逻辑 tick 计数器（秒） */
  _globalTick: number
  /** 存档版本号 */
  version: number
}

// ─── 初始状态 ────────────────────────────────────────────

export const INITIAL_STATE: GameState = {
  features: {},
  currentRoom: RoomName.Room,
  stores: getInitialStores(),
  character: {
    health: 100,
    punches: 0,
    perks: {},
  },
  income: {},
  timers: {},
  game: {
    fire: FireLevel.Dead,
    temperature: TempLevel.Freezing,
    builder: { level: 0 },
    buildings: {},
    population: 0,
    workers: {},
    activeEvent: null,
    narrative: { eventsCompleted: {}, flags: {} },
  },
  playStats: {},
  previous: {},
  outfit: {},
  config: {
    soundOn: true,
    lightsOff: false,
    hyperMode: false,
  },
  wait: {},
  cooldown: {},
  pendingRewards: {},
  resourceLog: [],
  _pendingDeltas: {},
  _pendingSources: [],
  narrativeLog: [],
  deltaLog: [],
  _nextNarrativeId: 1,
  combat: null,
  _globalTick: 0,
  version: 1.3,
}
