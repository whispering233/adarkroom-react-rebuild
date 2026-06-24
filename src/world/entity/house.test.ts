import { describe, it, expect } from 'vitest'
import { houseEntity } from './house'
import { makeMask } from './testHelpers'

describe('house entity', () => {
  it('has 1x1 footprint', () => {
    expect(houseEntity.footprint).toEqual({ w: 1, h: 1 })
  })

  it('has type house', () => {
    expect(houseEntity.type).toBe('house')
  })

  describe('getDrawCommand', () => {
    it('returns 1 cell with output.char H', () => {
      const { mask, explored } = makeMask([[10, 10]], [[10, 10]])
      const cmd = houseEntity.getDrawCommand(10, 10, 0, 0, false, mask, explored)

      expect(cmd.cells).toHaveLength(1)
      expect(cmd.cells[0].output.char).toBe('H')
      expect(cmd.cells[0].vx).toBe(10)
      expect(cmd.cells[0].vy).toBe(10)
      expect(cmd.bounds).toEqual({ vx: 10, vy: 10, vw: 1, vh: 1 })
    })

    it('returns 0 cells when outside viewport', () => {
      const { mask, explored } = makeMask([], [])
      const cmd = houseEntity.getDrawCommand(-10, -10, 0, 0, false, mask, explored)

      expect(cmd.cells).toHaveLength(0)
    })

    it('returns 0 cells when not visible nor explored', () => {
      const { mask, explored } = makeMask([], [])
      const cmd = houseEntity.getDrawCommand(10, 10, 0, 0, false, mask, explored)

      expect(cmd.cells).toHaveLength(0)
    })

    it('renders explored-but-invisible cells', () => {
      const { mask, explored } = makeMask([[10, 10]], [])
      const cmd = houseEntity.getDrawCommand(10, 10, 0, 0, false, mask, explored)

      expect(cmd.cells).toHaveLength(1)
      expect(cmd.cells[0].output.char).toBe('H')
    })
  })

  it('onEnter returns setpiece.house eventId', () => {
    expect(houseEntity.onEnter).toBeDefined()
    const ctx = {} as any
    const result = houseEntity.onEnter!(ctx)
    expect(result).toEqual({ eventId: 'setpiece.house' })
  })
})
