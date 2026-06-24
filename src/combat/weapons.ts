/**
 * Combat — 武器配置表
 *
 * 从原版 world.js:Weapons 迁移。新增武器只需在此添加一条。
 */
import type { ResourceId } from '../config'

// ─── 类型 ────────────────────────────────────────────────

export interface WeaponDef {
  /** 武器唯一标识 */
  id: string
  /** 攻击动词（i18n key） */
  verb: string
  /** 类型 */
  type: 'unarmed' | 'melee' | 'ranged'
  /** 每次攻击伤害 */
  damage: number
  /** 攻击冷却（秒） */
  cooldown: number
  /** 每击资源消耗（弹药等） */
  cost?: Partial<Record<ResourceId, number>>
}

// ─── 武器表 ──────────────────────────────────────────────

export const WEAPONS: Record<string, WeaponDef> = {
  fists: {
    id: 'fists',
    verb: 'combat.verb.punch',
    type: 'unarmed',
    damage: 1,
    cooldown: 2,
  },
  'bone spear': {
    id: 'bone spear',
    verb: 'combat.verb.throw',
    type: 'ranged',
    damage: 2,
    cooldown: 2,
    cost: { 'bone spear': 1 },
  },
  'iron sword': {
    id: 'iron sword',
    verb: 'combat.verb.swing',
    type: 'melee',
    damage: 4,
    cooldown: 2,
    cost: { 'iron sword': 1 },
  },
  'steel sword': {
    id: 'steel sword',
    verb: 'combat.verb.slash',
    type: 'melee',
    damage: 6,
    cooldown: 2,
    cost: { 'steel sword': 1 },
  },
  rifle: {
    id: 'rifle',
    verb: 'combat.verb.shoot',
    type: 'ranged',
    damage: 5,
    cooldown: 1,
    cost: { bullet: 1 },
  },
  'laser rifle': {
    id: 'laser rifle',
    verb: 'combat.verb.blast',
    type: 'ranged',
    damage: 8,
    cooldown: 1,
    cost: { 'energy cell': 1 },
  },
  grenade: {
    id: 'grenade',
    verb: 'combat.verb.lob',
    type: 'ranged',
    damage: 15,
    cooldown: 5,
    cost: { grenade: 1 },
  },
  bolas: {
    id: 'bolas',
    verb: 'combat.verb.tangle',
    type: 'ranged',
    damage: 0,
    cooldown: 15,
  },
  bayonet: {
    id: 'bayonet',
    verb: 'combat.verb.thrust',
    type: 'melee',
    damage: 8,
    cooldown: 2,
  },
  'plasma rifle': {
    id: 'plasma rifle',
    verb: 'combat.verb.disintegrate',
    type: 'ranged',
    damage: 12,
    cooldown: 1,
    cost: { 'energy cell': 1 },
  },
  'energy blade': {
    id: 'energy blade',
    verb: 'combat.verb.slice',
    type: 'melee',
    damage: 10,
    cooldown: 2,
  },
  disruptor: {
    id: 'disruptor',
    verb: 'combat.verb.stun',
    type: 'ranged',
    damage: 0,
    cooldown: 15,
  },
}
