import { describe, it, expect } from 'vitest'
import { registerEntity, getEntity, getAllEntities } from './catalog'
import type { WorldEntity } from './types'

// ─── 辅助 ──────────────────────────────────────────────

function makeEntity(type: string, w = 1, h = 1): WorldEntity {
  return {
    type,
    footprint: { w, h },
    getDrawCommand: () => ({
      bounds: { vx: 0, vy: 0, vw: w, vh: h },
      cells: [],
    }),
  }
}

// ─── 测试套件 ──────────────────────────────────────────

describe('entity catalog', () => {
  it('registers and retrieves an entity', () => {
    const entity = makeEntity('testEntity')
    registerEntity(entity)
    expect(getEntity('testEntity')).toBe(entity)
  })

  it('returns undefined for unregistered type', () => {
    expect(getEntity('nonexistent')).toBeUndefined()
  })

  it('idempotent registration — same type does not overwrite', () => {
    const first = makeEntity('idempotent')
    const second = makeEntity('idempotent')
    registerEntity(first)
    registerEntity(second)

    // 幂等：第一次注册的应保留
    expect(getEntity('idempotent')).toBe(first)
    expect(getEntity('idempotent')).not.toBe(second)
  })

  it('getAllEntities returns at least 15 base entities', () => {
    const all = getAllEntities()
    const expectedTypes = [
      'village', 'ironMine', 'coalMine', 'sulphurMine',
      'house', 'cave', 'town', 'city', 'outpost', 'ship',
      'borehole', 'battlefield', 'swamp', 'cache', 'executioner',
    ]

    // At minimum the 15 base entities must be present
    expect(all.length).toBeGreaterThanOrEqual(expectedTypes.length)

    const types = new Set(all.map(e => e.type))
    for (const t of expectedTypes) {
      expect(types.has(t)).toBe(true)
    }
  })

  it('getEntity for known types returns a WorldEntity with correct footprint', () => {
    // Village is 3x3, city and ship are 2x2, rest are 1x1
    const village = getEntity('village')
    expect(village).toBeDefined()
    expect(village!.footprint).toEqual({ w: 3, h: 3 })

    const city = getEntity('city')
    expect(city).toBeDefined()
    expect(city!.footprint).toEqual({ w: 2, h: 2 })

    const ship = getEntity('ship')
    expect(ship).toBeDefined()
    expect(ship!.footprint).toEqual({ w: 2, h: 2 })

    const ironMine = getEntity('ironMine')
    expect(ironMine).toBeDefined()
    expect(ironMine!.footprint).toEqual({ w: 1, h: 1 })
  })
})
