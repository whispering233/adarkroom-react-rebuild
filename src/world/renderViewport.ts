/**
 * World — Viewport 渲染器
 *
 * renderViewport() 以玩家位置为中心截取 VIEWPORT_TOTAL 范围的地图可见区域，
 * 为每个格子计算 char/font/fillStyle 并返回 RenderCell[]。
 * 需要 DOM（getComputedStyle）来解析 CSS 变量为实际颜色值。
 *
 * @param tiles - 地图地块二维数组
 * @param playerPos - 当前玩家位置 [x, y]
 * @param mask - 可见性掩码二维数组，true=可见；不可见且未探索的格子跳过
 * @param explored - 可选，是否曾被探索过；true 且 mask=false 的格子以 muted 颜色渲染
 *
 * renderTiles() 将 RenderCell[] 渲染到 Canvas，直接使用 cell.font/cell.fillStyle，
 * 无样式查找逻辑。
 */

import type { MapTile, LandmarkDef } from './types'
import { TERRAINS, LANDMARKS, WORLD } from './constants'

// ─── 类型 ──────────────────────────────────────────────

type TileRole = 'boundary' | 'player' | 'landmark' | 'terrain'

export interface RenderCell {
  vx: number
  vy: number
  char: string
  font: string
  fillStyle: string
}

// ─── 渲染配置（内部）──────────────────────────────────

const FONT_NORMAL_VAL = '12px "Courier New", Courier, monospace'
const FONT_LANDMARK_VAL = 'bold 12px "Courier New", Courier, monospace'

const TILE_CONFIG: Record<TileRole, { font: string; fillVar: string }> = {
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
const landmarkDefMap: Record<string, LandmarkDef> = {}
for (const lm of LANDMARKS) {
  landmarkCharMap[lm.type] = lm.char
  landmarkDefMap[lm.type] = lm
}

// ─── 主函数 ────────────────────────────────────────────

export function renderViewport(
  tiles: MapTile[][],
  playerPos: [number, number],
  mask: boolean[][],
  explored?: boolean[][],
): RenderCell[] {
  const [px, py] = playerPos
  const mapSize = tiles.length
  const xStart = px - VIEWPORT_RADIUS
  const yStart = py - VIEWPORT_RADIUS

  // 一次性从 DOM 解析 CSS 变量为实际颜色值
  const gcs = getComputedStyle(document.documentElement)
  const fillStyleFor: Record<TileRole, string> = {
    boundary: gcs.getPropertyValue(TILE_CONFIG.boundary.fillVar).trim(),
    player:   gcs.getPropertyValue(TILE_CONFIG.player.fillVar).trim(),
    landmark: gcs.getPropertyValue(TILE_CONFIG.landmark.fillVar).trim(),
    terrain:  gcs.getPropertyValue(TILE_CONFIG.terrain.fillVar).trim(),
  }
  const mutedFill = fillStyleFor.boundary // --game-text-muted

  const result: RenderCell[] = []

  for (let vy = 0; vy < VIEWPORT_TOTAL; vy++) {
    for (let vx = 0; vx < VIEWPORT_TOTAL; vx++) {
      const wx = xStart + vx
      const wy = yStart + vy

      // 边界墙：超出地图范围
      if (wx < 0 || wx >= mapSize || wy < 0 || wy >= mapSize) {
        result.push({
          vx, vy,
          char: BOUNDARY_CHAR,
          font: TILE_CONFIG.boundary.font,
          fillStyle: fillStyleFor.boundary,
        })
        continue
      }

      // 玩家格
      if (wx === px && wy === py) {
        result.push({
          vx, vy,
          char: '@',
          font: TILE_CONFIG.player.font,
          fillStyle: fillStyleFor.player,
        })
        continue
      }

      const isVisible = mask[wx]?.[wy] ?? false
      const isExplored = explored?.[wx]?.[wy] ?? false
      if (!isVisible && !isExplored) continue
      const isDimmed = !isVisible && isExplored

      const tile = tiles[wx][wy]
      const lmType = tile.landmark

      // 地标格（footprint 展开已在生成阶段完成）
      if (lmType && landmarkCharMap[lmType]) {
        result.push({
          vx, vy,
          char: landmarkCharMap[lmType]!,
          font: TILE_CONFIG.landmark.font,
          fillStyle: isDimmed ? mutedFill : fillStyleFor.landmark,
        })
        continue
      }

      const terrainChar = tile.terrain === 'void' ? '' : '.'
      result.push({
        vx, vy,
        char: terrainChar,
        font: TILE_CONFIG.terrain.font,
        fillStyle: isDimmed ? mutedFill : fillStyleFor.terrain,
      })
    }
  }

  return result
}

// ─── Canvas 渲染函数 ──────────────────────────────────

/**
 * 将 RenderCell[] 渲染到 Canvas。
 * 直接使用 cell.font / cell.fillStyle / cell.char，无样式查找。
 * 跳过空字符（char === '' || char === ' '），不会生成 fillText(' ') 伪影。
 */
export function renderTiles(
  ctx: CanvasRenderingContext2D,
  cells: RenderCell[],
  cellSize: number,
): void {
  for (const cell of cells) {
    if (!cell.char || cell.char === ' ') continue
    const x = cell.vx * cellSize
    const y = cell.vy * cellSize
    ctx.font = cell.font
    ctx.fillStyle = cell.fillStyle
    ctx.fillText(cell.char, x + cellSize / 2, y + cellSize / 2)
  }
}
