import { describe, it, expect } from 'vitest'
import { cityEntity } from './city'

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

describe('city entity (multi-tile 2×2)', () => {
  it('exports a valid WorldEntity', () => {
    expect(cityEntity.type).toBe('city')
    expect(cityEntity.footprint).toEqual({ w: 2, h: 2 })
  })

  it('getDrawCommand returns correct bounds', () => {
    const { mask, explored } = makeMask(
      [[10, 10], [11, 10], [10, 11], [11, 11]],
      [[10, 10], [11, 10], [10, 11], [11, 11]],
    )
    const result = cityEntity.getDrawCommand(10, 10, 0, 0, false, mask, explored)
    expect(result.bounds).toEqual({ vx: 10, vy: 10, vw: 2, vh: 2 })
  })

  it('getDrawCommand returns 4 cells when all footprint tiles are visible', () => {
    const { mask, explored } = makeMask(
      [[5, 5], [6, 5], [5, 6], [6, 6]],
      [[5, 5], [6, 5], [5, 6], [6, 6]],
    )
    const result = cityEntity.getDrawCommand(5, 5, 0, 0, false, mask, explored)
    expect(result.cells).toHaveLength(4)
  })

  it('all footprint cells render with same char Y', () => {
    const { mask, explored } = makeMask(
      [[5, 5], [6, 5], [5, 6], [6, 6]],
      [[5, 5], [6, 5], [5, 6], [6, 6]],
    )
    const result = cityEntity.getDrawCommand(5, 5, 0, 0, false, mask, explored)
    for (const cell of result.cells) {
      expect(cell.char).toBe('Y')
    }
  })

  it('getDrawCommand returns fewer cells when some tiles are not visible nor explored', () => {
    // Only (5,5) and (6,5) are visible/explored
    const { mask, explored } = makeMask(
      [[5, 5], [6, 5]],
      [[5, 5], [6, 5]],
    )
    const result = cityEntity.getDrawCommand(5, 5, 0, 0, false, mask, explored)
    expect(result.cells).toHaveLength(2)
  })

  it('getDrawCommand returns 0 cells when no tiles are visible or explored', () => {
    const { mask, explored } = makeMask([], [])
    const result = cityEntity.getDrawCommand(5, 5, 0, 0, false, mask, explored)
    expect(result.cells).toHaveLength(0)
  })

  it('getDrawCommand computes viewport-relative coordinates for each cell', () => {
    const { mask, explored } = makeMask(
      [[10, 10], [11, 10], [10, 11], [11, 11]],
      [[10, 10], [11, 10], [10, 11], [11, 11]],
    )
    const result = cityEntity.getDrawCommand(10, 10, 2, 3, false, mask, explored)
    const vxSet = new Set(result.cells.map(c => c.vx))
    const vySet = new Set(result.cells.map(c => c.vy))
    expect(vxSet).toEqual(new Set([8, 9])) // 10-2, 11-2
    expect(vySet).toEqual(new Set([7, 8])) // 10-3, 11-3
  })

  it('onEnter returns setpiece.city', () => {
    expect(cityEntity.onEnter).toBeDefined()
    const ctx = {} as any
    const result = cityEntity.onEnter!(ctx)
    expect(result).toEqual({ eventId: 'setpiece.city' })
  })
})
