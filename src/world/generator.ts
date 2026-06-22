/**
 * World — 地图生成器（纯函数）
 *
 * generateMap() 完全纯函数：输入 MapDef → 输出 { tiles, mask }。
 * 方便单元测试，不依赖浏览器/React。
 */

import type { MapTile, MapDef } from './types'
import { WORLD, LANDMARKS } from './constants'

// ─── 主入口 ───────────────────────────────────────────

export interface GenerateResult {
  tiles: MapTile[][]
  mask: boolean[][]
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

  const tiles: MapTile[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({ terrain: 'barrens' as const })),
  )

  // 1. 出生点放 village（terrain 固定为 forest）— 3×3 footprint 展开
  const villageDef = LANDMARKS.find(l => l.type === 'village')
  const fp = villageDef?.footprint ?? { w: 1, h: 1 }
  for (let dy = 0; dy < fp.h; dy++) {
    for (let dx = 0; dx < fp.w; dx++) {
      const vx = spawnPos[0] + dx
      const vy = spawnPos[1] + dy
      if (vx < size && vy < size) {
        tiles[vx][vy] = { terrain: 'forest', landmark: 'village' }
      }
    }
  }

  // 2. 螺旋向外填充地形
  fillTerrain(tiles, mapDef)

  // 3. 放置地标
  placeLandmarks(tiles, mapDef)

  // 4. 画道路
  drawRoads(tiles, mapDef)

  // 5. 生成 mask（初始仅出生点 LIGHT_RADIUS 范围可见）
  const mask = createMask(size)
  lightMap(mask, spawnPos, WORLD.LIGHT_RADIUS)

  return { tiles, mask }
}

// ─── 地形填充 ─────────────────────────────────────────

function fillTerrain(tiles: MapTile[][], mapDef: MapDef): void {
  const center = mapDef.size
  const size = tiles.length

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
        // 保留已有地标格，只更新 terrain（防止覆盖 village/city/ship 等 footprint 地标）
        if (tiles[x][y].landmark) {
          tiles[x][y].terrain = chooseTile(x, y, tiles, mapDef)
        } else {
          tiles[x][y] = { terrain: chooseTile(x, y, tiles, mapDef) }
        }
      }
    }
  }
}

/** 加权随机选择一格的地形类型（邻接粘性 STICKINESS 影响概率） */
function chooseTile(
  x: number,
  y: number,
  tiles: MapTile[][],
  mapDef: MapDef,
): 'forest' | 'field' | 'barrens' {
  const adjacent = [
    y > 0 ? tiles[x][y - 1]?.terrain : null,
    y < tiles.length - 1 ? tiles[x][y + 1]?.terrain : null,
    x < tiles.length - 1 ? tiles[x + 1][y]?.terrain : null,
    x > 0 ? tiles[x - 1][y]?.terrain : null,
  ]

  // Village 强制邻接 forest
  for (const adj of adjacent) {
    if (adj === 'forest' && tiles[x][adj === tiles[x][0]?.terrain ? y - 1 : y]?.landmark === 'village') {
      // This is overly complex — simplify: if any adjacent is village, return forest
    }
  }
  // Simplification: check if any adjacent is village
  const nearVillage = adjacent.some((_a, i) => {
    const ax = i === 2 ? x + 1 : i === 3 ? x - 1 : x
    const ay = i === 0 ? y - 1 : i === 1 ? y + 1 : y
    return ax >= 0 && ax < tiles.length && ay >= 0 && ay < tiles.length
      && tiles[ax]?.[ay]?.landmark === 'village'
  })
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

function placeLandmarks(tiles: MapTile[][], mapDef: MapDef): void {
  const center = mapDef.size
  const size = tiles.length

  for (const lm of mapDef.landmarks) {
    if (lm.type === 'village') continue // 已在中心
    const footprint = lm.footprint ?? { w: 1, h: 1 }
    for (let i = 0; i < lm.count; i++) {
      const pos = findLandmarkPos(tiles, lm.minRadius, lm.maxRadius, center, size, footprint)
      if (pos) {
        const [px, py] = pos
        for (let dy = 0; dy < footprint.h; dy++) {
          for (let dx = 0; dx < footprint.w; dx++) {
            const tx = px + dx
            const ty = py + dy
            if (tx < size && ty < size) {
              tiles[tx][ty] = {
                terrain: tiles[tx][ty].terrain,
                landmark: lm.type,
                blocked: false,
              }
            }
          }
        }
      }
    }
  }
}

/** 在给定半径范围内随机查找一块空地形格子放置地标（最多尝试 200 次）
 *  如果指定了 footprint，检查该位置的所有 footprint 格是否都可用。 */
function findLandmarkPos(
  tiles: MapTile[][],
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
        if (
          fx >= size || fy >= size ||
          tiles[fx][fy].landmark ||
          tiles[fx][fy].terrain === 'road'
        ) {
          valid = false
        }
      }
    }
    if (valid) return [x, y]
  }
  return null
}

// ─── 道路绘制 ─────────────────────────────────────────

function drawRoads(tiles: MapTile[][], mapDef: MapDef): void {
  const center = mapDef.size

  for (const lm of mapDef.landmarks) {
    if (!lm.autoRoad) continue
    // 找到该地标的第一个实例
    for (let x = 0; x < tiles.length; x++) {
      for (let y = 0; y < tiles[x].length; y++) {
        if (tiles[x][y].landmark === lm.type) {
          drawLShapedRoad(tiles, [center, center], [x, y])
          break // 只画到第一个实例
        }
      }
    }
  }
}

/** 从 from 到 to 画 L 型道路（仅覆盖纯 terrain 格，不覆盖地标） */
function drawLShapedRoad(
  tiles: MapTile[][],
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
      if (!tiles[x][from[1]].landmark) {
        tiles[x][from[1]] = { terrain: 'road' }
      }
    }
    const turnX = from[0] + xDist * xDir
    for (let j = 1; j <= yDist; j++) {
      const y = from[1] + j * yDir
      if (!tiles[turnX][y].landmark) {
        tiles[turnX][y] = { terrain: 'road' }
      }
    }
  } else {
    for (let j = 1; j <= yDist; j++) {
      const y = from[1] + j * yDir
      if (!tiles[from[0]][y].landmark) {
        tiles[from[0]][y] = { terrain: 'road' }
      }
    }
    const turnY = from[1] + yDist * yDir
    for (let i = 1; i <= xDist; i++) {
      const x = from[0] + i * xDir
      if (!tiles[x][turnY].landmark) {
        tiles[x][turnY] = { terrain: 'road' }
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
