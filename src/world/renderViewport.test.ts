import { describe, it, expect, vi } from 'vitest'
import { renderViewport, renderTiles, type TileDescriptor, type ThemeColors } from './renderViewport'
import { WORLD, LANDMARKS } from './constants'
import type { MapTile, TerrainType, LandmarkType } from './types'

// ─── 常量 ──────────────────────────────────────────────

const VIEWPORT_RADIUS = WORLD.VIEWPORT_RADIUS
const VIEWPORT_TOTAL = VIEWPORT_RADIUS * 2 + 1 // 31

// ─── 默认主题色 ─────────────────────────────────────────

const defaultTheme: ThemeColors = {
  textPrimary: '#fff',
  textMuted: '#888',
  bg: '#000',
  cellBg: '#333',
  accent: '#ff0',
}

// ─── 辅助函数 ──────────────────────────────────────────

function createTile(terrain: TerrainType, landmark?: LandmarkType): MapTile {
  return landmark ? { terrain, landmark } : { terrain }
}

function createMap(size: number, fill: MapTile): MapTile[][] {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({ ...fill })),
  )
}

// ─── 测试套件 ──────────────────────────────────────────

describe('renderViewport', () => {
  it('emits only player tile when centered on open terrain with no landmarks', () => {
    const mapSize = 61
    const tiles = createMap(mapSize, createTile('field'))
    const playerPos: [number, number] = [30, 30]

    const result = renderViewport(tiles, playerPos, defaultTheme)
    // Terrain tiles are skipped — only player @ is emitted
    expect(result.length).toBe(1)
    expect(result[0].isPlayer).toBe(true)
  })

  it('places player @ at viewport center for centered position', () => {
    const mapSize = 61
    const tiles = createMap(mapSize, createTile('field'))
    const playerPos: [number, number] = [30, 30]

    const result = renderViewport(tiles, playerPos, defaultTheme)
    const playerTile = result.find(t => t.isPlayer)
    expect(playerTile).toBeDefined()
    expect(playerTile!.char).toBe('@')
    expect(playerTile!.vx).toBe(VIEWPORT_RADIUS)
    expect(playerTile!.vy).toBe(VIEWPORT_RADIUS)
    expect(playerTile!.textColor).toBe(defaultTheme.textPrimary)
    expect(playerTile!.bgColor).toBe(defaultTheme.cellBg)
  })

  it('adds boundary walls on left/top when player at map origin [0,0]', () => {
    const mapSize = 61
    const tiles = createMap(mapSize, createTile('field'))
    const playerPos: [number, number] = [0, 0]

    const result = renderViewport(tiles, playerPos, defaultTheme)

    // Player at viewport center
    const playerTile = result.find(t => t.isPlayer)
    expect(playerTile).toBeDefined()
    expect(playerTile!.vx).toBe(VIEWPORT_RADIUS)
    expect(playerTile!.vy).toBe(VIEWPORT_RADIUS)

    // All tiles with vx < VIEWPORT_RADIUS are left-boundary
    const leftBoundary = result.filter(t => t.vx < VIEWPORT_RADIUS)
    expect(leftBoundary.length).toBeGreaterThan(0)
    for (const tile of leftBoundary) {
      expect(tile.char).toBe('█')
      expect(tile.isPlayer).toBe(false)
    }

    // All tiles with vy < VIEWPORT_RADIUS are top-boundary
    const topBoundary = result.filter(t => t.vy < VIEWPORT_RADIUS)
    expect(topBoundary.length).toBeGreaterThan(0)
    for (const tile of topBoundary) {
      expect(tile.char).toBe('█')
      expect(tile.isPlayer).toBe(false)
    }
  })

  it('adds boundary walls on right/bottom when player at map corner [60,60]', () => {
    const mapSize = 61
    const tiles = createMap(mapSize, createTile('field'))
    const playerPos: [number, number] = [60, 60]

    const result = renderViewport(tiles, playerPos, defaultTheme)

    // Player at viewport center
    const playerTile = result.find(t => t.isPlayer)
    expect(playerTile).toBeDefined()
    expect(playerTile!.vx).toBe(VIEWPORT_RADIUS)
    expect(playerTile!.vy).toBe(VIEWPORT_RADIUS)

    // All tiles with vx > VIEWPORT_RADIUS are right/bottom-boundary
    const rightBoundary = result.filter(t => t.vx > VIEWPORT_RADIUS)
    expect(rightBoundary.length).toBeGreaterThan(0)
    for (const tile of rightBoundary) {
      expect(tile.char).toBe('█')
      expect(tile.isPlayer).toBe(false)
    }

    const bottomBoundary = result.filter(t => t.vy > VIEWPORT_RADIUS)
    expect(bottomBoundary.length).toBeGreaterThan(0)
    for (const tile of bottomBoundary) {
      expect(tile.char).toBe('█')
      expect(tile.isPlayer).toBe(false)
    }
  })

  it('excludes terrain tiles (only player + boundary + landmark in output)', () => {
    const mapSize = 61
    // No landmarks, just field terrain
    const tiles = createMap(mapSize, createTile('field'))
    const playerPos: [number, number] = [30, 30]

    const result = renderViewport(tiles, playerPos, defaultTheme)

    // All tiles in-bounds → only player tile (no boundary, no landmarks, no terrain)
    expect(result.length).toBe(1)
    expect(result[0].isPlayer).toBe(true)
    expect(result[0].char).toBe('@')
  })

  it('includes landmark tiles with accent color and correct char', () => {
    const mapSize = 61
    const tiles = createMap(mapSize, createTile('field', 'village'))
    const playerPos: [number, number] = [30, 30]

    const result = renderViewport(tiles, playerPos, defaultTheme)

    // Player at (30,30) — one tile
    // But that tile has landmark=village; player takes precedence
    // All other tiles have landmark=village → landmark tiles everywhere
    // Total tiles = player(1) + landmarks(31² - 1 - 0 boundary) = 1 + 960 = 961
    expect(result.length).toBe(VIEWPORT_TOTAL * VIEWPORT_TOTAL)

    const landmarkTiles = result.filter(t => t.isLandmark && !t.isPlayer)
    // All non-player tiles should be landmarks
    expect(landmarkTiles.length).toBe(VIEWPORT_TOTAL * VIEWPORT_TOTAL - 1)

    for (const t of landmarkTiles) {
      expect(t.char).toBe('A') // village char from LANDMARKS
      expect(t.textColor).toBe(defaultTheme.accent)
      expect(t.bgColor).toBe('')
      expect(t.isLandmark).toBe(true)
      expect(t.landmarkType).toBe('village')
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

    const result = renderViewport(tiles, playerPos, defaultTheme)
    const lmTile = result.find(t => t.isLandmark)
    expect(lmTile).toBeDefined()
    expect(lmTile!.char).toBe(lmDef.char)
    expect(lmTile!.landmarkType).toBe('ironMine')
    // vx = wx - xStart = 6 - (5 - 15) = 6 - (-10) = 16
    expect(lmTile!.vx).toBe(VIEWPORT_RADIUS + 1)
  })

  it('player on landmark shows @ (player takes precedence)', () => {
    const mapSize = 61
    const tiles = createMap(mapSize, createTile('field', 'ironMine'))
    const playerPos: [number, number] = [30, 30]

    const result = renderViewport(tiles, playerPos, defaultTheme)
    const playerTile = result.find(t => t.isPlayer)
    expect(playerTile).toBeDefined()
    expect(playerTile!.isPlayer).toBe(true)
    expect(playerTile!.isLandmark).toBe(false)
    expect(playerTile!.char).toBe('@')
  })

  it('does not mutate input arrays', () => {
    const mapSize = 10
    const tiles = createMap(mapSize, createTile('field'))
    const playerPos: [number, number] = [5, 5]

    const originalTiles: MapTile[][] = tiles.map(row =>
      row.map(t => ({ ...t })),
    )

    renderViewport(tiles, playerPos, defaultTheme)

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
    const descriptors: TileDescriptor[] = [
      {
        vx: 0, vy: 0, char: '@', textColor: '#fff', bgColor: '#333',
        isPlayer: true, isLandmark: false,
      },
      {
        vx: 1, vy: 0, char: 'A', textColor: '#ff0', bgColor: '',
        isPlayer: false, isLandmark: true, landmarkType: 'village',
      },
    ]
    const cellSize = 16

    renderTiles(ctx, descriptors, cellSize)

    expect(ctx.fillText).toHaveBeenCalledTimes(2)
    expect(ctx.fillText).toHaveBeenCalledWith('@', 8, 8)
    expect(ctx.fillText).toHaveBeenCalledWith('A', 24, 8)
  })

  it('skips empty char ("")', () => {
    const ctx = createMockCtx()
    const descriptors: TileDescriptor[] = [
      {
        vx: 0, vy: 0, char: '', textColor: '#888', bgColor: '',
        isPlayer: false, isLandmark: false,
      },
    ]

    renderTiles(ctx, descriptors, 16)

    expect(ctx.fillText).not.toHaveBeenCalled()
  })

  it('skips space char (" ")', () => {
    const ctx = createMockCtx()
    const descriptors: TileDescriptor[] = [
      {
        vx: 0, vy: 0, char: ' ', textColor: '#888', bgColor: '',
        isPlayer: false, isLandmark: false,
      },
    ]

    renderTiles(ctx, descriptors, 16)

    expect(ctx.fillText).not.toHaveBeenCalled()
  })

  it('skips empty and space but renders others in mixed list', () => {
    const ctx = createMockCtx()
    const descriptors: TileDescriptor[] = [
      {
        vx: 0, vy: 0, char: ' ', textColor: '#888', bgColor: '',
        isPlayer: false, isLandmark: false,
      },
      {
        vx: 1, vy: 0, char: '@', textColor: '#fff', bgColor: '#333',
        isPlayer: true, isLandmark: false,
      },
      {
        vx: 2, vy: 0, char: '', textColor: '#888', bgColor: '',
        isPlayer: false, isLandmark: false,
      },
      {
        vx: 3, vy: 0, char: '█', textColor: '#888', bgColor: '',
        isPlayer: false, isLandmark: false,
      },
    ]

    renderTiles(ctx, descriptors, 16)

    expect(ctx.fillText).toHaveBeenCalledTimes(2)
    expect(ctx.fillText).toHaveBeenCalledWith('@', 24, 8)
    expect(ctx.fillText).toHaveBeenCalledWith('█', 56, 8)
  })
})
