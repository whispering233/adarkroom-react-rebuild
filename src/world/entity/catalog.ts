/**
 * World — EntityCatalog 实体注册中心
 *
 * 管理所有 WorldEntity 实例的注册与查询。
 * 初始化时注册 15 个地标实体（10 个正式 + 5 个占位）。
 *
 * 设计要点：
 *   - registerEntity 是幂等的 — 同一 type 第二次注册不会覆盖第一次
 *   - 初始化注册在模块加载时执行，后续 import catalog 即可使用
 *   - 此文件不导入 React 或 DOM
 */

import type { WorldEntity, EntityCatalog } from './types'
// 15 个已实现的正式实体
import { villageEntity } from './village'
import { ironMineEntity } from './ironMine'
import { coalMineEntity } from './coalMine'
import { sulphurMineEntity } from './sulphurMine'
import { houseEntity } from './house'
import { caveEntity } from './cave'
import { townEntity } from './town'
import { cityEntity } from './city'
import { outpostEntity } from './outpost'
import { shipEntity } from './ship'
import { boreholeEntity } from './borehole'
import { battlefieldEntity } from './battlefield'
import { swampEntity } from './swamp'
import { cacheEntity } from './cache'
import { executionerEntity } from './executioner'

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

// ─── 注册正式实体 ────────────────────────────────────
// 按类型注册已实现的实体。registerEntity 是幂等的，不会覆盖已有条目。

registerEntity(villageEntity)
registerEntity(ironMineEntity)
registerEntity(coalMineEntity)
registerEntity(sulphurMineEntity)
registerEntity(houseEntity)
registerEntity(caveEntity)
registerEntity(townEntity)
registerEntity(cityEntity)
registerEntity(outpostEntity)
registerEntity(shipEntity)
registerEntity(boreholeEntity)
registerEntity(battlefieldEntity)
registerEntity(swampEntity)
registerEntity(cacheEntity)
registerEntity(executionerEntity)
