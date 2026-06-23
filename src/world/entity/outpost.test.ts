import { describe, it, expect } from 'vitest'
import { outpostEntity } from './outpost'

// ─── 辅助 ──────────────────────────────────────────────

function makeMask(exploredPositions: Array<[number, number]>, visiblePositions: Array<[number, number]>): { mask: boolean[][]; explored: boolean[][] } {
  const mask: boolean[][] = []
  const explored: boolean[][] = []
  for (const [x, y] of exploredPositions) {
    explored[x] ??= []
    explored[x][y] = true
  }
  for (const [x, y] of visiblePositions) {
    mask[x] ??= []
    mask[x][y] = true
  }
  return { mask, explored }
}

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
    expect(result.cells[0]!.char).toBe('P')
  })

  it('getDrawCommand skips cell when neither visible nor explored', () => {
    const { mask, explored } = makeMask([], [])
    const result = outpostEntity.getDrawCommand(3, 7, 0, 0, false, mask, explored)
    expect(result.cells).toHaveLength(0)
  })

  it('onEnter returns setpiece.outpost', () => {
    expect(outpostEntity.onEnter).toBeDefined()
    const ctx = {} as any
    const result = outpostEntity.onEnter!(ctx)
    expect(result).toEqual({ eventId: 'setpiece.outpost' })
  })
})
