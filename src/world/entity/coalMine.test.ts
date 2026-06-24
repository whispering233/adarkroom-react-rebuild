import { describe, it, expect } from 'vitest'
import { coalMineEntity } from './coalMine'
import { makeMask } from './testHelpers'

describe('coalMine entity', () => {
  it('has 1x1 footprint', () => {
    expect(coalMineEntity.footprint).toEqual({ w: 1, h: 1 })
  })

  it('has type coalMine', () => {
    expect(coalMineEntity.type).toBe('coalMine')
  })

  describe('getDrawCommand', () => {
    it('returns 1 cell with output.char C', () => {
      const { mask, explored } = makeMask([[10, 10]], [[10, 10]])
      const cmd = coalMineEntity.getDrawCommand(10, 10, 0, 0, false, mask, explored)

      expect(cmd.cells).toHaveLength(1)
      expect(cmd.cells[0].output.char).toBe('C')
      expect(cmd.cells[0].vx).toBe(10)
      expect(cmd.cells[0].vy).toBe(10)
      expect(cmd.bounds).toEqual({ vx: 10, vy: 10, vw: 1, vh: 1 })
    })

    it('returns 0 cells when outside viewport', () => {
      const { mask, explored } = makeMask([], [])
      const cmd = coalMineEntity.getDrawCommand(-10, -10, 0, 0, false, mask, explored)

      expect(cmd.cells).toHaveLength(0)
    })

    it('returns 0 cells when not visible nor explored', () => {
      const { mask, explored } = makeMask([], [])
      const cmd = coalMineEntity.getDrawCommand(10, 10, 0, 0, false, mask, explored)

      expect(cmd.cells).toHaveLength(0)
    })

    it('renders explored-but-invisible cells', () => {
      const { mask, explored } = makeMask([[10, 10]], [])
      const cmd = coalMineEntity.getDrawCommand(10, 10, 0, 0, false, mask, explored)

      expect(cmd.cells).toHaveLength(1)
      expect(cmd.cells[0].output.char).toBe('C')
    })
  })

  it('onEnter returns setpiece.coalMine eventId', () => {
    expect(coalMineEntity.onEnter).toBeDefined()
    const ctx = {} as any
    const result = coalMineEntity.onEnter!(ctx)
    expect(result).toEqual({ eventId: 'setpiece.coalMine' })
  })
})
