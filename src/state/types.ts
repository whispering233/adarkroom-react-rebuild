/**
 * A Dark Room — 核心状态类型定义
 *
 * 对应原始项目的 State 全局对象，全部强类型化。
 * 使用索引签名 [key: string] 保留动态扩展能力（游戏后期会解锁新资源/建筑）。
 */

// ─── 资源存储 ────────────────────────────────────────────
/** 已知核心资源。索引签名允许运行时解锁的新资源类型。 */
export interface Stores {
  wood: number
  fur: number
  meat: number
  scales: number
  teeth: number
  iron: number
  coal: number
  steel: number
  sulphur: number
  cloth: number
  leather: number
  'cured meat': number
  bullets: number
  'energy cell': number
  medicine: number
  hypo: number
  stim: number
  /** 动态解锁的资源（如 blueprint、alien alloy、grenade 等） */
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

// ─── 游戏状态 ────────────────────────────────────────────
export interface GameData {
  /** 火堆等级 */
  fire: number // FireLevel
  /** 温度等级 */
  temperature: number // TempLevel
  /** 建造者状态 */
  builder: {
    level: number
  }
  /** 建筑数量 */
  buildings: Record<string, number>
  /** 村庄人口 */
  population: number
  /** 工人分配 */
  workers: Record<string, number>
  /** 盗贼相关 */
  thieves?: number
  stolen?: Record<string, number>
  /** 地图数据（后期解锁） */
  world?: {
    map: unknown
    mask: unknown
  }
  /** 飞船数据（后期解锁） */
  spaceShip?: {
    hull: number
    thrusters: number
    seenWarning?: boolean
    seenShip?: boolean
  }
  /** Outside 是否见过森林 */
  outside?: {
    seenForest?: boolean
  }
  [key: string]: unknown
}

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

/** 火堆文字描述 */
export const FIRE_TEXT: Record<number, string> = {
  [FireLevel.Dead]: 'dead',
  [FireLevel.Smoldering]: 'smoldering',
  [FireLevel.Flickering]: 'flickering',
  [FireLevel.Burning]: 'burning',
  [FireLevel.Roaring]: 'roaring',
}

/** 温度文字描述 */
export const TEMP_TEXT: Record<number, string> = {
  [TempLevel.Freezing]: 'freezing',
  [TempLevel.Cold]: 'cold',
  [TempLevel.Mild]: 'mild',
  [TempLevel.Warm]: 'warm',
  [TempLevel.Hot]: 'hot',
}

// ─── 配置 ────────────────────────────────────────────────
export interface ConfigData {
  soundOn: boolean
  lightsOff: boolean
  hyperMode: boolean
}

// ─── 根状态 ──────────────────────────────────────────────
export interface GameState {
  /** 功能解锁标记 */
  features: Record<string, boolean>
  /** 资源存储 */
  stores: Partial<Stores>
  /** 角色数据 */
  character: Partial<CharacterState>
  /** 收入配置（builder, hunter, trapper, thieves 等） */
  income: Record<string, IncomeConfig>
  /** 通用计时器残留值 */
  timers: Record<string, number>
  /** 游戏核心状态（火堆、温度、建筑等） */
  game: Partial<GameData>
  /** 游玩统计 */
  playStats: Record<string, number>
  /** 上一局数据（prestige） */
  previous: Record<string, unknown>
  /** 出征装备 */
  outfit: Record<string, number>
  /** 用户配置 */
  config: Partial<ConfigData>
  /** 延迟事件等待队列 */
  wait: Record<string, number>
  /** 按钮冷却残留值 */
  cooldown: Record<string, number>
  /** 存档版本号 */
  version: number
}

// ─── 初始状态 ────────────────────────────────────────────

export const INITIAL_STATE: GameState = {
  features: {},
  stores: {},
  character: {},
  income: {},
  timers: {},
  game: {},
  playStats: {},
  previous: {},
  outfit: {},
  config: {},
  wait: {},
  cooldown: {},
  version: 1.3,
}

// ─── 状态路径工具类型 ────────────────────────────────────

/**
 * 状态路径 —— 支持 dot notation 和 bracket notation
 * 例：'stores.wood', 'game.fire', 'features["location.room"]'
 */
export type StatePath = string

/** 顶层分类名 */
export type CategoryName =
  | 'features'
  | 'stores'
  | 'character'
  | 'income'
  | 'timers'
  | 'game'
  | 'playStats'
  | 'previous'
  | 'outfit'
  | 'config'
  | 'wait'
  | 'cooldown'
  | 'version'
