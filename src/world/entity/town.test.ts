import { describe, it, expect } from 'vitest'
import { townEntity } from './town'

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

describe('town entity', () => {
  it('exports a valid WorldEntity', () => {
    expect(townEntity.type).toBe('town')
    expect(townEntity.footprint).toEqual({ w: 1, h: 1 })
  })

  it('getDrawCommand returns correct bounds', () => {
    const { mask, explored } = makeMask([[5, 5]], [[5, 5]])
    const result = townEntity.getDrawCommand(5, 5, 0, 0, false, mask, explored)
    expect(result.bounds).toEqual({ vx: 5, vy: 5, vw: 1, vh: 1 })
  })

  it('getDrawCommand returns cell with char O', () => {
    const { mask, explored } = makeMask([[5, 5]], [[5, 5]])
    const result = townEntity.getDrawCommand(5, 5, 0, 0, false, mask, explored)
    expect(result.cells).toHaveLength(1)
    expect(result.cells[0]!.char).toBe('O')
  })

  it('getDrawCommand skips cell when neither visible nor explored', () => {
    const { mask, explored } = makeMask([], [])
    const result = townEntity.getDrawCommand(5, 5, 0, 0, false, mask, explored)
    expect(result.cells).toHaveLength(0)
  })

  it('onEnter returns setpiece.town', () => {
    expect(townEntity.onEnter).toBeDefined()
    const ctx = {} as any
    const result = townEntity.onEnter!(ctx)
    expect(result).toEqual({ eventId: 'setpiece.town' })
  })
})
