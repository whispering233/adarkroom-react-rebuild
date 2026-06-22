import { describe, it, expect } from 'vitest'
import { generateMap, lightMap, createNewMask } from './generator'
import { WORLD, TERRAINS, LANDMARKS } from './constants'
import type { MapDef, MapTile } from './types'

// ─── 辅助函数 ─────────────────────────────────────────

function createTestMapDef(overrides?: Partial<MapDef>): MapDef {
  return {
    id: 'test',
    size: WORLD.DEFAULT_MAP_RADIUS, // 30
    terrainTypes: TERRAINS.filter(t => t.weight > 0),
    landmarks: LANDMARKS,
    encounterPool: [],
    isAvailable: () => true,
    ...overrides,
  }
}

// ─── generateMap ─────────────────────────────────────

describe('generateMap', () => {
  it('返回 (size*2+1) x (size*2+1) 的 tiles 数组', () => {
    const mapDef = createTestMapDef()
    const { tiles } = generateMap(mapDef)
    const expectedSize = mapDef.size * 2 + 1 // 61
    expect(tiles.length).toBe(expectedSize)
    for (const row of tiles) {
      expect(row.length).toBe(expectedSize)
    }
  })

  it('中心格 terrain=forest, landmark=village', () => {
    const mapDef = createTestMapDef()
    const { tiles } = generateMap(mapDef)
    const center = tiles[mapDef.size][mapDef.size]
    expect(center.terrain).toBe('forest')
    expect(center.landmark).toBe('village')
  })

  it('所有格均有定义的 terrain 且为有效值', () => {
    const mapDef = createTestMapDef()
    const { tiles } = generateMap(mapDef)
    const validTerrains: readonly string[] = ['forest', 'field', 'barrens', 'road']
    for (let x = 0; x < tiles.length; x++) {
      for (let y = 0; y < tiles[x].length; y++) {
        expect(tiles[x][y]).toBeDefined()
        expect(validTerrains).toContain(tiles[x][y].terrain)
      }
    }
  })

  it('返回的 mask 与 tiles 尺寸相同', () => {
    const mapDef = createTestMapDef()
    const { mask, tiles } = generateMap(mapDef)
    expect(mask.length).toBe(tiles.length)
    for (let i = 0; i < mask.length; i++) {
      expect(mask[i].length).toBe(tiles[i].length)
    }
  })

  it('中心区域在 mask 中可见', () => {
    const mapDef = createTestMapDef()
    const { mask } = generateMap(mapDef)
    // 中心格可见
    expect(mask[mapDef.size][mapDef.size]).toBe(true)
    // LIGHT_RADIUS 范围内的格可见
    expect(mask[mapDef.size + WORLD.LIGHT_RADIUS][mapDef.size]).toBe(true)
    // 远角不可见
    expect(mask[0][0]).toBe(false)
  })

  // ─── T6: footprint 展开 + fillTerrain 保护 ─────────

  it('village 占据 3×3 footprint（9 个格子 landmark === village）', () => {
    const mapDef = createTestMapDef()
    const { tiles } = generateMap(mapDef)
    const s = mapDef.size
    // footprint 范围：anchor [s, s] → [s+2, s+2]
    for (let dx = 0; dx < 3; dx++) {
      for (let dy = 0; dy < 3; dy++) {
        expect(tiles[s + dx][s + dy].landmark).toBe('village')
        expect(tiles[s + dx][s + dy].terrain).toBe('forest')
      }
    }
  })

  it('fillTerrain 不覆盖 r=1 环上与 village footprint 重叠的 landmark 格', () => {
    const mapDef = createTestMapDef()
    const { tiles } = generateMap(mapDef)
    const s = mapDef.size
    // r=1 环与 3×3 footprint 重叠的格子：(31,30)、(30,31)、(31,31)
    expect(tiles[s + 1][s].landmark).toBe('village')
    expect(tiles[s][s + 1].landmark).toBe('village')
    expect(tiles[s + 1][s + 1].landmark).toBe('village')
  })

  it('village footprint 外的 r=1 环格子没有 village landmark', () => {
    const mapDef = createTestMapDef()
    const { tiles } = generateMap(mapDef)
    const s = mapDef.size
    // (30,29) 不在 3×3 footprint 范围内（footprint 覆盖 [s..s+2]×[s..s+2]）
    expect(tiles[s][s - 1].landmark).not.toBe('village')
  })
})

// ─── lightMap ─────────────────────────────────────────

describe('lightMap', () => {
  it('以菱形 (Manhattan 距离) 揭露指定半径内的格', () => {
    const size = 7
    const mask: boolean[][] = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => false),
    )
    const pos: [number, number] = [3, 3]
    const radius = 2

    lightMap(mask, pos, radius)

    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const dist = Math.abs(x - pos[0]) + Math.abs(y - pos[1])
        expect(mask[x][y]).toBe(dist <= radius)
      }
    }
  })

  it('边缘位置不会越界', () => {
    const size = 5
    const mask: boolean[][] = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => false),
    )
    const pos: [number, number] = [0, 0]
    const radius = 10 // 远超地图大小

    // 不应抛出异常
    expect(() => lightMap(mask, pos, radius)).not.toThrow()
    // 所有在界内的格应被揭露
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        expect(mask[x][y]).toBe(true)
      }
    }
  })

  it('不修改 tiles 数组', () => {
    const size = 5
    const mask: boolean[][] = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => false),
    )
    const tiles: MapTile[][] = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => ({ terrain: 'barrens' as const })),
    )
    // 深拷贝一份参考
    const original = tiles.map(row => row.map(t => ({ ...t })))

    lightMap(mask, [2, 2], 1)

    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        expect(tiles[x][y]).toEqual(original[x][y])
      }
    }
  })

  it('radius=0 仅揭露中心格', () => {
    const size = 5
    const mask: boolean[][] = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => false),
    )

    lightMap(mask, [2, 2], 0)

    expect(mask[2][2]).toBe(true)
    expect(mask[2][3]).toBe(false)
    expect(mask[3][2]).toBe(false)
    expect(mask[1][2]).toBe(false)
    expect(mask[2][1]).toBe(false)
  })
})

// ─── createNewMask ────────────────────────────────────

describe('createNewMask', () => {
  it('创建正确尺寸的 boolean[][]', () => {
    const size = 7

    const mask = createNewMask(size, [3, 3])

    expect(mask.length).toBe(size)
    for (const row of mask) {
      expect(row.length).toBe(size)
    }
    for (const row of mask) {
      for (const cell of row) {
        expect(typeof cell).toBe('boolean')
      }
    }
  })

  it('以给定位置为中心揭露初始视野（LIGHT_RADIUS 菱形）', () => {
    const size = 7
    const center: [number, number] = [3, 3]

    const mask = createNewMask(size, center)

    // 菱形半径 = WORLD.LIGHT_RADIUS
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const dist = Math.abs(x - center[0]) + Math.abs(y - center[1])
        expect(mask[x][y]).toBe(dist <= WORLD.LIGHT_RADIUS)
      }
    }
  })

  it('在地图边缘也能正常工作', () => {
    const size = 5
    const center: [number, number] = [0, 0]

    const mask = createNewMask(size, center)

    // 角落在界内的可见
    expect(mask[0][0]).toBe(true)
    expect(mask[WORLD.LIGHT_RADIUS][0]).toBe(true)
    // 远角不可见
    expect(mask[size - 1][size - 1]).toBe(false)
  })
})
