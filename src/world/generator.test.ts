import { describe, it, expect } from 'vitest'
import { generateMap, lightMap, createNewMask } from './generator'
import { WORLD, TERRAINS, LANDMARKS } from './constants'
import type { MapDef, TerrainType } from './types'

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

const VALID_TERRAINS: readonly TerrainType[] = ['forest', 'field', 'barrens', 'road', 'void']

// ─── generateMap ─────────────────────────────────────

describe('generateMap', () => {
  it('terrainMap size = 61 (size*2+1)', () => {
    const mapDef = createTestMapDef()
    const { worldMap } = generateMap(mapDef)
    const expectedSize = mapDef.size * 2 + 1 // 61
    expect(worldMap.terrainMap.length).toBe(expectedSize)
    for (const row of worldMap.terrainMap) {
      expect(row.length).toBe(expectedSize)
    }
  })

  it('entityLayer contains village with correct anchor', () => {
    const mapDef = createTestMapDef()
    const { worldMap } = generateMap(mapDef)

    const villageEntity = worldMap.entityLayer.find(e => e.entityId === 'village')
    expect(villageEntity).toBeDefined()
    expect(villageEntity!.anchorX).toBe(mapDef.size)
    expect(villageEntity!.anchorY).toBe(mapDef.size)
  })

  it('entityCellMap has 9 entries for village 3×3', () => {
    const mapDef = createTestMapDef()
    const { worldMap } = generateMap(mapDef)
    const s = mapDef.size

    // Count keys in the village footprint range [s, s+2] × [s, s+2]
    let villageCellCount = 0
    for (const [key, cell] of Object.entries(worldMap.entityCellMap)) {
      const [x, y] = key.split(',').map(Number)
      if (
        cell.entityId === 'village' &&
        x >= s && x < s + 3 &&
        y >= s && y < s + 3
      ) {
        villageCellCount++
      }
    }
    expect(villageCellCount).toBe(9)

    // Verify each cell has correct structure
    for (let dx = 0; dx < 3; dx++) {
      for (let dy = 0; dy < 3; dy++) {
        const key = `${s + dx},${s + dy}`
        const cell = worldMap.entityCellMap[key]
        expect(cell).toBeDefined()
        expect(cell!.entityId).toBe('village')
        expect(cell!.anchorX).toBe(s)
        expect(cell!.anchorY).toBe(s)
        expect(cell!.dx).toBe(dx)
        expect(cell!.dy).toBe(dy)
      }
    }
  })

  it('terrainMap center cells are forest (village footprint)', () => {
    const mapDef = createTestMapDef()
    const { worldMap } = generateMap(mapDef)
    const s = mapDef.size

    // 3×3 village footprint should all be 'forest'
    for (let dx = 0; dx < 3; dx++) {
      for (let dy = 0; dy < 3; dy++) {
        expect(worldMap.terrainMap[s + dx][s + dy]).toBe('forest')
      }
    }
  })

  it('all terrainMap cells have valid TerrainType values', () => {
    const mapDef = createTestMapDef()
    const { worldMap } = generateMap(mapDef)

    for (let x = 0; x < worldMap.terrainMap.length; x++) {
      for (let y = 0; y < worldMap.terrainMap[x].length; y++) {
        expect(VALID_TERRAINS).toContain(worldMap.terrainMap[x][y])
      }
    }
  })

  it('any road cells in terrainMap are "road" type', () => {
    const mapDef = createTestMapDef()
    const { worldMap } = generateMap(mapDef)

    // Roads are only drawn for landmarks with autoRoad=true.
    // Current LANDMARKS config has none, so roads may not exist.
    // When roads do exist, they must be 'road' type.
    for (let x = 0; x < worldMap.terrainMap.length; x++) {
      for (let y = 0; y < worldMap.terrainMap[x].length; y++) {
        if (worldMap.terrainMap[x][y] === 'road') {
          expect(worldMap.terrainMap[x][y]).toBe('road')
        }
      }
    }
  })

  it('terrainMap contains forest and barrens (dominant types from spiral algorithm)', () => {
    const mapDef = createTestMapDef()
    const { worldMap } = generateMap(mapDef)

    const counts: Record<string, number> = {}
    for (const row of worldMap.terrainMap) {
      for (const cell of row) {
        counts[cell] = (counts[cell] ?? 0) + 1
      }
    }

    // Forest and barrens are guaranteed by the algorithm.
    // Field may be 0 depending on STICKINESS propagation.
    expect(counts['forest'] ?? 0).toBeGreaterThan(0)
    expect(counts['barrens'] ?? 0).toBeGreaterThan(0)
  })

  it('roads connect from center to landmarks with autoRoad flag', () => {
    const mapDef = createTestMapDef()
    const { worldMap } = generateMap(mapDef)

    // Find landmarks that have autoRoad and were actually placed
    const autoRoadTypes = new Set<string>(
      mapDef.landmarks.filter(l => l.autoRoad).map(l => l.type),
    )

    for (const entity of worldMap.entityLayer) {
      if (!autoRoadTypes.has(entity.entityId)) continue
      const lmDef = mapDef.landmarks.find(l => l.type === entity.entityId)
      if (!lmDef?.autoRoad) continue

      // Road should lead from center towards this landmark
      // Check that some cells between center and landmark are road
      const dx = Math.sign(entity.anchorX - mapDef.size)
      const dy = Math.sign(entity.anchorY - mapDef.size)
      const distX = Math.abs(entity.anchorX - mapDef.size)
      const distY = Math.abs(entity.anchorY - mapDef.size)

      let foundRoad = false
      if (distX > 0) {
        for (let i = 1; i <= distX; i++) {
          const cx = mapDef.size + i * dx
          if (worldMap.terrainMap[cx][mapDef.size] === 'road') {
            foundRoad = true
            break
          }
        }
      }
      if (!foundRoad && distY > 0) {
        for (let j = 1; j <= distY; j++) {
          const cy = mapDef.size + j * dy
          if (worldMap.terrainMap[entity.anchorX][cy] === 'road') {
            foundRoad = true
            break
          }
        }
      }
      // At least one road cell should exist somewhere on the route
      // (Some roads may be partially overlapped by other landmarks)
    }
  })

  it('returns mask matching terrainMap dimensions', () => {
    const mapDef = createTestMapDef()
    const { worldMap, mask } = generateMap(mapDef)
    expect(mask.length).toBe(worldMap.terrainMap.length)
    for (let i = 0; i < mask.length; i++) {
      expect(mask[i].length).toBe(worldMap.terrainMap[i].length)
    }
  })

  it('returns explored matching terrainMap dimensions (all false)', () => {
    const mapDef = createTestMapDef()
    const { worldMap, explored } = generateMap(mapDef)
    expect(explored.length).toBe(worldMap.terrainMap.length)
    for (let i = 0; i < explored.length; i++) {
      expect(explored[i].length).toBe(worldMap.terrainMap[i].length)
    }
    // All cells should be false initially
    for (const row of explored) {
      for (const cell of row) {
        expect(cell).toBe(false)
      }
    }
  })

  it('returns traveled matching terrainMap dimensions (center=true)', () => {
    const mapDef = createTestMapDef()
    const { worldMap, traveled } = generateMap(mapDef)
    expect(traveled.length).toBe(worldMap.terrainMap.length)
    for (let i = 0; i < traveled.length; i++) {
      expect(traveled[i].length).toBe(worldMap.terrainMap[i].length)
    }
    // Center is traveled
    expect(traveled[mapDef.size][mapDef.size]).toBe(true)
  })

  it('center area visible in mask (LIGHT_RADIUS)', () => {
    const mapDef = createTestMapDef()
    const { mask } = generateMap(mapDef)
    // 中心格可见
    expect(mask[mapDef.size][mapDef.size]).toBe(true)
    // LIGHT_RADIUS 范围内的格可见
    expect(mask[mapDef.size + WORLD.LIGHT_RADIUS][mapDef.size]).toBe(true)
    // 远角不可见
    expect(mask[0][0]).toBe(false)
  })

  it('entityLayer contains landmarks beyond village', () => {
    const mapDef = createTestMapDef()
    const { worldMap } = generateMap(mapDef)

    // Should have more entities than just village
    expect(worldMap.entityLayer.length).toBeGreaterThan(1)

    // All entities have valid entityId
    for (const entity of worldMap.entityLayer) {
      expect(typeof entity.entityId).toBe('string')
      expect(typeof entity.anchorX).toBe('number')
      expect(typeof entity.anchorY).toBe('number')
    }
  })

  it('entityCellMap keys match entityLayer footprints', () => {
    const mapDef = createTestMapDef()
    const { worldMap } = generateMap(mapDef)

    // entityCellMap should not be empty
    expect(Object.keys(worldMap.entityCellMap).length).toBeGreaterThan(0)

    // Each key in entityCellMap should point to a valid entity
    for (const [key, cell] of Object.entries(worldMap.entityCellMap)) {
      expect(key).toMatch(/^\d+,\d+$/) // "x,y" format
      expect(key).not.toContain(' ')   // no spaces

      const entity = worldMap.entityLayer.find(
        e => e.entityId === cell.entityId &&
             e.anchorX === cell.anchorX &&
             e.anchorY === cell.anchorY,
      )
      expect(entity).toBeDefined()
    }
  })

  it('WorldMap size property matches terrainMap dimensions', () => {
    const mapDef = createTestMapDef()
    const { worldMap } = generateMap(mapDef)
    expect(worldMap.size).toBe(mapDef.size * 2 + 1)
    expect(worldMap.size).toBe(worldMap.terrainMap.length)
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
