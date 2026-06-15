/**
 * A Dark Room — 核心状态类型定义
 *
 * Immer 时代：状态全默认值初始化，draft 直接操作，无需路径解析。
 * 索引签名 [key: string] 仅用于运行时解锁的动态键（资源、建筑、工人等）。
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
  /** 按钮冷却残留值 */
  cooldown: Record<string, number>
  /** 存档版本号 */
  version: number
}

// ─── 初始状态 ────────────────────────────────────────────

export const INITIAL_STATE: GameState = {
  features: {},
  currentRoom: RoomName.Room,
  stores: {
    wood: 0,
    fur: 0,
    meat: 0,
    scales: 0,
    teeth: 0,
    iron: 0,
    coal: 0,
    steel: 0,
    sulphur: 0,
    cloth: 0,
    leather: 0,
    'cured meat': 0,
    bullets: 0,
    'energy cell': 0,
    medicine: 0,
    hypo: 0,
    stim: 0,
  },
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
  version: 1.3,
}
