/**
 * World — Viewport 渲染器（纯函数）
 *
 * renderViewport() 以玩家位置为中心截取 VIEWPORT_TOTAL 范围的地图可见区域，
 * 为边界墙(|)、玩家(@)、地标(字符)和普通地形格(.)计算 char 与 role。
 *
 * renderTiles() 将 TileDescriptor[] 渲染到 Canvas，从 TILE_CONFIG 查找
 * CSS 变量来设置 font/fillStyle，无外部颜色依赖。
 *
 * 本模块无 DOM/Canvas/React 依赖（renderTiles 需要运行时 DOM，调用方确保即可）。
 */

import type { MapTile } from './types'
import { TERRAINS, LANDMARKS, WORLD } from './constants'

// ─── 类型导 ──────────────────────────────────────────

export type TileRole = 'boundary' | 'player' | 'landmark' | 'terrain'

export interface TileDescriptor {
  vx: number
  vy: number
  char: string
  role: TileRole
}

// ─── 渲染配置 ──────────────────────────────────────────

const FONT_NORMAL_VAL = '12px "Courier New", Courier, monospace'
const FONT_LANDMARK_VAL = 'bold 12px "Courier New", Courier, monospace'

export const FONT_NORMAL = FONT_NORMAL_VAL
export const FONT_LANDMARK = FONT_LANDMARK_VAL

export const TILE_CONFIG: Record<TileRole, { font: string; fillVar: string }> = {
  boundary: { font: FONT_NORMAL_VAL, fillVar: '--game-text-muted' },
  player:   { font: FONT_NORMAL_VAL, fillVar: '--game-text-primary' },
  landmark: { font: FONT_LANDMARK_VAL, fillVar: '--game-accent' },
  terrain:  { font: FONT_NORMAL_VAL, fillVar: '--game-terrain' },
}

// ─── 常量 ──────────────────────────────────────────────

const VIEWPORT_RADIUS = WORLD.VIEWPORT_RADIUS
const VIEWPORT_TOTAL = VIEWPORT_RADIUS * 2 + 1 // 31

const BOUNDARY_CHAR = '|'

// ─── 查找表（一次构建，多次复用）────────────────────────

const terrainCharMap: Record<string, string> = {}
for (const t of TERRAINS) {
  terrainCharMap[t.type] = t.char
}

const landmarkCharMap: Record<string, string> = {}
for (const lm of LANDMARKS) {
  landmarkCharMap[lm.type] = lm.char
}

// ─── 主函数 ────────────────────────────────────────────

export function renderViewport(
  tiles: MapTile[][],
  playerPos: [number, number],
): TileDescriptor[] {
  const [px, py] = playerPos
  const mapSize = tiles.length
  const xStart = px - VIEWPORT_RADIUS
  const yStart = py - VIEWPORT_RADIUS

  const result: TileDescriptor[] = []

  for (let vy = 0; vy < VIEWPORT_TOTAL; vy++) {
    for (let vx = 0; vx < VIEWPORT_TOTAL; vx++) {
      const wx = xStart + vx
      const wy = yStart + vy

      // 边界墙：超出地图范围
      if (wx < 0 || wx >= mapSize || wy < 0 || wy >= mapSize) {
        result.push({ vx, vy, char: BOUNDARY_CHAR, role: 'boundary' })
        continue
      }

      // 玩家格
      if (wx === px && wy === py) {
        result.push({ vx, vy, char: '@', role: 'player' })
        continue
      }

      const tile = tiles[wx][wy]
      const lmType = tile.landmark

      // 地标格
      if (lmType && landmarkCharMap[lmType]) {
        result.push({ vx, vy, char: landmarkCharMap[lmType], role: 'landmark' })
        continue
      }

      // 普通地形格
      result.push({ vx, vy, char: '.', role: 'terrain' })
    }
  }

  return result
}

// ─── Canvas 渲染函数 ──────────────────────────────────

/**
 * 将 TileDescriptor[] 渲染到 Canvas。
 * 从 TILE_CONFIG 根据 role 查找 font/fillStyle（CSS 变量）。
 * 跳过空字符（char === '' || char === ' '），不会生成 fillText(' ') 伪影。
 */
export function renderTiles(
  ctx: CanvasRenderingContext2D,
  descriptors: TileDescriptor[],
  cellSize: number,
): void {
  const gcs = getComputedStyle(document.documentElement)
  for (const d of descriptors) {
    if (!d.char || d.char === ' ') continue
    const cfg = TILE_CONFIG[d.role]
    const x = d.vx * cellSize
    const y = d.vy * cellSize
    ctx.font = cfg.font
    ctx.fillStyle = gcs.getPropertyValue(cfg.fillVar).trim()
    ctx.fillText(d.char, x + cellSize / 2, y + cellSize / 2)
  }
}
