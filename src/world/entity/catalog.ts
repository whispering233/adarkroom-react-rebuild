/**
 * World — EntityCatalog 实体注册中心
 *
 * 管理所有 WorldEntity 实例的注册与查询。
 * 初始化时注册 15 个地标实体的占位版本（正式实现在 Wave 2）。
 *
 * 设计要点：
 *   - registerEntity 是幂等的 — 同一 type 第二次注册不会覆盖第一次
 *   - 初始化注册在模块加载时执行，后续 import catalog 即可使用
 *   - 此文件不导入 React 或 DOM
 */

import type { WorldEntity, EntityCatalog } from './types'

// ─── 内部状态 ─────────────────────────────────────────

const catalog: EntityCatalog = {}

// ─── API ──────────────────────────────────────────────

/**
 * 注册一个实体到目录。幂等：同一 type 的重复注册不覆盖已有条目。
 */
export function registerEntity(entity: WorldEntity): void {
  if (catalog[entity.type]) return // 幂等：已存在则跳过
  catalog[entity.type] = entity
}

/**
 * 按 type 获取实体。未注册返回 undefined。
 */
export function getEntity(type: string): WorldEntity | undefined {
  return catalog[type]
}

/**
 * 获取所有已注册实体。
 */
export function getAllEntities(): WorldEntity[] {
  return Object.values(catalog)
}

// ─── 辅助：创建占位实体 ──────────────────────────────

function placeholder(type: string, w: number, h: number): WorldEntity {
  return {
    type,
    footprint: { w, h },
    getDrawCommand: () => ({
      bounds: { vx: 0, vy: 0, vw: w, vh: h },
      cells: [],
    }),
  }
}

// ─── 初始化注册 15 个占位实体 ─────────────────────────
// 实体实现在 Wave 2 中替换正式版本。
// footprint 值必须与 constants.ts 中 LANDMARKS 定义一致。

const PLACEHOLDER_ENTITIES: Array<{ type: string; w: number; h: number }> = [
  // 3×3 多格
  { type: 'village',    w: 3, h: 3 },
  // 2×2 多格
  { type: 'city',       w: 2, h: 2 },
  { type: 'ship',       w: 2, h: 2 },
  // 1×1 单格
  { type: 'ironMine',   w: 1, h: 1 },
  { type: 'coalMine',   w: 1, h: 1 },
  { type: 'sulphurMine',w: 1, h: 1 },
  { type: 'house',      w: 1, h: 1 },
  { type: 'cave',       w: 1, h: 1 },
  { type: 'town',       w: 1, h: 1 },
  { type: 'outpost',    w: 1, h: 1 },
  { type: 'borehole',   w: 1, h: 1 },
  { type: 'battlefield',w: 1, h: 1 },
  { type: 'swamp',      w: 1, h: 1 },
  { type: 'cache',      w: 1, h: 1 },
  { type: 'executioner',w: 1, h: 1 },
]

for (const p of PLACEHOLDER_ENTITIES) {
  catalog[p.type] = placeholder(p.type, p.w, p.h)
}
