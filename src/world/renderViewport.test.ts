import { describe, it, expect, vi } from 'vitest'
import { renderViewport, drawComposed, type RenderCell } from './renderViewport'
import { WORLD } from './constants'
import type {
  TerrainType,
  PlacedEntity,
  EntityCellOutput,
  EntityRenderInput,
} from './types'
import type { StyleResolver } from './styleResolver'
import type { EntityCatalog, EntityDrawCommand } from './entity/types'
import { villageEntity } from './entity/village'
import { ironMineEntity } from './entity/ironMine'
import { cityEntity } from './entity/city'

// ─── 常量 ──────────────────────────────────────────────

const VIEWPORT_RADIUS = WORLD.VIEWPORT_RADIUS
const VIEWPORT_TOTAL = VIEWPORT_RADIUS * 2 + 1 // 21
const FONT_NORMAL = '12px "Courier New", Courier, monospace'
const FONT_BOLD = 'bold 12px "Courier New", Courier, monospace'

// ─── Mock StyleResolver ─────────────────────────────────

const mockStyleResolver: StyleResolver = {
  resolve(cell: EntityCellOutput, input: EntityRenderInput) {
    const fillStyle = input.isDimmed
      ? '#666'
      : cell.prominent
        ? '#fa0'
        : '#0a0'
    const font = cell.bold ? FONT_BOLD : FONT_NORMAL
    return { fillStyle, font }
  },
}

// ─── 辅助函数 ──────────────────────────────────────────

function createTerrainMap(size: number, fill: TerrainType): TerrainType[][] {
  return Array.from({ length: size }, () =>
    Array.from<TerrainType>({ length: size }).fill(fill),
  )
}

function createAllTrueArray(size: number): boolean[][] {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => true),
  )
}

function createAllFalseArray(size: number): boolean[][] {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false),
  )
}

/** 创建一个只包含指定实体的 EntityCatalog */
function makeCatalog(
  ...entities: Array<{ type: string; footprint: { w: number; h: number }; getDrawCommand: any; onEnter?: any }>
): EntityCatalog {
  const cat: EntityCatalog = {}
  for (const e of entities) {
    cat[e.type] = e as any
  }
  return cat
}

// ─── renderViewport ────────────────────────────────────

describe('renderViewport', () => {
  it('returns categorized result structure for basic map', () => {
    const size = 61
    const terrainMap = createTerrainMap(size, 'field')
    const playerPos: [number, number] = [30, 30]
    const allTrue = createAllTrueArray(size)
    const allFalse = createAllFalseArray(size)

    const result = renderViewport(
      terrainMap, [], {}, mockStyleResolver, playerPos,
      allTrue, allTrue, allFalse,
    )

    expect(result).toHaveProperty('entityCommands')
    expect(result).toHaveProperty('terrainCells')
    expect(result).toHaveProperty('boundaryCells')
    expect(result).toHaveProperty('playerCell')
    expect(result).toHaveProperty('occupiedSet')
    expect(Array.isArray(result.entityCommands)).toBe(true)
    expect(Array.isArray(result.terrainCells)).toBe(true)
    expect(Array.isArray(result.boundaryCells)).toBe(true)
  })

  it('places player @ at viewport center', () => {
    const size = 61
    const terrainMap = createTerrainMap(size, 'field')
    const playerPos: [number, number] = [30, 30]
    const allTrue = createAllTrueArray(size)

    const result = renderViewport(
      terrainMap, [], {}, mockStyleResolver, playerPos,
      allTrue, allTrue, createAllFalseArray(size),
    )

    expect(result.playerCell).not.toBeNull()
    expect(result.playerCell!.char).toBe('@')
    expect(result.playerCell!.vx).toBe(VIEWPORT_RADIUS)
    expect(result.playerCell!.vy).toBe(VIEWPORT_RADIUS)
    // mock: prominent=true & bold=false → accent color + normal font
    expect(result.playerCell!.fillStyle).toBe('#fa0')
    expect(result.playerCell!.font).toBe(FONT_NORMAL)
  })

  it('renders boundary walls when player at map origin [0,0]', () => {
    const size = 25 // smaller map
    const terrainMap = createTerrainMap(size, 'field')
    const playerPos: [number, number] = [0, 0]
    const allTrue = createAllTrueArray(size)

    const result = renderViewport(
      terrainMap, [], {}, mockStyleResolver, playerPos,
      allTrue, allTrue, createAllFalseArray(size),
    )

    // Player at center
    expect(result.playerCell).not.toBeNull()
    expect(result.playerCell!.vx).toBe(VIEWPORT_RADIUS)
    expect(result.playerCell!.vy).toBe(VIEWPORT_RADIUS)

    // Boundary cells exist (left/top side)
    expect(result.boundaryCells.length).toBeGreaterThan(0)
    for (const cell of result.boundaryCells) {
      expect(cell.char).toBe('|')
      // mock: dimmed → '#666'
      expect(cell.fillStyle).toBe('#666')
    }

    // Terrain cells only where map exists (right/bottom portion of viewport)
    const inBounds = result.terrainCells.length + 1 // +1 for player
    const outOfBounds = result.boundaryCells.length
    expect(inBounds + outOfBounds).toBe(VIEWPORT_TOTAL * VIEWPORT_TOTAL)
  })

  it('renders terrain cells with correct chars from terrainCharMap', () => {
    const size = 61
    const terrainMap = createTerrainMap(size, 'forest')
    const playerPos: [number, number] = [30, 30]
    const allTrue = createAllTrueArray(size)

    const result = renderViewport(
      terrainMap, [], {}, mockStyleResolver, playerPos,
      allTrue, allTrue, createAllFalseArray(size),
    )

    // All non-boundary, non-player terrain should have forest char
    for (const cell of result.terrainCells) {
      expect(cell.char).toBe('▓') // forest char
    }
  })

  it('renders traveled terrain with ; char', () => {
    const size = 61
    const terrainMap = createTerrainMap(size, 'field')
    const playerPos: [number, number] = [30, 30]
    const allTrue = createAllTrueArray(size)
    const traveled = createAllFalseArray(size)
    // Mark some terrain as traveled
    traveled[25][25] = true
    traveled[26][26] = true

    const result = renderViewport(
      terrainMap, [], {}, mockStyleResolver, playerPos,
      allTrue, allTrue, traveled,
    )

    const traveledCells = result.terrainCells.filter(c => c.char === ';')
    expect(traveledCells.length).toBeGreaterThanOrEqual(2)
  })

  it('renders void terrain with empty char', () => {
    const size = 61
    const terrainMap = createTerrainMap(size, 'void')
    const playerPos: [number, number] = [30, 30]
    const allTrue = createAllTrueArray(size)

    const result = renderViewport(
      terrainMap, [], {}, mockStyleResolver, playerPos,
      allTrue, allTrue, createAllFalseArray(size),
    )

    // All non-boundary, non-player terrain should have empty char
    for (const cell of result.terrainCells) {
      expect(cell.char).toBe('')
    }
  })

  it('skips cells not in mask nor explored', () => {
    const size = 61
    const terrainMap = createTerrainMap(size, 'field')
    const playerPos: [number, number] = [30, 30]
    const allFalse = createAllFalseArray(size)

    const result = renderViewport(
      terrainMap, [], {}, mockStyleResolver, playerPos,
      allFalse, allFalse, createAllFalseArray(size),
    )

    // Player cell should still show (always visible)
    expect(result.playerCell).not.toBeNull()
    expect(result.playerCell!.char).toBe('@')

    // No terrain cells should appear (mask=false, explored=false)
    expect(result.terrainCells.length).toBe(0)
  })

  it('renders explored-but-invisible terrain as dimmed', () => {
    const size = 61
    const terrainMap = createTerrainMap(size, 'field')
    const playerPos: [number, number] = [30, 30]
    const mask = createAllFalseArray(size)
    const explored = createAllFalseArray(size)
    // Make a cell explored but not visible
    explored[20][20] = true

    const result = renderViewport(
      terrainMap, [], {}, mockStyleResolver, playerPos,
      mask, explored, createAllFalseArray(size),
    )

    // That cell should appear with muted color
    const dimmedCells = result.terrainCells.filter(c => c.fillStyle === '#666')
    expect(dimmedCells.length).toBeGreaterThanOrEqual(1)
  })

  // ── 实体层 ──────────────────────────────────────────

  it('renders a single-tile entity cell with resolved styling', () => {
    const size = 61
    const terrainMap = createTerrainMap(size, 'field')
    const playerPos: [number, number] = [30, 30]
    const allTrue = createAllTrueArray(size)

    const entityLayer: PlacedEntity[] = [
      { entityId: 'ironMine', anchorX: 28, anchorY: 30 },
    ]
    const catalog = makeCatalog(ironMineEntity)

    const result = renderViewport(
      terrainMap, entityLayer, catalog, mockStyleResolver, playerPos,
      allTrue, allTrue, createAllFalseArray(size),
    )

    expect(result.entityCommands.length).toBe(1)
    expect(result.entityCommands[0].cells.length).toBe(1)

    const cell = result.entityCommands[0].cells[0]
    expect(cell.char).toBe('I')
    // mock: prominent=true & bold=true → accent + bold font
    expect(cell.fillStyle).toBe('#fa0')
    expect(cell.font).toBe(FONT_BOLD)

    // Occupied set contains the entity's world cell
    expect(result.occupiedSet.has('28,30')).toBe(true)
  })

  it('renders multi-tile entity (village 3×3 → 9 occupied cells)', () => {
    const size = 61
    const terrainMap = createTerrainMap(size, 'field')
    const playerPos: [number, number] = [30, 30]
    const allTrue = createAllTrueArray(size)

    const entityLayer: PlacedEntity[] = [
      { entityId: 'village', anchorX: 25, anchorY: 25 },
    ]
    const catalog = makeCatalog(villageEntity)

    const result = renderViewport(
      terrainMap, entityLayer, catalog, mockStyleResolver, playerPos,
      allTrue, allTrue, createAllFalseArray(size),
    )

    expect(result.entityCommands.length).toBe(1)

    // Village is 3×3 = 9 cells
    const cmd = result.entityCommands[0]
    expect(cmd.cells.length).toBe(9)

    // 9 occupied cells: (25,25) through (27,27)
    expect(result.occupiedSet.size).toBe(9)
    for (let dx = 0; dx < 3; dx++) {
      for (let dy = 0; dy < 3; dy++) {
        expect(result.occupiedSet.has(`${25 + dx},${25 + dy}`)).toBe(true)
      }
    }

    // All cells should have resolved styling (bold + accent)
    for (const cell of cmd.cells) {
      expect(cell.fillStyle).toBe('#fa0')
      expect(cell.font).toBe(FONT_BOLD)
    }

    // Terrain cells should NOT include the vx,vy that overlap entity footprint
    const terrainWorldKeys = new Set(result.terrainCells.map(c => {
      const wx = playerPos[0] - VIEWPORT_RADIUS + c.vx
      const wy = playerPos[1] - VIEWPORT_RADIUS + c.vy
      return `${wx},${wy}`
    }))
    for (let dx = 0; dx < 3; dx++) {
      for (let dy = 0; dy < 3; dy++) {
        expect(terrainWorldKeys.has(`${25 + dx},${25 + dy}`)).toBe(false)
      }
    }
  })

  it('renders 2×2 entity (city) as 4 occupied cells', () => {
    const size = 61
    const terrainMap = createTerrainMap(size, 'field')
    const playerPos: [number, number] = [30, 30]
    const allTrue = createAllTrueArray(size)

    const entityLayer: PlacedEntity[] = [
      { entityId: 'city', anchorX: 20, anchorY: 20 },
    ]
    const catalog = makeCatalog(cityEntity)

    const result = renderViewport(
      terrainMap, entityLayer, catalog, mockStyleResolver, playerPos,
      allTrue, allTrue, createAllFalseArray(size),
    )

    expect(result.entityCommands.length).toBe(1)
    expect(result.entityCommands[0].cells.length).toBe(4)
    expect(result.occupiedSet.size).toBe(4)
    for (const cell of result.entityCommands[0].cells) {
      expect(cell.char).toBe('Y')
      expect(cell.fillStyle).toBe('#fa0')
    }
  })

  it('handles multiple entities in entityLayer', () => {
    const size = 61
    const terrainMap = createTerrainMap(size, 'field')
    const playerPos: [number, number] = [30, 30]
    const allTrue = createAllTrueArray(size)

    const entityLayer: PlacedEntity[] = [
      { entityId: 'ironMine', anchorX: 25, anchorY: 25 },
      { entityId: 'city', anchorX: 28, anchorY: 28 },
    ]
    const catalog = makeCatalog(ironMineEntity, cityEntity)

    const result = renderViewport(
      terrainMap, entityLayer, catalog, mockStyleResolver, playerPos,
      allTrue, allTrue, createAllFalseArray(size),
    )

    expect(result.entityCommands.length).toBe(2)
    // ironMine = 1 cell, city = 4 cells
    expect(result.entityCommands[0].cells.length).toBe(1)
    expect(result.entityCommands[1].cells.length).toBe(4)
    // total occupied: 5 unique cells
    expect(result.occupiedSet.size).toBe(5)
  })

  it('skips entity not in catalog', () => {
    const size = 61
    const terrainMap = createTerrainMap(size, 'field')
    const playerPos: [number, number] = [30, 30]
    const allTrue = createAllTrueArray(size)

    const entityLayer: PlacedEntity[] = [
      { entityId: 'unknown', anchorX: 25, anchorY: 25 },
    ]
    const catalog: EntityCatalog = {}

    const result = renderViewport(
      terrainMap, entityLayer, catalog, mockStyleResolver, playerPos,
      allTrue, allTrue, createAllFalseArray(size),
    )

    expect(result.entityCommands.length).toBe(0)
    expect(result.occupiedSet.size).toBe(0)
  })

  it('does not mutate input arrays', () => {
    const size = 10
    const terrainMap = createTerrainMap(size, 'field')
    const playerPos: [number, number] = [5, 5]
    const allTrue = createAllTrueArray(size)
    const allFalse = createAllFalseArray(size)

    const originalTerrainMap = terrainMap.map(row => [...row])

    renderViewport(
      terrainMap, [], {}, mockStyleResolver, playerPos,
      allTrue, allTrue, allFalse,
    )

    expect(terrainMap).toEqual(originalTerrainMap)
  })
})

// ─── drawComposed ──────────────────────────────────────

describe('drawComposed', () => {
  function createMockCtx(): CanvasRenderingContext2D {
    return {
      font: '',
      fillStyle: '',
      fillText: vi.fn(),
    } as unknown as CanvasRenderingContext2D
  }

  it('draws entity commands, terrain, boundary, and player in order', () => {
    const ctx = createMockCtx()
    const cellSize = 16

    // Build a minimal result object
    const entityCmd: EntityDrawCommand = {
      bounds: { vx: 0, vy: 0, vw: 1, vh: 1 },
      cells: [{ vx: 0, vy: 0, char: 'I', font: FONT_BOLD, fillStyle: '#fa0' }],
    }

    const result = {
      entityCommands: [entityCmd],
      terrainCells: [
        { vx: 1, vy: 1, char: '.', font: FONT_NORMAL, fillStyle: '#0a0' },
      ],
      boundaryCells: [
        { vx: 5, vy: 5, char: '|', font: FONT_NORMAL, fillStyle: '#666' },
      ],
      playerCell: { vx: 10, vy: 10, char: '@', font: FONT_NORMAL, fillStyle: '#fa0' },
      occupiedSet: new Set<string>(),
    }

    drawComposed(ctx, result as any, cellSize)

    // Should be called 4 times (1 entity + 1 terrain + 1 boundary + 1 player)
    expect(ctx.fillText).toHaveBeenCalledTimes(4)

    // Order check: we can verify the sequence by checking arguments
    const calls = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls
    expect(calls[0][0]).toBe('I')   // entity first (bottom)
    expect(calls[1][0]).toBe('.')   // terrain
    expect(calls[2][0]).toBe('|')   // boundary
    expect(calls[3][0]).toBe('@')   // player last (top)
  })

  it('batches cells with same font+fillStyle within same category', () => {
    const ctx = createMockCtx()
    const cellSize = 16

    const multiCells: RenderCell[] = [
      { vx: 0, vy: 0, char: 'a', font: FONT_NORMAL, fillStyle: '#0a0' },
      { vx: 1, vy: 0, char: 'b', font: FONT_NORMAL, fillStyle: '#0a0' },
      { vx: 2, vy: 0, char: 'c', font: FONT_BOLD, fillStyle: '#fa0' },
    ]

    // All terrain cells (same category)
    const entityCmd: EntityDrawCommand = {
      bounds: { vx: 0, vy: 0, vw: 3, vh: 1 },
      cells: multiCells,
    }

    const result = {
      entityCommands: [entityCmd],
      terrainCells: [],
      boundaryCells: [],
      playerCell: null,
      occupiedSet: new Set<string>(),
    }

    drawComposed(ctx, result as any, cellSize)

    // ctx.font/fillStyle should only be set 2 times (2 unique style pairs)
    // But fillText called 3 times
    expect(ctx.fillText).toHaveBeenCalledTimes(3)

    // First two calls share same font+fillStyle
    expect(ctx.fillText).toHaveBeenCalledWith('a', 8, 8)
    expect(ctx.fillText).toHaveBeenCalledWith('b', 24, 8)
    expect(ctx.fillText).toHaveBeenCalledWith('c', 40, 8)
  })

  it('skips empty char ("")', () => {
    const ctx = createMockCtx()
    const cellSize = 16

    const result = {
      entityCommands: [],
      terrainCells: [
        { vx: 0, vy: 0, char: '', font: FONT_NORMAL, fillStyle: '#666' },
      ],
      boundaryCells: [],
      playerCell: null,
      occupiedSet: new Set<string>(),
    }

    drawComposed(ctx, result as any, cellSize)

    expect(ctx.fillText).not.toHaveBeenCalled()
  })

  it('skips space char (" ")', () => {
    const ctx = createMockCtx()
    const cellSize = 16

    const result = {
      entityCommands: [
        {
          bounds: { vx: 0, vy: 0, vw: 1, vh: 1 },
          cells: [
            { vx: 0, vy: 0, char: ' ', font: FONT_NORMAL, fillStyle: '#666' },
          ],
        },
      ],
      terrainCells: [],
      boundaryCells: [],
      playerCell: null,
      occupiedSet: new Set<string>(),
    }

    drawComposed(ctx, result as any, cellSize)

    expect(ctx.fillText).not.toHaveBeenCalled()
  })

  it('handles null playerCell', () => {
    const ctx = createMockCtx()
    const cellSize = 16

    const result = {
      entityCommands: [],
      terrainCells: [],
      boundaryCells: [],
      playerCell: null,
      occupiedSet: new Set<string>(),
    }

    drawComposed(ctx, result as any, cellSize)

    expect(ctx.fillText).not.toHaveBeenCalled()
  })

  it('computes coordinates correctly: x = vx * cellSize + cellSize/2', () => {
    const ctx = createMockCtx()
    const cellSize = 16

    const result = {
      entityCommands: [],
      terrainCells: [
        { vx: 2, vy: 3, char: '.', font: FONT_NORMAL, fillStyle: '#0a0' },
      ],
      boundaryCells: [],
      playerCell: null,
      occupiedSet: new Set<string>(),
    }

    drawComposed(ctx, result as any, cellSize)

    expect(ctx.fillText).toHaveBeenCalledWith('.', 40, 56) // 2*16+8=40, 3*16+8=56
  })
})
