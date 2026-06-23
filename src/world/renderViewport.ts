/**
 * World — Viewport 纯函数渲染器
 *
 * renderViewport() 以玩家位置为中心截取 VIEWPORT_TOTAL 范围的地图可见区域，
 * 将实体层（entityLayer）、地形层（terrainMap）、边界墙、玩家位置分别归类。
 * 纯函数 —— 零 DOM 访问，所有样式通过 StyleResolver 注入。
 *
 * drawComposed() 将 renderViewport 的分组结果批量绘制到 Canvas，
 * 按 (font, fillStyle) 分组减少 ctx state 切换。
 */

import type {
  TerrainType,
  PlacedEntity,
  EntityCellOutput,
} from './types'
import type { EntityCatalog, EntityDrawCommand } from './entity/types'
import type { StyleResolver } from './styleResolver'
import { WORLD, TERRAINS } from './constants'

// ─── 常量 ──────────────────────────────────────────────

const VIEWPORT_RADIUS = WORLD.VIEWPORT_RADIUS
const VIEWPORT_TOTAL = VIEWPORT_RADIUS * 2 + 1 // 21
const BOUNDARY_CHAR = '|'

// ─── 查找表（模块加载时一次性构建）───────────────────

const terrainCharMap: Record<string, string> = {}
for (const t of TERRAINS) {
  terrainCharMap[t.type] = t.char
}

// ─── 类型 ──────────────────────────────────────────────

export interface RenderCell {
  vx: number
  vy: number
  char: string
  font: string
  fillStyle: string
}

// ─── renderViewport — 纯函数 ──────────────────────────

export function renderViewport(
  terrainMap: TerrainType[][],
  entityLayer: PlacedEntity[],
  entities: EntityCatalog,
  styleResolver: StyleResolver,
  playerPos: [number, number],
  mask: boolean[][],
  explored: boolean[][],
  traveled: boolean[][],
): {
  entityCommands: EntityDrawCommand[]
  terrainCells: RenderCell[]
  boundaryCells: RenderCell[]
  playerCell: RenderCell | null
  occupiedSet: Set<string>
} {
  const [px, py] = playerPos
  const mapSize = terrainMap.length
  const viewportOriginX = px - VIEWPORT_RADIUS
  const viewportOriginY = py - VIEWPORT_RADIUS

  const occupiedSet = new Set<string>()
  const entityCommands: EntityDrawCommand[] = []
  const terrainCells: RenderCell[] = []
  const boundaryCells: RenderCell[] = []
  let playerCell: RenderCell | null = null

  // ── 1. 实体层 ──────────────────────────────────────
  for (const placed of entityLayer) {
    const entity = entities[placed.entityId]
    if (!entity) continue

    const cmd = entity.getDrawCommand(
      placed.anchorX,
      placed.anchorY,
      viewportOriginX,
      viewportOriginY,
      false, // isDimmed —— 由 renderViewport 按格判断并应用 styling
      mask,
      explored,
    )
    if (cmd.cells.length === 0) continue

    // 为每个实体格应用 StyleResolver 样式
    for (const cell of cmd.cells) {
      const wx = viewportOriginX + cell.vx
      const wy = viewportOriginY + cell.vy
      const isVisible = mask[wx]?.[wy] ?? false
      const isExploredCell = explored[wx]?.[wy] ?? false
      const isDimmed = !isVisible && isExploredCell

      const cellOutput: EntityCellOutput = {
        char: cell.char,
        prominent: true,  // 所有实体地标均为 prominent
        bold: true,       // 所有实体使用粗体（匹配旧版 FONT_LANDMARK）
      }
      const resolved = styleResolver.resolve(cellOutput, { isDimmed })
      cell.font = resolved.font
      cell.fillStyle = resolved.fillStyle

      occupiedSet.add(`${wx},${wy}`)
    }

    entityCommands.push(cmd)
  }

  // ── 2. 视口格（地形 / 边界 / 玩家）────────────────
  for (let vy = 0; vy < VIEWPORT_TOTAL; vy++) {
    for (let vx = 0; vx < VIEWPORT_TOTAL; vx++) {
      const wx = viewportOriginX + vx
      const wy = viewportOriginY + vy
      const cellKey = `${wx},${wy}`

      // 跳过实体占用的格
      if (occupiedSet.has(cellKey)) continue

      // 边界墙：超出地图范围
      if (wx < 0 || wx >= mapSize || wy < 0 || wy >= mapSize) {
        const cellOutput: EntityCellOutput = { char: BOUNDARY_CHAR, prominent: false, bold: false }
        const resolved = styleResolver.resolve(cellOutput, { isDimmed: true })
        boundaryCells.push({
          vx, vy,
          char: BOUNDARY_CHAR,
          font: resolved.font,
          fillStyle: resolved.fillStyle,
        })
        continue
      }

      // 玩家格
      if (wx === px && wy === py) {
        const cellOutput: EntityCellOutput = { char: '@', prominent: true, bold: false }
        const resolved = styleResolver.resolve(cellOutput, { isDimmed: false })
        playerCell = {
          vx, vy,
          char: '@',
          font: resolved.font,
          fillStyle: resolved.fillStyle,
        }
        continue
      }

      // 地形格
      const isVisible = mask[wx]?.[wy] ?? false
      const isExploredCell = explored[wx]?.[wy] ?? false
      if (!isVisible && !isExploredCell) continue

      const isDimmed = !isVisible && isExploredCell
      const terrain = terrainMap[wx][wy]
      const isTraveled = traveled[wx]?.[wy] ?? false

      let char: string
      if (terrain === 'void') {
        char = ''
      } else if (isTraveled) {
        char = ';'
      } else {
        char = terrainCharMap[terrain] ?? '.'
      }

      const cellOutput: EntityCellOutput = { char, prominent: false, bold: false }
      const resolved = styleResolver.resolve(cellOutput, { isDimmed })
      terrainCells.push({
        vx, vy,
        char,
        font: resolved.font,
        fillStyle: resolved.fillStyle,
      })
    }
  }

  return { entityCommands, terrainCells, boundaryCells, playerCell, occupiedSet }
}

// ─── drawComposed — 批量渲染 ─────────────────────────

/**
 * 将 renderViewport 的结果批量绘制到 Canvas。
 *
 * 绘制顺序（从下到上）：
 *   1. 实体层（entityCommands）
 *   2. 地形层（terrainCells）
 *   3. 边界层（boundaryCells）
 *   4. 玩家层（playerCell）
 *
 * 在每个类别内按 (font, fillStyle) 分组，减少 ctx state 切换。
 */
export function drawComposed(
  ctx: CanvasRenderingContext2D,
  result: ReturnType<typeof renderViewport>,
  cellSize: number,
): void {
  // 内部：按 (font, fillStyle) 批量绘制
  function drawBatch(cells: RenderCell[]): void {
    const batches = new Map<string, RenderCell[]>()
    for (const cell of cells) {
      if (!cell.char || cell.char === ' ') continue
      const key = `${cell.font}\x00${cell.fillStyle}`
      let batch = batches.get(key)
      if (!batch) {
        batch = []
        batches.set(key, batch)
      }
      batch.push(cell)
    }

    for (const [key, batch] of batches) {
      const sepIdx = key.indexOf('\x00')
      const font = key.slice(0, sepIdx)
      const fillStyle = key.slice(sepIdx + 1)
      ctx.font = font
      ctx.fillStyle = fillStyle
      for (const cell of batch) {
        ctx.fillText(
          cell.char,
          cell.vx * cellSize + cellSize / 2,
          cell.vy * cellSize + cellSize / 2,
        )
      }
    }
  }

  // 1. 实体层（最底）
  for (const cmd of result.entityCommands) {
    drawBatch(cmd.cells)
  }

  // 2. 地形层
  drawBatch(result.terrainCells)

  // 3. 边界层
  drawBatch(result.boundaryCells)

  // 4. 玩家层（最顶）
  if (result.playerCell) {
    drawBatch([result.playerCell])
  }
}
