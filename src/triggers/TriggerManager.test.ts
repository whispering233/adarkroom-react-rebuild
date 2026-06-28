import { describe, it, expect } from 'vitest'
import { createTriggerState, check } from './TriggerManager'
import type { TriggerConfig } from './TriggerManager'

const defaultConfig: TriggerConfig = {}

const repeatableConfig: TriggerConfig = { repeatable: true }

const villageCell = { entityId: 'village' }

const entityCellMap: Record<string, { entityId: string }> = {
  '10,10': villageCell,
  '10,11': villageCell,
  '11,10': villageCell,
  '11,11': villageCell,
  '5,5': { entityId: 'ironMine' },
}

describe('createTriggerState', () => {
  it('returns state with null prevPos', () => {
    const state = createTriggerState()
    expect(state).toEqual({ prevPos: null })
  })
})

describe('check', () => {
  // ─── Enter ──────────────────────────────────────────

  it('Enter: pos enters trigger zone, prevPos outside → returns Enter', () => {
    const result = check([10, 10], [0, 0], entityCellMap, defaultConfig)
    expect(result).toEqual({ phase: 'enter', entityType: 'village' })
  })

  it('Enter: prevPos is null (first frame) → returns Enter', () => {
    const result = check([5, 5], null, entityCellMap, defaultConfig)
    expect(result).toEqual({ phase: 'enter', entityType: 'ironMine' })
  })

  it('Enter: different entity → returns correct entityType', () => {
    const result = check([5, 5], [0, 0], entityCellMap, defaultConfig)
    expect(result).toEqual({ phase: 'enter', entityType: 'ironMine' })
  })

  // ─── Stay (non-repeatable) ──────────────────────────

  it('Stay: both pos and prevPos inside same zone → returns null (no repeatable)', () => {
    const result = check([10, 10], [10, 10], entityCellMap, defaultConfig)
    expect(result).toBeNull()
  })

  it('Stay: moved within entity footprint → returns null (no repeatable)', () => {
    const result = check([11, 10], [10, 10], entityCellMap, defaultConfig)
    expect(result).toBeNull()
  })

  // ─── Stay (repeatable) ──────────────────────────────

  it('Stay: repeatable config → returns Stay with entityType', () => {
    const result = check([10, 10], [10, 10], entityCellMap, repeatableConfig)
    expect(result).toEqual({ phase: 'stay', entityType: 'village' })
  })

  it('Stay: moved within entity, repeatable → returns Stay', () => {
    const result = check([11, 10], [10, 10], entityCellMap, repeatableConfig)
    expect(result).toEqual({ phase: 'stay', entityType: 'village' })
  })

  // ─── Exit (non-repeatable) ──────────────────────────

  it('Exit: pos moves out of zone → returns null (no repeatable)', () => {
    const result = check([0, 0], [10, 10], entityCellMap, defaultConfig)
    expect(result).toBeNull()
  })

  // ─── Exit (repeatable) ──────────────────────────────

  it('Exit: repeatable config → returns Exit with entityType', () => {
    const result = check([0, 0], [11, 11], entityCellMap, repeatableConfig)
    expect(result).toEqual({ phase: 'exit', entityType: 'village' })
  })

  it('Exit: different entity types → returns correct entityType', () => {
    const result = check([0, 0], [5, 5], entityCellMap, repeatableConfig)
    expect(result).toEqual({ phase: 'exit', entityType: 'ironMine' })
  })

  // ─── No trigger ─────────────────────────────────────

  it('No trigger: both pos and prevPos outside → null', () => {
    const result = check([0, 0], [1, 1], entityCellMap, defaultConfig)
    expect(result).toBeNull()
  })

  it('No trigger: both outside, repeatable → still null', () => {
    const result = check([0, 0], [1, 1], entityCellMap, repeatableConfig)
    expect(result).toBeNull()
  })
})
