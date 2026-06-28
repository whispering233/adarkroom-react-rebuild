import { describe, it, expect } from 'vitest'
import { createUniformEntity, deriveEntity } from './factory'
import type { WorldEntity } from './types'
import { makeMask } from './testHelpers'

// ─── helpers ──────────────────────────────────────────────

function fullMask(size = 61): boolean[][] {
  return Array.from({ length: size }, () => Array(size).fill(true))
}

function fullExplored(size = 61): boolean[][] {
  return Array.from({ length: size }, () => Array(size).fill(true))
}

// ─── createUniformEntity ─────────────────────────────────

describe('createUniformEntity', () => {
  describe('1x1 basic', () => {
    const entity = createUniformEntity({ type: 'test', char: 'X' })

    it('has correct type', () => {
      expect(entity.type).toBe('test')
    })

    it('has 1x1 footprint', () => {
      expect(entity.footprint).toEqual({ w: 1, h: 1 })
    })
  })

  describe('getDrawCommand', () => {
    it('returns footprint.w * footprint.h cells', () => {
      const entity = createUniformEntity({ type: 'test', char: 'X', footprint: { w: 2, h: 3 } })
      const mask = fullMask()
      const explored = fullExplored()
      const cmd = entity.getDrawCommand(10, 10, 0, 0, false, mask, explored)
      expect(cmd.cells).toHaveLength(6)
    })

    it('all cells have output.char === configured char', () => {
      const entity = createUniformEntity({ type: 'test', char: '★', footprint: { w: 2, h: 2 } })
      const mask = fullMask()
      const explored = fullExplored()
      const cmd = entity.getDrawCommand(5, 5, 0, 0, false, mask, explored)
      for (const cell of cmd.cells) {
        expect(cell.output.char).toBe('★')
      }
    })

    it('default output.prominent === true, output.bold === true', () => {
      const entity = createUniformEntity({ type: 'test', char: 'X' })
      const mask = fullMask()
      const explored = fullExplored()
      const cmd = entity.getDrawCommand(10, 10, 0, 0, false, mask, explored)
      for (const cell of cmd.cells) {
        expect(cell.output.prominent).toBe(true)
        expect(cell.output.bold).toBe(true)
      }
    })

    it('returns 0 cells when neither visible nor explored', () => {
      const entity = createUniformEntity({ type: 'test', char: 'X' })
      const { mask, explored } = makeMask([], [])
      const cmd = entity.getDrawCommand(10, 10, 0, 0, false, mask, explored)
      expect(cmd.cells).toHaveLength(0)
    })

    it('includes cells that are explored but not visible (entity does not filter for dimmed)', () => {
      const entity = createUniformEntity({ type: 'test', char: 'X' })
      const { mask, explored } = makeMask([[10, 10]], [])
      const cmd = entity.getDrawCommand(10, 10, 0, 0, false, mask, explored)
      expect(cmd.cells).toHaveLength(1)
    })

    it('vx/vy are relative to viewportOrigin', () => {
      const entity = createUniformEntity({ type: 'test', char: 'X' })
      const mask = fullMask()
      const explored = fullExplored()
      const cmd = entity.getDrawCommand(15, 20, 10, 10, false, mask, explored)
      expect(cmd.cells[0].vx).toBe(5)
      expect(cmd.cells[0].vy).toBe(10)
    })

    it('multi-tile 2x2: 4 cells, coordinates cover (0,0)~(1,1)', () => {
      const entity = createUniformEntity({ type: 'test', char: 'X', footprint: { w: 2, h: 2 } })
      const mask = fullMask()
      const explored = fullExplored()
      const cmd = entity.getDrawCommand(0, 0, 0, 0, false, mask, explored)
      expect(cmd.cells).toHaveLength(4)

      const cellSet = new Set(cmd.cells.map(c => `${c.vx},${c.vy}`))
      expect(cellSet.has('0,0')).toBe(true)
      expect(cellSet.has('1,0')).toBe(true)
      expect(cellSet.has('0,1')).toBe(true)
      expect(cellSet.has('1,1')).toBe(true)
    })
  })

  describe('onEnter', () => {
    it('has onEnter when manually provided', () => {
      const manualOnEnter = () => ({ narrations: ['test'] })
      const entity = createUniformEntity({ type: 'test', char: 'X', onEnter: manualOnEnter })
      expect(entity.onEnter).toBe(manualOnEnter)
      const result = entity.onEnter!({} as any)
      expect(result).toEqual({ narrations: ['test'] })
    })

    it('has no onEnter when not provided', () => {
      const entity = createUniformEntity({ type: 'test', char: 'X' })
      expect(entity.onEnter).toBeUndefined()
    })
  })

  describe('output overrides', () => {
    it('prominent: false, bold: false overrides defaults', () => {
      const entity = createUniformEntity({ type: 'test', char: 'X', prominent: false, bold: false })
      const mask = fullMask()
      const explored = fullExplored()
      const cmd = entity.getDrawCommand(10, 10, 0, 0, false, mask, explored)
      for (const cell of cmd.cells) {
        expect(cell.output.prominent).toBe(false)
        expect(cell.output.bold).toBe(false)
      }
    })
  })
})

// ─── deriveEntity ────────────────────────────────────────

describe('deriveEntity', () => {
  const baseEntity = createUniformEntity({
    type: 'base', char: 'B', footprint: { w: 2, h: 2 },
  })

  it('derives new type from base entity', () => {
    const derived = deriveEntity(baseEntity, { type: 'derived' })
    expect(derived.type).toBe('derived')
  })

  it('preserves base getDrawCommand', () => {
    const derived = deriveEntity(baseEntity, { type: 'derived' })
    const mask = fullMask()
    const explored = fullExplored()
    const baseCmd = baseEntity.getDrawCommand(10, 10, 0, 0, false, mask, explored)
    const derivedCmd = derived.getDrawCommand(10, 10, 0, 0, false, mask, explored)
    expect(derivedCmd.cells).toEqual(baseCmd.cells)
    expect(derivedCmd.bounds).toEqual(baseCmd.bounds)
  })

  it('overrides onEnter', () => {
    const derivedOnEnter = () => ({ narrations: ['derived'] })
    const derived = deriveEntity(baseEntity, { type: 'derived', onEnter: derivedOnEnter })
    const result = derived.onEnter!({} as any)
    expect(result).toEqual({ narrations: ['derived'] })
  })

  it('overrides getDrawCommand entirely when provided', () => {
    const customGetDrawCommand: WorldEntity['getDrawCommand'] = () => ({
      bounds: { vx: 0, vy: 0, vw: 1, vh: 1 },
      cells: [{ vx: 0, vy: 0, output: { char: 'C', prominent: false, bold: false } }],
    })
    const derived = deriveEntity(baseEntity, { type: 'derived', getDrawCommand: customGetDrawCommand })
    const mask = fullMask()
    const explored = fullExplored()
    const cmd = derived.getDrawCommand(10, 10, 0, 0, false, mask, explored)
    expect(cmd.cells).toHaveLength(1)
    expect(cmd.cells[0].output.char).toBe('C')
    expect(cmd.bounds.vw).toBe(1)
  })

  it('footprint override updates property but getDrawCommand still captures base footprint', () => {
    const derived = deriveEntity(baseEntity, { type: 'derived', footprint: { w: 1, h: 1 } })
    expect(derived.footprint).toEqual({ w: 1, h: 1 })
    const mask = fullMask()
    const explored = fullExplored()
    const cmd = derived.getDrawCommand(5, 5, 0, 0, false, mask, explored)
    expect(cmd.cells).toHaveLength(4)
  })
})
