/**
 * Combat — 战斗系统类型定义
 *
 * 战斗系统与事件系统分离：事件只声明「打谁」，战斗系统管理「怎么打」。
 * Phase 1 定义最小骨架供 state 引用，后续 Phase 6 扩展完整战斗逻辑。
 */

// ─── 战斗状态（存储于 GameState.combat） ──────────────────

export interface CombatState {
  /** 是否处于战斗状态 */
  active: boolean
  /** 敌人标识 */
  enemyId: string
  /** 敌人当前血量 */
  enemyHp: number
  /** 敌人最大血量 */
  enemyMaxHp: number
  /** 玩家当前血量 */
  playerHp: number
  /** 玩家最大血量 */
  playerMaxHp: number
  /** 是否已获胜 */
  won?: boolean
  /** 敌人攻击间隔（秒） */
  attackDelay?: number
  /** 敌人伤害 */
  enemyDamage?: number
  /** 敌人命中率 0~1 */
  enemyHit?: number
  /** 是否被眩晕（跳过下一次攻击） */
  enemyStunned?: boolean
}

/** CombatState 初始值 */
export const INITIAL_COMBAT_STATE: CombatState = {
  active: false,
  enemyId: '',
  enemyHp: 0,
  enemyMaxHp: 0,
  playerHp: 100,
  playerMaxHp: 100,
}
