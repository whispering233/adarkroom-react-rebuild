/**
 * Combat — 战斗核心逻辑（纯函数）
 *
 * 不依赖 React，不调用 dispatch。输入 combat 状态 + 操作参数 → 输出新状态。
 * 调用方决定何时 dispatch（由 CombatOverlay 或 GameLoop combat tick 控制）。
 */

import type { CombatState } from './types'
import type { WeaponDef } from './weapons'

// ─── 玩家攻击 ────────────────────────────────────────────

export interface AttackResult {
  combat: CombatState
  /** 对敌人造成的实际伤害（0 = miss） */
  damage: number
  /** 攻击是否命中 */
  hit: boolean
}

/** 玩家使用 weapon 攻击敌人 */
export function playerAttack(
  combat: CombatState,
  weapon: WeaponDef,
  playerHasPerk?: (perk: string) => boolean,
): AttackResult {
  if (combat.enemyHp <= 0) {
    return { combat: { ...combat, won: true }, damage: 0, hit: false }
  }

  let cd = weapon.cooldown
  if (weapon.type === 'unarmed' && playerHasPerk?.('unarmed master')) {
    cd /= 2
  }

  const hit = weapon.damage > 0 // 非 bolas 类武器必中（简化，原版有命中率）
  const damage = hit ? weapon.damage : 0
  const newEnemyHp = Math.max(0, combat.enemyHp - damage)

  return {
    combat: {
      ...combat,
      enemyHp: newEnemyHp,
      won: newEnemyHp <= 0,
    },
    damage,
    hit,
  }
}

// ─── 敌人攻击 ────────────────────────────────────────────

/** 敌人攻击玩家（命中率由 enemyHit 决定） */
export function enemyAttack(combat: CombatState): AttackResult {
  if (combat.won) return { combat, damage: 0, hit: false }

  const hitRoll = Math.random()
  const hit = hitRoll <= (combat.enemyHit ?? 1)
  const damage = hit ? (combat.enemyDamage ?? 0) : 0
  const newPlayerHp = Math.max(0, combat.playerHp - damage)

  return {
    combat: {
      ...combat,
      playerHp: newPlayerHp,
    },
    damage,
    hit,
  }
}

// ─── 治疗 ────────────────────────────────────────────────

/** 治疗玩家 */
export function healPlayer(combat: CombatState, amount: number): CombatState {
  return {
    ...combat,
    playerHp: Math.min(combat.playerMaxHp, combat.playerHp + amount),
  }
}

// ─── 死亡检测 ────────────────────────────────────────────

export function isPlayerDead(combat: CombatState): boolean {
  return combat.playerHp <= 0
}

export function isEnemyDead(combat: CombatState): boolean {
  return combat.enemyHp <= 0
}
