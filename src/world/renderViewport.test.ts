import { describe, it, expect } from 'vitest'
import { renderViewport, type ThemeColors } from './renderViewport'
import { TERRAINS, LANDMARKS } from './constants'
import type { MapTile, TerrainType, LandmarkType } from './types'

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

function createMask(size: number, visible: boolean): boolean[][] {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => visible),
  )
}

// ─── 测试套件 ──────────────────────────────────────────

describe('renderViewport', () => {
  it('returns (2*viewportSize+1)² tiles for centered position', () => {
    const mapSize = 61
    const viewportSize = 5
    const tiles = createMap(mapSize, createTile('field'))
    const mask = createMask(mapSize, true)
    const playerPos: [number, number] = [30, 30]

    const result = renderViewport(
      tiles, mask, playerPos, mapSize, viewportSize, defaultTheme,
    )
    // 11×11 = 121
    expect(result.length).toBe(121)
  })

  it('returns (2*viewportSize+1)² for viewportSize=0 (just player)', () => {
    const mapSize = 61
    const viewportSize = 0
    const tiles = createMap(mapSize, createTile('field'))
    const mask = createMask(mapSize, true)
    const playerPos: [number, number] = [30, 30]

    const result = renderViewport(
      tiles, mask, playerPos, mapSize, viewportSize, defaultTheme,
    )
    expect(result.length).toBe(1)
    expect(result[0].isPlayer).toBe(true)
    expect(result[0].worldX).toBe(30)
    expect(result[0].worldY).toBe(30)
  })

  it('clamps viewport at top-left map edge', () => {
    const mapSize = 10
    const viewportSize = 5
    const tiles = createMap(mapSize, createTile('field'))
    const mask = createMask(mapSize, true)
    const playerPos: [number, number] = [0, 0]

    const result = renderViewport(
      tiles, mask, playerPos, mapSize, viewportSize, defaultTheme,
    )
    // [0,0] ~ [5,5] = 6×6 = 36
    expect(result.length).toBe(36)

    // 确认 X 边界
    const xs = result.map(t => t.worldX)
    expect(Math.min(...xs)).toBe(0)
    expect(Math.max(...xs)).toBe(5)

    // 确认 Y 边界
    const ys = result.map(t => t.worldY)
    expect(Math.min(...ys)).toBe(0)
    expect(Math.max(...ys)).toBe(5)
  })

  it('clamps viewport at bottom-right map edge', () => {
    const mapSize = 10
    const viewportSize = 5
    const tiles = createMap(mapSize, createTile('field'))
    const mask = createMask(mapSize, true)
    const playerPos: [number, number] = [9, 9]

    const result = renderViewport(
      tiles, mask, playerPos, mapSize, viewportSize, defaultTheme,
    )
    // [4,4] ~ [9,9] = 6×6 = 36
    expect(result.length).toBe(36)

    const xs = result.map(t => t.worldX)
    expect(Math.min(...xs)).toBe(4)
    expect(Math.max(...xs)).toBe(9)

    const ys = result.map(t => t.worldY)
    expect(Math.min(...ys)).toBe(4)
    expect(Math.max(...ys)).toBe(9)
  })

  it('clamps viewport at left map edge (player at x=0)', () => {
    const mapSize = 10
    const viewportSize = 3
    const tiles = createMap(mapSize, createTile('field'))
    const mask = createMask(mapSize, true)
    const playerPos: [number, number] = [0, 5]

    const result = renderViewport(
      tiles, mask, playerPos, mapSize, viewportSize, defaultTheme,
    )
    // X: [0, 3] = 4 cols, Y: [2, 8] = 7 rows → 28
    expect(result.length).toBe(4 * 7)
  })

  it('renders player tile with @ and cellBg', () => {
    const mapSize = 10
    const viewportSize = 2
    const tiles = createMap(mapSize, createTile('field'))
    const mask = createMask(mapSize, true)
    const playerPos: [number, number] = [5, 5]

    const result = renderViewport(
      tiles, mask, playerPos, mapSize, viewportSize, defaultTheme,
    )
    const playerTile = result.find(t => t.isPlayer)
    expect(playerTile).toBeDefined()
    expect(playerTile!.char).toBe('@')
    expect(playerTile!.textColor).toBe(defaultTheme.textPrimary)
    expect(playerTile!.bgColor).toBe(defaultTheme.cellBg)
    expect(playerTile!.isLandmark).toBe(false)
    expect(playerTile!.worldX).toBe(5)
    expect(playerTile!.worldY).toBe(5)
  })

  it('renders masked tiles with space and theme bg color', () => {
    const mapSize = 10
    const viewportSize = 2
    const tiles = createMap(mapSize, createTile('field'))
    // 只有玩家位置可见，其余全被遮盖
    const mask = createMask(mapSize, false)
    const playerPos: [number, number] = [5, 5]
    mask[5][5] = true

    const result = renderViewport(
      tiles, mask, playerPos, mapSize, viewportSize, defaultTheme,
    )
    const playerTile = result.find(t => t.isPlayer)
    expect(playerTile).toBeDefined()
    expect(playerTile!.char).toBe('@')

    const maskedTiles = result.filter(t => !t.isPlayer)
    expect(maskedTiles.length).toBeGreaterThan(0)
    for (const t of maskedTiles) {
      expect(t.char).toBe(' ')
      expect(t.bgColor).toBe(defaultTheme.bg)
      expect(t.isLandmark).toBe(false)
      expect(t.isPlayer).toBe(false)
    }
  })

  it('renders landmark tiles with accent color and correct char', () => {
    const mapSize = 10
    const viewportSize = 3
    const tiles = createMap(mapSize, createTile('field', 'village'))
    const mask = createMask(mapSize, true)
    const playerPos: [number, number] = [5, 5]

    const result = renderViewport(
      tiles, mask, playerPos, mapSize, viewportSize, defaultTheme,
    )
    const landmarkTiles = result.filter(t => t.isLandmark)
    expect(landmarkTiles.length).toBeGreaterThan(0)
    for (const t of landmarkTiles) {
      expect(t.char).toBe('A') // LANDMARKS 中 village 的 char
      expect(t.textColor).toBe(defaultTheme.accent)
      expect(t.bgColor).toBe('')
      expect(t.landmarkType).toBe('village')
    }
  })

  it('renders terrain tiles with muted text color and transparent bg', () => {
    const mapSize = 10
    const viewportSize = 2
    const tiles = createMap(mapSize, createTile('forest'))
    const mask = createMask(mapSize, true)
    const playerPos: [number, number] = [5, 5]

    const result = renderViewport(
      tiles, mask, playerPos, mapSize, viewportSize, defaultTheme,
    )
    const terrainTiles = result.filter(t => !t.isPlayer && !t.isLandmark)
    expect(terrainTiles.length).toBeGreaterThan(0)
    for (const t of terrainTiles) {
      expect(t.char).toBe('▓') // TERRAINS 中 forest 的 char (Unicode block)
      expect(t.textColor).toBe(defaultTheme.textMuted)
      expect(t.bgColor).toBe('')
      expect(t.isLandmark).toBe(false)
    }
  })

  it('player on landmark shows @ (player takes precedence)', () => {
    const mapSize = 10
    const viewportSize = 1
    const tiles = createMap(mapSize, createTile('field', 'ironMine'))
    const mask = createMask(mapSize, true)
    const playerPos: [number, number] = [5, 5]

    const result = renderViewport(
      tiles, mask, playerPos, mapSize, viewportSize, defaultTheme,
    )
    const playerTile = result.find(t => t.worldX === 5 && t.worldY === 5)
    expect(playerTile).toBeDefined()
    expect(playerTile!.isPlayer).toBe(true)
    expect(playerTile!.isLandmark).toBe(false) // 玩家优先，不标记为地标
    expect(playerTile!.char).toBe('@')
  })

  it('tiles are ordered row by row (y-outer, x-inner)', () => {
    const mapSize = 10
    const viewportSize = 2
    const tiles = createMap(mapSize, createTile('field'))
    const mask = createMask(mapSize, true)
    const playerPos: [number, number] = [5, 5]

    const result = renderViewport(
      tiles, mask, playerPos, mapSize, viewportSize, defaultTheme,
    )
    for (let i = 1; i < result.length; i++) {
      const prev = result[i - 1]
      const curr = result[i]
      // 同一行从左到右，或下一行开始
      expect(
        curr.worldY > prev.worldY ||
        (curr.worldY === prev.worldY && curr.worldX > prev.worldX),
      ).toBe(true)
    }
  })

  it('renders all terrain types with correct chars from TERRAINS config', () => {
    const mapSize = 10
    const viewportSize = 2
    const playerPos: [number, number] = [5, 5]
    const mask = createMask(mapSize, true)

    const terrains: TerrainType[] = ['forest', 'field', 'barrens', 'road']
    for (const terrain of terrains) {
      const tiles = createMap(mapSize, createTile(terrain))
      const result = renderViewport(
        tiles, mask, playerPos, mapSize, viewportSize, defaultTheme,
      )
      const expectedChar = TERRAINS.find(td => td.type === terrain)!.char
      const sampleTile = result.find(t => !t.isPlayer && !t.isLandmark)
      expect(sampleTile!.char).toBe(expectedChar)
    }
  })

  it('renders all landmark types with correct chars from LANDMARKS config', () => {
    const mapSize = 20
    const viewportSize = 1
    const playerPos: [number, number] = [5, 5]
    const mask = createMask(mapSize, true)

    const landmarkTests: Array<{ type: LandmarkType; expected: string }> = [
      { type: 'village', expected: 'A' },
      { type: 'ironMine', expected: 'I' },
      { type: 'coalMine', expected: 'C' },
      { type: 'sulphurMine', expected: 'S' },
      { type: 'house', expected: 'H' },
      { type: 'cave', expected: 'V' },
      { type: 'town', expected: 'O' },
      { type: 'city', expected: 'Y' },
      { type: 'outpost', expected: 'P' },
      { type: 'ship', expected: 'W' },
      { type: 'borehole', expected: 'B' },
      { type: 'battlefield', expected: 'F' },
      { type: 'swamp', expected: 'M' },
      { type: 'cache', expected: 'U' },
      { type: 'executioner', expected: 'X' },
    ]

    for (const { type, expected } of landmarkTests) {
      const tiles = createMap(mapSize, createTile('field', type))
      const result = renderViewport(
        tiles, mask, playerPos, mapSize, viewportSize, defaultTheme,
      )
      const lmTile = result.find(t => t.isLandmark)
      expect(lmTile).toBeDefined()
      expect(lmTile!.char).toBe(expected)
      expect(lmTile!.landmarkType).toBe(type)
    }
  })

  it('uses TERRAINS constants for char lookup, not hardcoded', () => {
    // 验证 chars 从 TERRAINS 读取而非硬编码
    const mapSize = 5
    const viewportSize = 2
    const mask = createMask(mapSize, true)
    const playerPos: [number, number] = [2, 2]

    // 所有格初始为普通 barrens（无地标）
    const tiles = createMap(mapSize, createTile('barrens'))

    // 在特定位置放置不同地形/地标
    tiles[1][2] = createTile('field')        // (x=1, y=2) field
    tiles[2][3] = createTile('forest')       // (x=2, y=3) forest
    tiles[3][2] = createTile('barrens', 'cave') // (x=3, y=2) cave 地标
    tiles[3][3] = createTile('road')         // (x=3, y=3) road

    const result = renderViewport(
      tiles, mask, playerPos, mapSize, viewportSize, defaultTheme,
    )

    // barrens（默认填充）
    const barrensTile = result.find(t => t.worldX === 0 && t.worldY === 0)
    expect(barrensTile!.isLandmark).toBe(false)
    expect(barrensTile!.char).toBe(
      TERRAINS.find(td => td.type === 'barrens')!.char,
    )

    // field
    const fieldTile = result.find(t => t.worldX === 1 && t.worldY === 2)
    expect(fieldTile!.isLandmark).toBe(false)
    expect(fieldTile!.char).toBe(
      TERRAINS.find(td => td.type === 'field')!.char,
    )

    // forest
    const forestTile = result.find(t => t.worldX === 2 && t.worldY === 3)
    expect(forestTile!.isLandmark).toBe(false)
    expect(forestTile!.char).toBe(
      TERRAINS.find(td => td.type === 'forest')!.char,
    )

    // road
    const roadTile = result.find(t => t.worldX === 3 && t.worldY === 3)
    expect(roadTile!.isLandmark).toBe(false)
    expect(roadTile!.char).toBe(
      TERRAINS.find(td => td.type === 'road')!.char,
    )

    // cave landmark
    const caveTile = result.find(t => t.isLandmark)
    expect(caveTile).toBeDefined()
    expect(caveTile!.char).toBe(
      LANDMARKS.find(lm => lm.type === 'cave')!.char,
    )
    expect(caveTile!.worldX).toBe(3)
    expect(caveTile!.worldY).toBe(2)
  })

  it('does not mutate input arrays', () => {
    const mapSize = 10
    const viewportSize = 2
    const tiles = createMap(mapSize, createTile('field'))
    const mask = createMask(mapSize, true)
    const playerPos: [number, number] = [5, 5]

    // 深拷贝参考
    const originalTiles: MapTile[][] = tiles.map(row =>
      row.map(t => ({ ...t })),
    )
    const originalMask: boolean[][] = mask.map(row => [...row])

    renderViewport(tiles, mask, playerPos, mapSize, viewportSize, defaultTheme)

    expect(tiles).toEqual(originalTiles)
    expect(mask).toEqual(originalMask)
  })

  it('correctly handles mixed terrain in single viewport', () => {
    // 构建一个 3×3 地图，玩家在中心 (1,1)，各种地形混合
    const mapSize = 3
    const viewportSize = 1
    const mask = createMask(mapSize, true)

    // tiles[x][y] — x 为行（水平坐标），y 为列（垂直坐标）
    const tiles: MapTile[][] = [
      /* x=0 */[createTile('forest'),    createTile('field'),   createTile('barrens')],
      /* x=1 */[createTile('field'),     createTile('road'),    createTile('forest')],
      /* x=2 */[createTile('barrens'),   createTile('forest'),  createTile('field', 'house')],
    ]

    const playerPos: [number, number] = [1, 1] // road tile

    const result = renderViewport(
      tiles, mask, playerPos, mapSize, viewportSize, defaultTheme,
    )

    expect(result.length).toBe(9)

    // 玩家在 [1,1] -> tiles[1][1] = road
    const playerTile = result.find(t => t.isPlayer)!
    expect(playerTile.worldX).toBe(1)
    expect(playerTile.worldY).toBe(1)
    expect(playerTile.char).toBe('@')

    // 地标 house 在 [2,2] -> tiles[2][2]
    const houseTile = result.find(t => t.isLandmark)!
    expect(houseTile.worldX).toBe(2)
    expect(houseTile.worldY).toBe(2)
    expect(houseTile.char).toBe('H')
    expect(houseTile.landmarkType).toBe('house')

    // tiles[0][0] = forest 在 (x=0, y=0)
    const forestTileNW = result.find(
      t => t.worldX === 0 && t.worldY === 0,
    )
    expect(forestTileNW!.char).toBe(
      TERRAINS.find(td => td.type === 'forest')!.char,
    )

    // tiles[0][1] = field 在 (x=0, y=1)
    const fieldTileN = result.find(
      t => t.worldX === 0 && t.worldY === 1,
    )
    expect(fieldTileN!.char).toBe(
      TERRAINS.find(td => td.type === 'field')!.char,
    )

    // tiles[1][2] = forest 在 (x=1, y=2)
    const forestTileS = result.find(
      t => t.worldX === 1 && t.worldY === 2,
    )
    expect(forestTileS!.char).toBe(
      TERRAINS.find(td => td.type === 'forest')!.char,
    )
    expect(forestTileS!.textColor).toBe(defaultTheme.textMuted)
  })
})
