import { describe, it, expect } from 'vitest'
import { makeMask } from './testHelpers'
import { caveEntity } from './cave'

// ─── 测试 ──────────────────────────────────────────────

describe('cave entity', () => {
  it('exports a valid WorldEntity', () => {
    expect(caveEntity).toBeDefined()
    expect(caveEntity.type).toBe('cave')
    expect(caveEntity.footprint).toEqual({ w: 1, h: 1 })
  })

  it('getDrawCommand returns correct bounds', () => {
    const { mask, explored } = makeMask([[5, 5]], [[5, 5]])
    const result = caveEntity.getDrawCommand(5, 5, 0, 0, false, mask, explored)
    expect(result.bounds).toEqual({ vx: 5, vy: 5, vw: 1, vh: 1 })
  })

  it('getDrawCommand returns cell for visible footprint cell', () => {
    const { mask, explored } = makeMask([[5, 5]], [[5, 5]])
    const result = caveEntity.getDrawCommand(5, 5, 0, 0, false, mask, explored)
    expect(result.cells).toHaveLength(1)
    expect(result.cells[0]!.output.char).toBe('V')
    expect(result.cells[0]!.vx).toBe(5)
    expect(result.cells[0]!.vy).toBe(5)
  })

  it('getDrawCommand skips cell when neither visible nor explored', () => {
    const { mask, explored } = makeMask([], [])
    const result = caveEntity.getDrawCommand(5, 5, 0, 0, false, mask, explored)
    expect(result.cells).toHaveLength(0)
  })

  it('getDrawCommand computes viewport-relative coordinates', () => {
    const { mask, explored } = makeMask([[10, 10]], [[10, 10]])
    const result = caveEntity.getDrawCommand(10, 10, 3, 7, false, mask, explored)
    expect(result.cells[0]!.vx).toBe(7) // 10 - 3
    expect(result.cells[0]!.vy).toBe(3) // 10 - 7
  })

  it('onEnter returns setpiece.cave eventId', () => {
    expect(caveEntity.onEnter).toBeDefined()
    const ctx = {} as any
    const result = caveEntity.onEnter!(ctx)
    expect(result).toEqual({ eventId: 'setpiece.cave' })
  })
})
