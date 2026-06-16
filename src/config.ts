/**
 * GameConfig — 游戏数值统一配置
 *
 * 所有可调数值集中于此，方便调试与平衡调整。
 * 导入方式：import { CONFIG } from '../config'
 */

export const CONFIG = {
  // ── 火堆 ──────────────────────────────────────────
  /** 点火消耗木头 */
  LIGHT_FIRE_COST: { wood: 5 } as const,
  /** 添柴消耗木头 */
  STOKE_FIRE_COST: { wood: 1 } as const,
  /** 火堆冷却 / 温度调节间隔（ms） */
  FIRE_TICK_INTERVAL: 5000,

  // ── 伐木 ──────────────────────────────────────────
  /** 每次伐木获得木头数 */
  GATHER_WOOD_YIELD: 100,
  /** 伐木冷却时间（秒），原版 60 */
  GATHER_WOOD_COOLDOWN: 5,

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
  MAX_STORE: 99999999999999,
  /** 叙事日志最大条数 */
  NARRATIVE_LOG_MAX: 50,
  /** 资源日志窗口大小（tick 数，用于趋势面板和裁剪） */
  RESOURCE_LOG_MAX: 60,
}

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
  wood:      { category: 'basic',    initial: 0 },
  fur:       { category: 'basic',    initial: 0 },
  meat:      { category: 'basic',    initial: 0 },
  scales:    { category: 'basic',    initial: 0 },
  teeth:     { category: 'basic',    initial: 0 },
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

/** 从 RESOURCES 生成初始 stores 对象 */
export function getInitialStores(): Record<string, number> {
  const stores: Record<string, number> = {}
  for (const [key, def] of Object.entries(RESOURCES)) {
    stores[key] = def.initial
  }
  return stores
}
