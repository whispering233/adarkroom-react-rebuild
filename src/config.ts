/**
 * GameConfig — 游戏数值统一配置
 *
 * 所有可调数值集中于此，方便调试与平衡调整。
 * 导入方式：import { CONFIG } from '../config'
 */

/** 运行模式 */
export type RunMode = 'normal' | 'debug'

export const CONFIG = {
  // ── 运行模式 ────────────────────────────────────
  /** normal: 正常游戏, debug: 资源全满用于调试 */
  RUN_MODE: 'normal' as RunMode,

  // ── 叙事面板 ────────────────────────────────────
  /** 是否展示资源变化叙事块（右栏已有资源数据时可关闭） */
  SHOW_DELTA_NARRATIVE: false,

  // ── 火堆 ──────────────────────────────────────────
  /** 点火消耗木头 */
  LIGHT_FIRE_COST: { wood: 5 } as const,
  /** 添柴消耗木头 */
  STOKE_FIRE_COST: { wood: 1 } as const,
  /** 火堆冷却 / 温度调节间隔（ms） */
  FIRE_TICK_INTERVAL: 5000,

  // ── 伐木 ──────────────────────────────────────────
  /** 每次伐木获得木头数 */
  GATHER_WOOD_YIELD: 1000,
  /** 伐木冷却时间（秒），原版 60 */
  GATHER_WOOD_COOLDOWN: 5,

  // ── 陷阱 ──────────────────────────────────────────
  /** 检查陷阱冷却时间（秒） */
  TRAP_COOLDOWN: 10,

  // ── 建造者 NPC ────────────────────────────────────
  /** 建造者 NPC 推进检查间隔（ms） */
  BUILDER_TICK_INTERVAL: 5000,
  /** 陌生人赠予木头数 */
  STRANGER_GIFT_WOOD: 4,
  /** 森林解锁延迟（ms） */
  FOREST_UNLOCK_DELAY: 30000,
  /** 建造者收入配置 */
  BUILDER_INCOME: {
    delay: 10,
    stores: { wood: 2 },
    timeLeft: 10,
  },

  // ── 收入系统 ──────────────────────────────────────
  /** 收入 tick 间隔（ms） */
  INCOME_TICK_INTERVAL: 1000,

  // ── 通知 ──────────────────────────────────────────
  /** 通知消息存留时间（ms） */
  NOTIFICATION_DURATION: 4000,

  // ── 数值边界 ──────────────────────────────────────
  /** 资源上限 */
  MAX_STORE: 999999,
  /** 叙事日志最大条数 */
  NARRATIVE_LOG_MAX: 50,
  /** 资源日志窗口大小（tick 数，用于趋势面板和裁剪） */
  RESOURCE_LOG_MAX: 60,

  // ── 人口 ──────────────────────────────────────────
  /** 每间小屋容纳人数 */
  HUT_ROOM: 4,
  /** 人口增长随机间隔（秒）[min, max] */
  POP_INCREASE_INTERVAL: [30, 180] as [number, number],
}

// ─── 工人收入配置（per-worker 速率）────────────────────────

/** 工人收入定义 */
export interface WorkerIncomeDef {
  /** 收入间隔（秒） */
  delay: number
  /** per-worker 资源变化（正=产出，负=消耗） */
  stores: Record<string, number>
}

/**
 * 各职业 per-worker 收入速率。
 * gatherer 字段特殊处理：INCOME_TICK 时自动乘以剩余未分配人口。
 * 其他职业乘以对应 workers[key] 人数。
 */
export const WORKER_INCOME: Record<string, WorkerIncomeDef> = {
  gatherer:    { delay: 10, stores: { wood: 1 } },
  hunter:      { delay: 10, stores: { fur: 0.5, meat: 0.5 } },
  trapper:     { delay: 10, stores: { meat: -1, bait: 1 } },
  tanner:      { delay: 10, stores: { fur: -5, leather: 1 } },
  charcutier:  { delay: 10, stores: { meat: -5, wood: -5, 'cured meat': 1 } },
  'iron miner':    { delay: 10, stores: { 'cured meat': -1, iron: 1 } },
  'coal miner':    { delay: 10, stores: { 'cured meat': -1, coal: 1 } },
  'sulphur miner': { delay: 10, stores: { 'cured meat': -1, sulphur: 1 } },
  steelworker: { delay: 10, stores: { iron: -1, coal: -1, steel: 1 } },
  armourer:    { delay: 10, stores: { steel: -1, sulphur: -1, bullets: 1 } },
}

// ─── 建筑 → 工人职业映射 ──────────────────────────────────

/**
 * 建造对应建筑后自动解锁的工人职业。
 * 键为建筑 ID，值为自动初始化的工人职业列表（初始值 0）。
 */
export const BUILDING_WORKERS: Record<string, string[]> = {
  lodge:      ['hunter', 'trapper'],
  tannery:    ['tanner'],
  smokehouse: ['charcutier'],
  steelworks: ['steelworker'],
  armoury:    ['armourer'],
}

// ─── 陷阱掉落表 ──────────────────────────────────────────

/** 陷阱掉落条目 */
export interface TrapDropDef {
  /** 累积概率（与上一档的差值 = 实际命中率） */
  rollUnder: number
  /** 资源名 */
  name: string
  /** i18n 消息键（NarrativePanel 显示用） */
  messageKey: string
}

/**
 * 检查陷阱掉落表（累积概率，由低到高排列）。
 * 每次检查：roll = Math.random()，命中第一个 roll < drop.rollUnder 的条目。
 */
export const TRAP_DROPS: TrapDropDef[] = [
  { rollUnder: 0.5,  name: 'fur',    messageKey: 'outside.trap_fur' },
  { rollUnder: 0.75, name: 'meat',   messageKey: 'outside.trap_meat' },
  { rollUnder: 0.85, name: 'scales', messageKey: 'outside.trap_scales' },
  { rollUnder: 0.93, name: 'teeth',  messageKey: 'outside.trap_teeth' },
  { rollUnder: 0.995,name: 'cloth',  messageKey: 'outside.trap_cloth' },
  { rollUnder: 1.0,  name: 'charm',  messageKey: 'outside.trap_charm' },
]

// ─── 资源元数据注册表 ──────────────────────────────────────

/** 资源分类 */
export type ResourceCategory = 'basic' | 'minerals' | 'crafted' | 'advanced'

/** 资源条目元数据 */
interface ResourceDef {
  category: ResourceCategory
  initial: number
}

/**
 * 所有已知资源集中注册于此。
 * 新增资源只需加一行，类型 + 初始值 + UI 分类自动生效。
 */
export const RESOURCES: Record<string, ResourceDef> = {
  // ── 基础物资 ──
  wood:      { category: 'basic',    initial: 10000 },
  fur:       { category: 'basic',    initial: 0 },
  meat:      { category: 'basic',    initial: 0 },
  scales:    { category: 'basic',    initial: 0 },
  teeth:     { category: 'basic',    initial: 0 },
  bait:      { category: 'basic',    initial: 0 },
  // ── 矿物 ──
  iron:      { category: 'minerals', initial: 0 },
  coal:      { category: 'minerals', initial: 0 },
  steel:     { category: 'minerals', initial: 0 },
  sulphur:   { category: 'minerals', initial: 0 },
  // ── 制品 ──
  cloth:     { category: 'crafted',  initial: 0 },
  leather:   { category: 'crafted',  initial: 0 },
  'cured meat': { category: 'crafted', initial: 0 },
  bullets:   { category: 'crafted',  initial: 0 },
  // ── 高级物资 ──
  'energy cell': { category: 'advanced', initial: 0 },
  medicine:  { category: 'advanced', initial: 0 },
  hypo:      { category: 'advanced', initial: 0 },
  stim:      { category: 'advanced', initial: 0 },
  'alien alloy': { category: 'advanced', initial: 0 },
}

/** 已知资源 ID 联合类型 */
export type ResourceId = keyof typeof RESOURCES

/** 根据 RESOURCES 自动生成 StoresPanel 分类数组 */
export function getResourceCategories(): { labelKey: string; keys: string[] }[] {
  const map: Record<string, string[]> = {}
  for (const [key, def] of Object.entries(RESOURCES)) {
    (map[def.category] ??= []).push(key)
  }
  return [
    { labelKey: 'stores.cat_basic',    keys: map['basic']    ?? [] },
    { labelKey: 'stores.cat_minerals', keys: map['minerals'] ?? [] },
    { labelKey: 'stores.cat_crafted',  keys: map['crafted']  ?? [] },
    { labelKey: 'stores.cat_advanced', keys: map['advanced'] ?? [] },
  ]
}

/** 从 RESOURCES 生成初始 stores 对象，debug 模式下全资源满上限 */
export function getInitialStores(): Record<string, number> {
  const stores: Record<string, number> = {}
  for (const [key, def] of Object.entries(RESOURCES)) {
    stores[key] = CONFIG.RUN_MODE === 'debug' ? CONFIG.MAX_STORE : def.initial
  }
  return stores
}

// ─── 背包装备系统 ──────────────────────────────────────

/** 物品重量表（未列出的默认重量 = 1） */
export const ITEM_WEIGHT: Record<string, number> = {
  'bone spear': 2,
  'iron sword': 3,
  'steel sword': 5,
  rifle: 5,
  'laser rifle': 5,
  bullets: 0.1,
  'energy cell': 0.2,
  bolas: 0.5,
}

/** 背包升级容量加成 */
export const BAG_UPGRADES: Record<string, number> = {
  rucksack: 10,
  wagon: 30,
  convoy: 60,
  'cargo drone': 100,
}

/** 回村时保留在背包的物品 ID */
export const KEEP_ON_RETURN: string[] = [
  'cured meat', 'bullets', 'energy cell', 'charm',
  'medicine', 'stim', 'hypo',
]

/**
 * 判断物品是否应在回村时保留。
 * 武器（在 ITEM_WEIGHT 中有定义的）也自动保留。
 */
export function shouldKeepOnReturn(itemId: string): boolean {
  return KEEP_ON_RETURN.includes(itemId) || itemId in ITEM_WEIGHT
}
