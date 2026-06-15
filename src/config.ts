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
}
