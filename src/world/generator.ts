/**
 * World — 地图生成器（纯函数）
 *
 * generateMap() 完全纯函数：输入 MapDef → 输出 { worldMap, mask, explored, traveled }。
 * 方便单元测试，不依赖浏览器/React。
 *
 * 输出数据结构（v2）：
 *   - worldMap.terrainMap  — TerrainType[][] 地形层（无实体信息）
 *   - worldMap.entityLayer — PlacedEntity[] 实体层
 *   - worldMap.entityCellMap — Map<string, PlacedCell> 实体格查找表
 */

import { WORLD, LANDMARKS } from './constants'
import type { MapDef, WorldMap, PlacedEntity, TerrainType } from './types'
import { buildEntityCellMap } from './entity/types'
import type { EntityCatalog } from './entity/types'
import { getAllEntities } from './entity/catalog'

// ─── 主入口 ───────────────────────────────────────────

export interface GenerateResult {
  worldMap: WorldMap
  mask: boolean[][]
  explored: boolean[][]
  traveled: boolean[][]
}

export function generateMap(mapDef: MapDef): GenerateResult {
  const size = mapDef.size * 2 + 1

  // 解析出生点坐标（默认地图中心），然后钳制到有效范围
  let spawnPosX = mapDef.spawnPos?.[0] ?? mapDef.size
  let spawnPosY = mapDef.spawnPos?.[1] ?? mapDef.size
  if (spawnPosX >= size) spawnPosX = size - 1
  if (spawnPosX < 0) spawnPosX = 0
  if (spawnPosY >= size) spawnPosY = size - 1
  if (spawnPosY < 0) spawnPosY = 0
  const spawnPos: [number, number] = [spawnPosX, spawnPosY]

  // 地形层：初始全 barrens
  const terrainMap: TerrainType[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => 'barrens' as const),
  )

  // 实体层：空
  const entityLayer: PlacedEntity[] = []

  // 1. 出生点放 village（terrain 固定为 forest）— 3×3 footprint 展开
  const villageDef = LANDMARKS.find(l => l.type === 'village')
  const vfp = villageDef?.footprint ?? { w: 1, h: 1 }
  for (let dy = 0; dy < vfp.h; dy++) {
    for (let dx = 0; dx < vfp.w; dx++) {
      const vx = spawnPos[0] + dx
      const vy = spawnPos[1] + dy
      if (vx < size && vy < size) {
        terrainMap[vx][vy] = 'forest'
      }
    }
  }
  entityLayer.push({
    entityId: 'village',
    anchorX: spawnPos[0],
    anchorY: spawnPos[1],
  })

  // 2. 螺旋向外填充地形
  fillTerrain(terrainMap, mapDef, entityLayer)

  // 3. 放置地标（只写 entityLayer，不写 terrainMap）
  placeLandmarks(entityLayer, terrainMap, mapDef)

  // 4. 画道路（只修改 terrainMap，不碰 entityLayer）
  drawRoads(terrainMap, entityLayer, mapDef)

  // 5. 生成 mask（初始仅出生点 LIGHT_RADIUS 范围可见）
  const mask = createMask(size)
  lightMap(mask, spawnPos, WORLD.LIGHT_RADIUS)

  // 6. 生成 traveled 网格（初始全 false，出生点标记为已踩踏）
  const traveled = createMask(size)
  traveled[spawnPos[0]][spawnPos[1]] = true

  // 7. 生成 explored 网格（初始全 false）
  const explored = createMask(size)

  // 8. 构建 entityCellMap
  const entityCatalog: EntityCatalog = {}
  for (const e of getAllEntities()) {
    entityCatalog[e.type] = e
  }
  const entityCellMap = buildEntityCellMap(entityLayer, entityCatalog)

  return {
    worldMap: { size, terrainMap, entityLayer, entityCellMap },
    mask,
    explored,
    traveled,
  }
}

// ─── 地形填充 ─────────────────────────────────────────

function fillTerrain(terrainMap: TerrainType[][], mapDef: MapDef, entityLayer: PlacedEntity[]): void {
  const center = mapDef.size
  const size = terrainMap.length

  for (let r = 1; r <= mapDef.size; r++) {
    for (let t = 0; t < r * 8; t++) {
      let x: number, y: number
      if (t < 2 * r) {
        x = center - r + t
        y = center - r
      } else if (t < 4 * r) {
        x = center + r
        y = center - 3 * r + t
      } else if (t < 6 * r) {
        x = center + 5 * r - t
        y = center + r
      } else {
        x = center - r
        y = center + 7 * r - t
      }

      if (x >= 0 && x < size && y >= 0 && y < size) {
        terrainMap[x][y] = chooseTile(x, y, terrainMap, mapDef, entityLayer)
      }
    }
  }
}

/** 加权随机选择一格的地形类型（邻接粘性 STICKINESS 影响概率） */
function chooseTile(
  x: number,
  y: number,
  terrainMap: TerrainType[][],
  mapDef: MapDef,
  entityLayer: PlacedEntity[],
): TerrainType {
  const adjacent = [
    y > 0 ? terrainMap[x][y - 1] : null,
    y < terrainMap.length - 1 ? terrainMap[x][y + 1] : null,
    x < terrainMap.length - 1 ? terrainMap[x + 1][y] : null,
    x > 0 ? terrainMap[x - 1][y] : null,
  ]

  // Village 邻接强制 forest
  const nearVillage = (() => {
    const villageEntity = entityLayer.find(e => e.entityId === 'village')
    if (!villageEntity) return false
    const villageDef = LANDMARKS.find(l => l.type === 'village')
    const vfp = villageDef?.footprint ?? { w: 1, h: 1 }
    return adjacent.some((_a, i) => {
      const ax = i === 2 ? x + 1 : i === 3 ? x - 1 : x
      const ay = i === 0 ? y - 1 : i === 1 ? y + 1 : y
      return (
        ax >= villageEntity.anchorX &&
        ax < villageEntity.anchorX + vfp.w &&
        ay >= villageEntity.anchorY &&
        ay < villageEntity.anchorY + vfp.h
      )
    })
  })()
  if (nearVillage) return 'forest'

  const chances: Record<string, number> = {}
  let nonSticky = 1

  for (const adj of adjacent) {
    if (adj && adj !== 'road') {
      chances[adj] = (chances[adj] ?? 0) + WORLD.STICKINESS
      nonSticky -= WORLD.STICKINESS
    }
  }

  for (const td of mapDef.terrainTypes.filter(t => t.weight > 0)) {
    chances[td.type] = (chances[td.type] ?? 0) + td.weight * Math.max(0, nonSticky)
  }

  // 归一化 → 随机选择
  const sorted = Object.entries(chances).sort((a, b) => b[1] - a[1])
  let cumulative = 0
  const roll = Math.random()
  for (const [type, prob] of sorted) {
    cumulative += prob
    if (roll < cumulative) return type as 'forest' | 'field' | 'barrens'
  }
  return 'barrens'
}

// ─── 地标放置 ─────────────────────────────────────────

function placeLandmarks(
  entityLayer: PlacedEntity[],
  terrainMap: TerrainType[][],
  mapDef: MapDef,
): void {
  const center = mapDef.size
  const size = terrainMap.length

  for (const lm of mapDef.landmarks) {
    if (lm.type === 'village') continue // 已在中心
    const footprint = lm.footprint ?? { w: 1, h: 1 }
    for (let i = 0; i < lm.count; i++) {
      const pos = findLandmarkPos(entityLayer, terrainMap, lm.minRadius, lm.maxRadius, center, size, footprint)
      if (pos) {
        entityLayer.push({
          entityId: lm.type,
          anchorX: pos[0],
          anchorY: pos[1],
        })
      }
    }
  }
}

/** 在给定半径范围内随机查找一块空地放置地标（最多尝试 200 次）。
 *  通过检查 entityLayer 判断位置是否被已有实体占据，同时避免 road 格。 */
function findLandmarkPos(
  entityLayer: PlacedEntity[],
  terrainMap: TerrainType[][],
  minR: number,
  maxR: number,
  center: number,
  size: number,
  footprint?: { w: number; h: number },
): [number, number] | null {
  const fp = footprint ?? { w: 1, h: 1 }
  for (let attempt = 0; attempt < 200; attempt++) {
    const r = minR + Math.floor(Math.random() * (maxR - minR + 1))
    const xDist = Math.floor(Math.random() * (r + 1))
    const yDist = r - xDist
    const x = center + (Math.random() < 0.5 ? xDist : -xDist)
    const y = center + (Math.random() < 0.5 ? yDist : -yDist)
    if (!(x >= 0 && x < size && y >= 0 && y < size)) continue
    // 检查所有 footprint 格
    let valid = true
    for (let dy = 0; dy < fp.h && valid; dy++) {
      for (let dx = 0; dx < fp.w && valid; dx++) {
        const fx = x + dx
        const fy = y + dy
        if (fx >= size || fy >= size) {
          valid = false
          continue
        }
        // 检查是否与已有实体重叠
        if (isCellOccupiedByEntity(fx, fy, entityLayer)) {
          valid = false
          continue
        }
        // 检查是否被 road 占据
        if (terrainMap[fx][fy] === 'road') {
          valid = false
        }
      }
    }
    if (valid) return [x, y]
  }
  return null
}

/** 判断网格坐标 (fx, fy) 是否被 entityLayer 中任何实体的 footprint 覆盖 */
function isCellOccupiedByEntity(
  fx: number,
  fy: number,
  entityLayer: PlacedEntity[],
): boolean {
  return entityLayer.some(e => {
    const def = LANDMARKS.find(l => l.type === e.entityId)
    const fp = def?.footprint ?? { w: 1, h: 1 }
    return (
      fx >= e.anchorX &&
      fx < e.anchorX + fp.w &&
      fy >= e.anchorY &&
      fy < e.anchorY + fp.h
    )
  })
}

// ─── 道路绘制 ─────────────────────────────────────────

function drawRoads(terrainMap: TerrainType[][], entityLayer: PlacedEntity[], mapDef: MapDef): void {
  const center = mapDef.size

  for (const lm of mapDef.landmarks) {
    if (!lm.autoRoad) continue
    // 找到该地标在 entityLayer 中的第一个实例
    const placed = entityLayer.find(e => e.entityId === lm.type)
    if (placed) {
      drawLShapedRoad(terrainMap, entityLayer, [center, center], [placed.anchorX, placed.anchorY])
    }
  }
}

/** 从 from 到 to 画 L 型道路（跳过被实体占据的格，不碰 entityLayer） */
function drawLShapedRoad(
  terrainMap: TerrainType[][],
  entityLayer: PlacedEntity[],
  from: [number, number],
  to: [number, number],
): void {
  const xDir = to[0] > from[0] ? 1 : -1
  const yDir = to[1] > from[1] ? 1 : -1
  const xDist = Math.abs(to[0] - from[0])
  const yDist = Math.abs(to[1] - from[1])

  // 优先走较长的轴（减少转弯）
  if (xDist > yDist) {
    for (let i = 1; i <= xDist; i++) {
      const x = from[0] + i * xDir
      if (!isCellOccupiedByEntity(x, from[1], entityLayer)) {
        terrainMap[x][from[1]] = 'road'
      }
    }
    const turnX = from[0] + xDist * xDir
    for (let j = 1; j <= yDist; j++) {
      const y = from[1] + j * yDir
      if (!isCellOccupiedByEntity(turnX, y, entityLayer)) {
        terrainMap[turnX][y] = 'road'
      }
    }
  } else {
    for (let j = 1; j <= yDist; j++) {
      const y = from[1] + j * yDir
      if (!isCellOccupiedByEntity(from[0], y, entityLayer)) {
        terrainMap[from[0]][y] = 'road'
      }
    }
    const turnY = from[1] + yDist * yDir
    for (let i = 1; i <= xDist; i++) {
      const x = from[0] + i * xDir
      if (!isCellOccupiedByEntity(x, turnY, entityLayer)) {
        terrainMap[x][turnY] = 'road'
      }
    }
  }
}

/** 检查 (x, y) 是否位于 village 的 footprint 内 */
function isVillageCell(x: number, y: number, villageAnchor: [number, number]): boolean {
  const villageDef = LANDMARKS.find(l => l.type === 'village')
  const fp = villageDef?.footprint ?? { w: 1, h: 1 }
  return (
    x >= villageAnchor[0] &&
    x < villageAnchor[0] + fp.w &&
    y >= villageAnchor[1] &&
    y < villageAnchor[1] + fp.h
  )
}

/**
 * 从 startPos 螺旋向外搜索最近的 road 或 village 格，
 * 绘制一条 L 型道路连接两者。
 * 用于前哨清除后自动修路。
 */
export function drawRoadToVillage(
  terrainMap: TerrainType[][],
  startPos: [number, number],
  villagePos: [number, number],
  entityLayer: PlacedEntity[],
): void {
  const size = terrainMap.length
  const maxRadius = Math.max(startPos[0], startPos[1], size - startPos[0], size - startPos[1])

  for (let r = 1; r <= maxRadius; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue

        const x = startPos[0] + dx
        const y = startPos[1] + dy
        if (x < 0 || x >= size || y < 0 || y >= size) continue

        if (terrainMap[x][y] === 'road' || isVillageCell(x, y, villagePos)) {
          drawLShapedRoad(terrainMap, entityLayer, startPos, [x, y])
          return
        }
      }
    }
  }
}

// ─── Mask 操作 ────────────────────────────────────────

export function createMask(size: number): boolean[][] {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => false))
}

/** 以 pos 为圆心、radius 范围内揭露 mask */
export function lightMap(
  mask: boolean[][],
  pos: [number, number],
  radius: number,
): void {
  mask[pos[0]][pos[1]] = true
  const size = mask.length
  for (let i = -radius; i <= radius; i++) {
    const remaining = radius - Math.abs(i)
    for (let j = -remaining; j <= remaining; j++) {
      const nx = pos[0] + i
      const ny = pos[1] + j
      if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
        mask[nx][ny] = true
      }
    }
  }
}

/** 创建新 mask 并以 center 为中心揭露初始视野 */
export function createNewMask(size: number, center: [number, number]): boolean[][] {
  const mask = createMask(size)
  lightMap(mask, center, WORLD.LIGHT_RADIUS)
  return mask
}
