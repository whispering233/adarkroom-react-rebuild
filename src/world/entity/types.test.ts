import { describe, it, expect } from 'vitest'
import type { WorldEntity, EntityCatalog } from './types'
import { buildEntityCellMap } from './types'
import type { PlacedEntity } from '../types'

// ─── 辅助函数 ─────────────────────────────────────────

function createMockEntity(type: string, w: number, h: number): WorldEntity {
  return {
    type,
    footprint: { w, h },
    getDrawCommand: () => ({
      bounds: { vx: 0, vy: 0, vw: w, vh: h },
      cells: [],
    }),
  }
}

function createCatalog(entities: WorldEntity[]): EntityCatalog {
  const cat: EntityCatalog = {}
  for (const e of entities) {
    cat[e.type] = e
  }
  return cat
}

// ─── 测试 ──────────────────────────────────────────────

describe('buildEntityCellMap', () => {
  it('builds 10 entries for village (3x3) + ironMine (1x1)', () => {
    const catalog = createCatalog([
      createMockEntity('village', 3, 3),
      createMockEntity('ironMine', 1, 1),
    ])
    const entityLayer: PlacedEntity[] = [
      { entityId: 'village', anchorX: 10, anchorY: 10 },
      { entityId: 'ironMine', anchorX: 5, anchorY: 5 },
    ]

    const result = buildEntityCellMap(entityLayer, catalog)
    expect(result.size).toBe(10)

    // Village 覆盖 (10,10) 到 (12,12) — 9 个键
    for (let dx = 0; dx < 3; dx++) {
      for (let dy = 0; dy < 3; dy++) {
        const key = `${10 + dx},${10 + dy}`
        const cell = result.get(key)
        expect(cell).toBeDefined()
        expect(cell!.entityId).toBe('village')
        expect(cell!.anchorX).toBe(10)
        expect(cell!.anchorY).toBe(10)
        expect(cell!.dx).toBe(dx)
        expect(cell!.dy).toBe(dy)
      }
    }

    // ironMine 占据 (5,5) — 1 个键
    const ironKey = '5,5'
    expect(result.get(ironKey)).toBeDefined()
    expect(result.get(ironKey)!.entityId).toBe('ironMine')
    expect(result.get(ironKey)!.anchorX).toBe(5)
    expect(result.get(ironKey)!.anchorY).toBe(5)
    expect(result.get(ironKey)!.dx).toBe(0)
    expect(result.get(ironKey)!.dy).toBe(0)
  })

  it('returns empty map for empty entity layer', () => {
    const result = buildEntityCellMap([], {})
    expect(result.size).toBe(0)
  })

  it('later entity overwrites overlapping cell (key collision behavior)', () => {
    const catalog = createCatalog([
      createMockEntity('a', 2, 1),
      createMockEntity('b', 1, 2),
    ])
    const entityLayer: PlacedEntity[] = [
      { entityId: 'a', anchorX: 5, anchorY: 5 }, // covers (5,5), (6,5)
      { entityId: 'b', anchorX: 6, anchorY: 5 }, // covers (6,5), (6,6) — (6,5) overlaps
    ]

    const result = buildEntityCellMap(entityLayer, catalog)

    // (6,5) should be entity b's cell (later entity overwrites)
    const key = '6,5'
    const cell = result.get(key)
    expect(cell).toBeDefined()
    expect(cell!.entityId).toBe('b')
    expect(cell!.anchorX).toBe(6)
    expect(cell!.anchorY).toBe(5)
    expect(cell!.dx).toBe(0)
    expect(cell!.dy).toBe(0)
  })

  it('skips entity not in catalog', () => {
    const catalog = createCatalog([
      createMockEntity('village', 1, 1),
    ])
    const entityLayer: PlacedEntity[] = [
      { entityId: 'village', anchorX: 0, anchorY: 0 },
      { entityId: 'unknown', anchorX: 1, anchorY: 1 },
    ]

    const result = buildEntityCellMap(entityLayer, catalog)
    expect(result.size).toBe(1)
    expect(result.has('0,0')).toBe(true)
    expect(result.has('1,1')).toBe(false)
  })

  it('key format is "x,y" (comma-separated, no spaces)', () => {
    const catalog = createCatalog([
      createMockEntity('test', 1, 1),
    ])
    const entityLayer: PlacedEntity[] = [
      { entityId: 'test', anchorX: 42, anchorY: 17 },
    ]

    const result = buildEntityCellMap(entityLayer, catalog)
    const key = result.keys().next().value as string
    expect(key).toBe('42,17')
    expect(key).not.toContain(' ')
  })
})
