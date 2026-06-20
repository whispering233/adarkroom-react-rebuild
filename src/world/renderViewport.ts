/**
 * World — Viewport 渲染器（纯函数）
 *
 * renderViewport() 以玩家位置为中心截取 viewportSize 范围的地图可见区域，
 * 为每个格子计算 char/textColor/bgColor，供 Canvas 绘制层消费。
 *
 * 本模块无 DOM/Canvas/React 依赖，纯数据变换。
 */

import type { MapTile } from './types'
import { TERRAINS, LANDMARKS } from './constants'

// ─── 类型导出 ──────────────────────────────────────────

export interface TileDescriptor {
  worldX: number
  worldY: number
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
  mask: boolean[][],
  playerPos: [number, number],
  mapSize: number,
  viewportSize: number,
  themeColors: ThemeColors,
): TileDescriptor[] {
  const [px, py] = playerPos

  // 计算可见范围（以玩家为中心，viewportSize 为半宽/半高），边界钳制在 [0, mapSize-1]
  const xStart = Math.max(0, px - viewportSize)
  const xEnd = Math.min(mapSize - 1, px + viewportSize)
  const yStart = Math.max(0, py - viewportSize)
  const yEnd = Math.min(mapSize - 1, py + viewportSize)

  const result: TileDescriptor[] = []

  for (let wy = yStart; wy <= yEnd; wy++) {
    for (let wx = xStart; wx <= xEnd; wx++) {
      const isPlayer = wx === px && wy === py
      const isMasked = !mask[wx][wy]

      // 1. 被迷雾遮挡的格子
      if (isMasked) {
        result.push({
          worldX: wx,
          worldY: wy,
          char: ' ',
          textColor: themeColors.textMuted,
          bgColor: themeColors.bg,
          isPlayer: false,
          isLandmark: false,
        })
        continue
      }

      // 2. 玩家所在格（优先于地标/地形显示）
      if (isPlayer) {
        result.push({
          worldX: wx,
          worldY: wy,
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

      // 3. 地标格
      if (lmType && landmarkCharMap[lmType]) {
        result.push({
          worldX: wx,
          worldY: wy,
          char: landmarkCharMap[lmType],
          textColor: themeColors.accent,
          bgColor: '',
          isPlayer: false,
          isLandmark: true,
          landmarkType: lmType,
        })
        continue
      }

      // 4. 普通地形格
      result.push({
        worldX: wx,
        worldY: wy,
        char: terrainCharMap[tile.terrain] ?? '?',
        textColor: themeColors.textMuted,
        bgColor: '',
        isPlayer: false,
        isLandmark: false,
      })
    }
  }

  return result
}
