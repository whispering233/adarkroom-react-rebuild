import { describe, it, expect, vi } from 'vitest'
import { renderViewport, renderTiles, type RenderCell } from './renderViewport'
import { WORLD, LANDMARKS } from './constants'
import type { MapTile, TerrainType, LandmarkType } from './types'

// ─── 常量 ──────────────────────────────────────────────

const VIEWPORT_RADIUS = WORLD.VIEWPORT_RADIUS
const VIEWPORT_TOTAL = VIEWPORT_RADIUS * 2 + 1 // 31
const FONT_NORMAL = '12px "Courier New", Courier, monospace'
const FONT_LANDMARK = 'bold 12px "Courier New", Courier, monospace'

// ─── 辅助函数 ──────────────────────────────────────────

function createTile(terrain: TerrainType, landmark?: LandmarkType): MapTile {
  return landmark ? { terrain, landmark } : { terrain }
}

function createMap(size: number, fill: MapTile): MapTile[][] {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({ ...fill })),
  )
}

function createAllTrueMask(size: number): boolean[][] {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => true),
  )
}

// ─── 测试套件 ──────────────────────────────────────────

describe('renderViewport', () => {
  it('renders boundary |, player @, and terrain . for centered position with no landmarks', () => {
    const mapSize = 61
    const tiles = createMap(mapSize, createTile('field'))
    const playerPos: [number, number] = [30, 30]

    const result = renderViewport(tiles, playerPos, createAllTrueMask(mapSize))
    // All 31x31 cells = 961: 0 boundary | + 1 player @ + 960 terrain .
    const boundaries = result.filter(t => t.char === '|')
    expect(boundaries.length).toBe(0)
    const playerTile = result.find(t => t.char === '@')
    expect(playerTile).toBeDefined()
    expect(playerTile!.font).toBe(FONT_NORMAL)
    const terrainTiles = result.filter(t => t.char === '.')
    expect(terrainTiles.length).toBe(960)
  })

  it('places player @ at viewport center for centered position', () => {
    const mapSize = 61
    const tiles = createMap(mapSize, createTile('field'))
    const playerPos: [number, number] = [30, 30]

    const result = renderViewport(tiles, playerPos, createAllTrueMask(mapSize))
    const playerTile = result.find(t => t.char === '@')
    expect(playerTile).toBeDefined()
    expect(playerTile!.char).toBe('@')
    expect(playerTile!.vx).toBe(VIEWPORT_RADIUS)
    expect(playerTile!.vy).toBe(VIEWPORT_RADIUS)
    expect(playerTile!.font).toBe(FONT_NORMAL)
  })

  it('adds boundary walls on left/top when player at map origin [0,0]', () => {
    const mapSize = 61
    const tiles = createMap(mapSize, createTile('field'))
    const playerPos: [number, number] = [0, 0]

    const result = renderViewport(tiles, playerPos, createAllTrueMask(mapSize))

    // Player at viewport center
    const playerTile = result.find(t => t.char === '@')
    expect(playerTile).toBeDefined()
    expect(playerTile!.vx).toBe(VIEWPORT_RADIUS)
    expect(playerTile!.vy).toBe(VIEWPORT_RADIUS)

    // All tiles with vx < VIEWPORT_RADIUS are left-boundary
    const leftBoundary = result.filter(t => t.vx < VIEWPORT_RADIUS)
    expect(leftBoundary.length).toBeGreaterThan(0)
    for (const tile of leftBoundary) {
      expect(tile.char).toBe('|')
      expect(tile.font).toBe(FONT_NORMAL)
    }

    // All tiles with vy < VIEWPORT_RADIUS are top-boundary
    const topBoundary = result.filter(t => t.vy < VIEWPORT_RADIUS)
    expect(topBoundary.length).toBeGreaterThan(0)
    for (const tile of topBoundary) {
      expect(tile.char).toBe('|')
      expect(tile.font).toBe(FONT_NORMAL)
    }
  })

  it('adds boundary walls on right/bottom when player at map corner [60,60]', () => {
    const mapSize = 61
    const tiles = createMap(mapSize, createTile('field'))
    const playerPos: [number, number] = [60, 60]

    const result = renderViewport(tiles, playerPos, createAllTrueMask(mapSize))

    // Player at viewport center
    const playerTile = result.find(t => t.char === '@')
    expect(playerTile).toBeDefined()
    expect(playerTile!.vx).toBe(VIEWPORT_RADIUS)
    expect(playerTile!.vy).toBe(VIEWPORT_RADIUS)

    // All tiles with vx > VIEWPORT_RADIUS are right/bottom-boundary
    const rightBoundary = result.filter(t => t.vx > VIEWPORT_RADIUS)
    expect(rightBoundary.length).toBeGreaterThan(0)
    for (const tile of rightBoundary) {
      expect(tile.char).toBe('|')
      expect(tile.font).toBe(FONT_NORMAL)
    }

    const bottomBoundary = result.filter(t => t.vy > VIEWPORT_RADIUS)
    expect(bottomBoundary.length).toBeGreaterThan(0)
    for (const tile of bottomBoundary) {
      expect(tile.char).toBe('|')
      expect(tile.font).toBe(FONT_NORMAL)
    }
  })

  it('includes terrain tiles with char . when no landmarks present', () => {
    const mapSize = 61
    // No landmarks, just field terrain
    const tiles = createMap(mapSize, createTile('field'))
    const playerPos: [number, number] = [30, 30]

    const result = renderViewport(tiles, playerPos, createAllTrueMask(mapSize))

    // All 31x31 = 961 cells now have a RenderCell
    expect(result.length).toBe(VIEWPORT_TOTAL * VIEWPORT_TOTAL)
    const dotTiles = result.filter(t => t.char === '.')
    expect(dotTiles.length).toBe(VIEWPORT_TOTAL * VIEWPORT_TOTAL - 1)
    const playerTile = result.find(t => t.char === '@')
    expect(playerTile).toBeDefined()
    expect(playerTile!.font).toBe(FONT_NORMAL)
  })

  it('includes landmark tiles with landmark font and correct char', () => {
    const mapSize = 61
    // Use ironMine (no footprint) to verify single-tile landmark rendering
    const tiles = createMap(mapSize, createTile('field', 'ironMine'))
    const playerPos: [number, number] = [30, 30]

    const result = renderViewport(tiles, playerPos, createAllTrueMask(mapSize))

    // Player at (30,30) — one tile
    // But that tile has landmark=ironMine; player takes precedence
    // All other in-bounds tiles have landmark=ironMine → landmark tiles
    // Total = player(1) + landmarks(960) = 961
    expect(result.length).toBe(VIEWPORT_TOTAL * VIEWPORT_TOTAL)

    const landmarkTiles = result.filter(t => t.char === 'I') // 'I' = ironMine char
    // 960 non-player landmark tiles (no boundaries at center)
    expect(landmarkTiles.length).toBe(VIEWPORT_TOTAL * VIEWPORT_TOTAL - 1)

    for (const t of landmarkTiles) {
      expect(t.char).toBe('I')
      expect(t.font).toBe(FONT_LANDMARK)
    }
  })

  it('renders correct chars for all landmark types', () => {
    const mapSize = 61
    const playerPos: [number, number] = [5, 5]

    // Place a specific landmark at a known nearby position
    const tiles = createMap(mapSize, createTile('field'))
    // Place one landmark at (6,5) — one step right of player
    const lmDef = LANDMARKS.find(lm => lm.type === 'ironMine')!
    tiles[6][5] = createTile('field', 'ironMine')

    const result = renderViewport(tiles, playerPos, createAllTrueMask(mapSize))
    const lmTile = result.find(t => t.char === lmDef.char)
    expect(lmTile).toBeDefined()
    expect(lmTile!.char).toBe(lmDef.char)
    expect(lmTile!.font).toBe(FONT_LANDMARK)
    // vx = wx - xStart = 6 - (5 - 15) = 6 - (-10) = 16
    expect(lmTile!.vx).toBe(VIEWPORT_RADIUS + 1)
  })

  it('renders 2x2 footprint landmark as single cell (footprint expansion done in generator)', () => {
    const mapSize = 61
    const tiles = createMap(mapSize, createTile('field'))
    // city has footprint {w:2, h:2} with char 'Y'
    // Footprint expansion is done in generator, NOT in renderViewport
    tiles[20][20] = createTile('field', 'city')
    const playerPos: [number, number] = [30, 30]

    const result = renderViewport(tiles, playerPos, createAllTrueMask(mapSize))

    // viewport covers [15..45], city at [20][20] → vx=5, vy=5
    const cityCells = result.filter(c => c.char === 'Y')
    expect(cityCells).toHaveLength(1)
    expect(cityCells[0].vx).toBe(5)
    expect(cityCells[0].vy).toBe(5)
    expect(cityCells[0].font).toBe(FONT_LANDMARK)

    // No footprint empty cells should be produced by renderViewport
    const emptyCells = result.filter(c => c.char === '')
    expect(emptyCells).toHaveLength(0)
  })

  it('player on landmark shows @ (player takes precedence)', () => {
    const mapSize = 61
    const tiles = createMap(mapSize, createTile('field', 'ironMine'))
    const playerPos: [number, number] = [30, 30]

    const result = renderViewport(tiles, playerPos, createAllTrueMask(mapSize))
    const playerTile = result.find(t => t.char === '@')
    expect(playerTile).toBeDefined()
    expect(playerTile!.char).toBe('@')
    expect(playerTile!.font).toBe(FONT_NORMAL)
  })

  it('renders void terrain with empty char (invisible tiles)', () => {
    const mapSize = 61
    const tiles = createMap(mapSize, createTile('void'))
    const playerPos: [number, number] = [30, 30]

    const result = renderViewport(tiles, playerPos, createAllTrueMask(mapSize))

    // Player tile
    const playerTile = result.find(t => t.char === '@')
    expect(playerTile).toBeDefined()

    // All non-boundary, non-player tiles should have char=''
    const voidTiles = result.filter(t => t.char === '')
    // Count: all in-bounds tiles (map covers entire viewport) minus player
    // Total cells = VIEWPORT_TOTAL^2 = 961
    // Boundary = 0 (player at center, viewport fully within map)
    // Player = 1
    // Void = 961 - 0 - 1 = 960
    expect(voidTiles.length).toBe(960)
    for (const t of voidTiles) {
      expect(t.char).toBe('')
      expect(t.font).toBe(FONT_NORMAL)
    }
  })

  it('does not mutate input arrays', () => {
    const mapSize = 10
    const tiles = createMap(mapSize, createTile('field'))
    const playerPos: [number, number] = [5, 5]

    const originalTiles: MapTile[][] = tiles.map(row =>
      row.map(t => ({ ...t })),
    )

    renderViewport(tiles, playerPos, createAllTrueMask(mapSize))

    expect(tiles).toEqual(originalTiles)
  })
})

// ─── renderTiles ───────────────────────────────────────

describe('renderTiles', () => {
  function createMockCtx(): CanvasRenderingContext2D {
    // Provide minimal mock with only the props renderTiles touches
    return {
      font: '',
      fillStyle: '',
      fillText: vi.fn(),
    } as unknown as CanvasRenderingContext2D
  }

  it('calls fillText for non-empty chars', () => {
    const ctx = createMockCtx()
    const cells: RenderCell[] = [
      { vx: 0, vy: 0, char: '@', font: FONT_NORMAL, fillStyle: '#fff' },
      { vx: 1, vy: 0, char: 'A', font: FONT_LANDMARK, fillStyle: '#fa0' },
    ]
    const cellSize = 16

    renderTiles(ctx, cells, cellSize)

    expect(ctx.fillText).toHaveBeenCalledTimes(2)
    expect(ctx.fillText).toHaveBeenCalledWith('@', 8, 8)
    expect(ctx.fillText).toHaveBeenCalledWith('A', 24, 8)
  })

  it('sets font and fillStyle on ctx before calling fillText', () => {
    const ctx = createMockCtx()
    const cells: RenderCell[] = [
      { vx: 0, vy: 0, char: '@', font: FONT_LANDMARK, fillStyle: '#fa0' },
    ]
    const cellSize = 16

    renderTiles(ctx, cells, cellSize)

    expect(ctx.font).toBe(FONT_LANDMARK)
    expect(ctx.fillStyle).toBe('#fa0')
    expect(ctx.fillText).toHaveBeenCalledWith('@', 8, 8)
  })

  it('skips empty char ("")', () => {
    const ctx = createMockCtx()
    const cells: RenderCell[] = [
      { vx: 0, vy: 0, char: '', font: FONT_NORMAL, fillStyle: '#666' },
    ]

    renderTiles(ctx, cells, 16)

    expect(ctx.fillText).not.toHaveBeenCalled()
  })

  it('skips space char (" ")', () => {
    const ctx = createMockCtx()
    const cells: RenderCell[] = [
      { vx: 0, vy: 0, char: ' ', font: FONT_NORMAL, fillStyle: '#666' },
    ]

    renderTiles(ctx, cells, 16)

    expect(ctx.fillText).not.toHaveBeenCalled()
  })

  it('skips empty and space but renders others in mixed list', () => {
    const ctx = createMockCtx()
    const cells: RenderCell[] = [
      { vx: 0, vy: 0, char: ' ', font: FONT_NORMAL, fillStyle: '#666' },
      { vx: 1, vy: 0, char: '@', font: FONT_NORMAL, fillStyle: '#fff' },
      { vx: 2, vy: 0, char: '', font: FONT_NORMAL, fillStyle: '#666' },
      { vx: 3, vy: 0, char: '|', font: FONT_NORMAL, fillStyle: '#888' },
    ]

    renderTiles(ctx, cells, 16)

    expect(ctx.fillText).toHaveBeenCalledTimes(2)
    expect(ctx.fillText).toHaveBeenCalledWith('@', 24, 8)
    expect(ctx.fillText).toHaveBeenCalledWith('|', 56, 8)
  })
})
