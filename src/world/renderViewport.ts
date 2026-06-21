/**
 * World — Viewport 渲染器（纯函数）
 *
 * renderViewport() 以玩家位置为中心截取 VIEWPORT_TOTAL 范围的地图可见区域，
 * 为玩家、地标和边界墙格子计算 char/textColor/bgColor。
 *
 * 普通地形格不生成 TileDescriptor（跳过以节省 Canvas fillText 调用）。
 *
 * 本模块无 DOM/Canvas/React 依赖，纯数据变换。
 */

import type { MapTile } from './types'
import { TERRAINS, LANDMARKS, WORLD } from './constants'

// ─── 类型导出 ──────────────────────────────────────────

export interface TileDescriptor {
  vx: number
  vy: number
  char: string
  textColor: string
  bgColor: string
  isPlayer: boolean
  isLandmark: boolean
  landmarkType?: string
}

export interface ThemeColors {
  textPrimary: string
  textMuted: string
  bg: string
  cellBg: string
  accent: string
}

// ─── 常量 ──────────────────────────────────────────────

const VIEWPORT_RADIUS = WORLD.VIEWPORT_RADIUS
const VIEWPORT_TOTAL = VIEWPORT_RADIUS * 2 + 1 // 31

const BOUNDARY_CHAR = '|'

const FONT_NORMAL = '12px "Courier New", Courier, monospace'
const FONT_LANDMARK = 'bold 12px "Courier New", Courier, monospace'

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
  themeColors: ThemeColors,
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
        result.push({
          vx, vy,
          char: BOUNDARY_CHAR,
          textColor: themeColors.textMuted,
          bgColor: '',
          isPlayer: false,
          isLandmark: false,
        })
        continue
      }

      // 玩家格
      if (wx === px && wy === py) {
        result.push({
          vx, vy,
          char: '@',
          textColor: themeColors.textPrimary,
          bgColor: themeColors.cellBg,
          isPlayer: true,
          isLandmark: false,
        })
        continue
      }

      const tile = tiles[wx][wy]
      const lmType = tile.landmark

      // 地标格
      if (lmType && landmarkCharMap[lmType]) {
        result.push({
          vx, vy,
          char: landmarkCharMap[lmType],
          textColor: themeColors.accent,
          bgColor: '',
          isPlayer: false,
          isLandmark: true,
          landmarkType: lmType,
        })
        continue
      }

      // 普通地形格
      result.push({
          vx, vy,
          char: '.',
          textColor: themeColors.cellBg,
          bgColor: '',
          isPlayer: false,
          isLandmark: false
        })
    }
  }

  return result
}

// ─── Canvas 渲染函数 ──────────────────────────────────

/**
 * 将 TileDescriptor[] 渲染到 Canvas。
 * 跳过空字符（char === '' || char === ' '），不会生成 fillText(' ') 伪影。
 */
export function renderTiles(
  ctx: CanvasRenderingContext2D,
  descriptors: TileDescriptor[],
  cellSize: number,
): void {
  for (const d of descriptors) {
    if (!d.char || d.char === ' ') continue

    const x = d.vx * cellSize
    const y = d.vy * cellSize

    ctx.font = d.isLandmark ? FONT_LANDMARK : FONT_NORMAL
    ctx.fillStyle = d.textColor
    ctx.fillText(d.char, x + cellSize / 2, y + cellSize / 2)
  }
}
