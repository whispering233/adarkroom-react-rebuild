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
}
