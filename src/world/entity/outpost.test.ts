import { describe, it, expect } from 'vitest'
import { makeMask } from './testHelpers'
import { outpostEntity } from './outpost'

// ─── 测试 ──────────────────────────────────────────────

describe('outpost entity', () => {
  it('exports a valid WorldEntity', () => {
    expect(outpostEntity.type).toBe('outpost')
    expect(outpostEntity.footprint).toEqual({ w: 1, h: 1 })
  })

  it('getDrawCommand returns cell with char P', () => {
    const { mask, explored } = makeMask([[3, 7]], [[3, 7]])
    const result = outpostEntity.getDrawCommand(3, 7, 0, 0, false, mask, explored)
    expect(result.cells).toHaveLength(1)
    expect(result.cells[0]!.output.char).toBe('P')
  })

  it('getDrawCommand skips cell when neither visible nor explored', () => {
    const { mask, explored } = makeMask([], [])
    const result = outpostEntity.getDrawCommand(3, 7, 0, 0, false, mask, explored)
    expect(result.cells).toHaveLength(0)
  })

  it('onEnter returns setpiece.outpost eventId with clearOutpost flag', () => {
    expect(outpostEntity.onEnter).toBeDefined()
    const ctx = {} as any
    const result = outpostEntity.onEnter!(ctx)
    expect(result).toEqual({ eventId: 'setpiece.outpost', clearOutpost: true })
  })
})
