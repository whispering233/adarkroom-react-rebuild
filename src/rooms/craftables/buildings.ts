/**
 * 建筑类制造物配置
 *
 * 每项建筑是一条纯数据记录。新增建筑只需在此文件追加，
 * Room 组件和解锁系统自动适配。
 */
import type { CraftableDef } from './types'
import { Effects } from './effects'

// ─── 建筑列表 ────────────────────────────────────────────

export const BUILDINGS: Record<string, CraftableDef> = {

  // ── 基础建筑 ──────────────────────────────────────

  trap: {
    id: 'trap',
    type: 'building',
    max: 10,
    unlock: { builderLevel: 4 },
    cost(s) {
      const n = s.game.buildings['trap'] ?? 0
      return { wood: 10 + (n * 10) }
    },
    // 陷阱本身无收入——"检查陷阱"按钮提供主动产出
  },

  cart: {
    id: 'cart',
    type: 'building',
    max: 1,
    unlock: { builderLevel: 4 },
    cost: () => ({ wood: 30 }),
    // 效果：提高伐木产量（由 Outside 组件读取）
  },

  hut: {
    id: 'hut',
    type: 'building',
    max: 20,
    unlock: { builderLevel: 4 },
    cost(s) {
      const n = s.game.buildings['hut'] ?? 0
      return { wood: 100 + (n * 50) }
    },
    // 人口通过定时器自动增长，hut 仅提供容纳上限
  },

  // ── 中级建筑 ──────────────────────────────────────

  lodge: {
    id: 'lodge',
    type: 'building',
    max: 1,
    unlock: { builderLevel: 4 },
    cost: () => ({ wood: 200, fur: 10, meat: 5 }),
    onBuild: Effects.chain(
      Effects.income('hunter', 10, { fur: 0.5, meat: 0.5 }),
      Effects.income('trapper', 10, { meat: -1, bait: 1 }),
      Effects.initWorkers('hunter', 'trapper'),
    ),
  },

  'trading post': {
    id: 'trading post',
    type: 'building',
    max: 1,
    unlock: { builderLevel: 4 },
    cost: () => ({ wood: 400, fur: 100 }),
    onBuild: Effects.unlockFeature('room.buy'),
  },

  tannery: {
    id: 'tannery',
    type: 'building',
    max: 1,
    unlock: { builderLevel: 4 },
    cost: () => ({ wood: 500, fur: 50 }),
    onBuild: Effects.chain(
      Effects.income('tanner', 10, { fur: -5, leather: 1 }),
      Effects.initWorkers('tanner'),
    ),
  },

  smokehouse: {
    id: 'smokehouse',
    type: 'building',
    max: 1,
    unlock: { builderLevel: 4 },
    cost: () => ({ wood: 600, meat: 50 }),
    onBuild: Effects.chain(
      Effects.income('charcutier', 10, { meat: -5, wood: -5, 'cured meat': 1 }),
      Effects.initWorkers('charcutier'),
    ),
  },

  // ── 高级建筑 ──────────────────────────────────────

  workshop: {
    id: 'workshop',
    type: 'building',
    max: 1,
    unlock: { builderLevel: 4 },
    cost: () => ({ wood: 800, leather: 100, scales: 10 }),
    onBuild: Effects.unlockFeature('room.craft'),
  },

  steelworks: {
    id: 'steelworks',
    type: 'building',
    max: 1,
    unlock: { builderLevel: 4 },
    cost: () => ({ wood: 1500, iron: 100, coal: 100 }),
    onBuild: Effects.chain(
      Effects.income('steelworker', 10, { iron: -1, coal: -1, steel: 1 }),
      Effects.initWorkers('steelworker'),
    ),
  },

  armoury: {
    id: 'armoury',
    type: 'building',
    max: 1,
    unlock: { builderLevel: 4 },
    cost: () => ({ wood: 3000, steel: 100, sulphur: 50 }),
    onBuild: Effects.chain(
      Effects.income('armourer', 10, { steel: -1, sulphur: -1, bullets: 1 }),
      Effects.initWorkers('armourer'),
    ),
  },

  // ── 护甲升级 ──────────────────────────────────────────

  'leather armour': {
    id: 'leather armour',
    type: 'upgrade',
    max: 1,
    unlock: { builderLevel: 4 },
    cost: () => ({ leather: 5, scales: 10 }),
    onBuild: Effects.unlockFeature('armour.leather'),
  },

  'iron armour': {
    id: 'iron armour',
    type: 'upgrade',
    max: 1,
    unlock: { builderLevel: 4, building: 'iron mine' },
    cost: () => ({ leather: 10, iron: 10, scales: 20 }),
    onBuild: Effects.unlockFeature('armour.iron'),
  },

  'steel armour': {
    id: 'steel armour',
    type: 'upgrade',
    max: 1,
    unlock: { builderLevel: 4, building: 'armoury' },
    cost: () => ({ steel: 20, leather: 10, scales: 30 }),
    onBuild: Effects.unlockFeature('armour.steel'),
  },

  // ── 水容器升级 ──────────────────────────────────────

  waterskin: {
    id: 'waterskin',
    type: 'upgrade',
    max: 1,
    unlock: { builderLevel: 4 },
    cost: () => ({ leather: 5 }),
    onBuild: Effects.unlockFeature('water.waterskin'),
  },

  cask: {
    id: 'cask',
    type: 'upgrade',
    max: 1,
    unlock: { builderLevel: 4, building: 'iron mine' },
    cost: () => ({ leather: 20, iron: 10 }),
    onBuild: Effects.unlockFeature('water.cask'),
  },

  'water tank': {
    id: 'water tank',
    type: 'upgrade',
    max: 1,
    unlock: { builderLevel: 4, building: 'steelworks' },
    cost: () => ({ iron: 50, steel: 20, leather: 20 }),
    onBuild: Effects.unlockFeature('water.tank'),
  },

  // ── 背包升级 ──────────────────────────────────────────

  rucksack: {
    id: 'rucksack',
    type: 'upgrade',
    max: 1,
    unlock: { builderLevel: 4 },
    cost: () => ({ leather: 5 }),
    onBuild: Effects.unlockFeature('bag.rucksack'),
  },

  wagon: {
    id: 'wagon',
    type: 'upgrade',
    max: 1,
    unlock: { builderLevel: 4, building: 'iron mine' },
    cost: () => ({ wood: 100, iron: 10, leather: 10 }),
    onBuild: Effects.unlockFeature('bag.wagon'),
  },

  convoy: {
    id: 'convoy',
    type: 'upgrade',
    max: 1,
    unlock: { builderLevel: 4, building: 'steelworks' },
    cost: () => ({ wood: 200, iron: 30, steel: 20, leather: 20 }),
    onBuild: Effects.unlockFeature('bag.convoy'),
  },

  // ── 武器 ──────────────────────────────────────

  'bone spear': {
    id: 'bone spear',
    type: 'weapon',
    max: 1,
    unlock: { builderLevel: 4, building: 'workshop' },
    cost: () => ({ wood: 100, leather: 5, teeth: 10 }),
    onBuild: Effects.unlockFeature('weapon.bone_spear'),
  },

  'iron sword': {
    id: 'iron sword',
    type: 'weapon',
    max: 1,
    unlock: { builderLevel: 4, building: 'workshop', minResources: { iron: 1 } },
    cost: () => ({ wood: 200, leather: 10, iron: 10, teeth: 10 }),
    onBuild: Effects.unlockFeature('weapon.iron_sword'),
  },

  'steel sword': {
    id: 'steel sword',
    type: 'weapon',
    max: 1,
    unlock: { builderLevel: 4, building: 'steelworks', minResources: { steel: 1 } },
    cost: () => ({ wood: 500, leather: 20, steel: 20, teeth: 10 }),
    onBuild: Effects.unlockFeature('weapon.steel_sword'),
  },

  rifle: {
    id: 'rifle',
    type: 'weapon',
    max: 1,
    unlock: { builderLevel: 4, building: 'armoury', minResources: { bullets: 1 } },
    cost: () => ({ wood: 200, steel: 50, sulphur: 50 }),
    onBuild: Effects.unlockFeature('weapon.rifle'),
  },

  // ── 工具 ──────────────────────────────────────

  torch: {
    id: 'torch',
    type: 'tool',
    max: 1,
    unlock: { builderLevel: 4 },
    cost: () => ({ wood: 1, cloth: 1 }),
    onBuild: Effects.unlockFeature('tool.torch'),
  },
}
