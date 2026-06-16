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
    onBuild: Effects.income('trapper', 10, { fur: 1, meat: 1 }),
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
    onBuild(draft) {
      draft.game.population += 1
    },
  },

  // ── 中级建筑 ──────────────────────────────────────

  lodge: {
    id: 'lodge',
    type: 'building',
    max: 1,
    unlock: { builderLevel: 4 },
    cost: () => ({ wood: 200, fur: 10, meat: 5 }),
    onBuild: Effects.income('hunter', 10, { fur: 2, meat: 3 }),
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
    onBuild: Effects.income('tanner', 10, { leather: 1 }),
  },

  smokehouse: {
    id: 'smokehouse',
    type: 'building',
    max: 1,
    unlock: { builderLevel: 4 },
    cost: () => ({ wood: 600, meat: 50 }),
    onBuild: Effects.income('smoker', 10, { 'cured meat': 1 }),
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
    onBuild: Effects.income('steelworker', 10, { steel: 1 }),
  },

  armoury: {
    id: 'armoury',
    type: 'building',
    max: 1,
    unlock: { builderLevel: 4 },
    cost: () => ({ wood: 3000, steel: 100, sulphur: 50 }),
    onBuild: Effects.income('armourer', 10, { bullets: 1 }),
  },
}
