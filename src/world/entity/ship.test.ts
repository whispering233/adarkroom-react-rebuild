import { describe, it, expect } from 'vitest'
import { makeMask } from './testHelpers'
import { shipEntity } from './ship'

// ─── 测试 ──────────────────────────────────────────────

describe('ship entity (multi-tile 2×2)', () => {
  it('exports a valid WorldEntity', () => {
    expect(shipEntity.type).toBe('ship')
    expect(shipEntity.footprint).toEqual({ w: 2, h: 2 })
  })

  it('getDrawCommand returns correct bounds', () => {
    const { mask, explored } = makeMask(
      [[15, 20], [16, 20], [15, 21], [16, 21]],
      [[15, 20], [16, 20], [15, 21], [16, 21]],
    )
    const result = shipEntity.getDrawCommand(15, 20, 0, 0, false, mask, explored)
    expect(result.bounds).toEqual({ vx: 15, vy: 20, vw: 2, vh: 2 })
  })

  it('getDrawCommand returns 4 cells when all footprint tiles are visible', () => {
    const { mask, explored } = makeMask(
      [[0, 0], [1, 0], [0, 1], [1, 1]],
      [[0, 0], [1, 0], [0, 1], [1, 1]],
    )
    const result = shipEntity.getDrawCommand(0, 0, 0, 0, false, mask, explored)
    expect(result.cells).toHaveLength(4)
  })

  it('all footprint cells render with same char W', () => {
    const { mask, explored } = makeMask(
      [[0, 0], [1, 0], [0, 1], [1, 1]],
      [[0, 0], [1, 0], [0, 1], [1, 1]],
    )
    const result = shipEntity.getDrawCommand(0, 0, 0, 0, false, mask, explored)
    for (const cell of result.cells) {
      expect(cell.output.char).toBe('W')
    }
  })

  it('getDrawCommand returns fewer cells when some tiles are not visible nor explored', () => {
    // Only (5,5) and (6,5) are visible/explored
    const { mask, explored } = makeMask(
      [[5, 5], [6, 5]],
      [[5, 5], [6, 5]],
    )
    const result = shipEntity.getDrawCommand(5, 5, 0, 0, false, mask, explored)
    expect(result.cells).toHaveLength(2)
  })

  it('getDrawCommand returns 0 cells when no tiles are visible or explored', () => {
    const { mask, explored } = makeMask([], [])
    const result = shipEntity.getDrawCommand(5, 5, 0, 0, false, mask, explored)
    expect(result.cells).toHaveLength(0)
  })

  it('getDrawCommand computes viewport-relative coordinates for each cell', () => {
    const { mask, explored } = makeMask(
      [[10, 10], [11, 10], [10, 11], [11, 11]],
      [[10, 10], [11, 10], [10, 11], [11, 11]],
    )
    const result = shipEntity.getDrawCommand(10, 10, 2, 3, false, mask, explored)
    const vxSet = new Set(result.cells.map(c => c.vx))
    const vySet = new Set(result.cells.map(c => c.vy))
    expect(vxSet).toEqual(new Set([8, 9]))
    expect(vySet).toEqual(new Set([7, 8]))
  })

  it('onEnter returns setpiece.ship', () => {
    expect(shipEntity.onEnter).toBeDefined()
    const ctx = {} as any
    const result = shipEntity.onEnter!(ctx)
    expect(result).toEqual({ eventId: 'setpiece.ship' })
  })
})
