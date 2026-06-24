import { describe, it, expect } from 'vitest'
import { ironMineEntity } from './ironMine'
import { makeMask } from './testHelpers'

describe('ironMine entity', () => {
  it('has 1x1 footprint', () => {
    expect(ironMineEntity.footprint).toEqual({ w: 1, h: 1 })
  })

  it('has type ironMine', () => {
    expect(ironMineEntity.type).toBe('ironMine')
  })

  describe('getDrawCommand', () => {
    it('returns 1 cell with output.char I', () => {
      const { mask, explored } = makeMask([[10, 10]], [[10, 10]])
      const cmd = ironMineEntity.getDrawCommand(10, 10, 0, 0, false, mask, explored)

      expect(cmd.cells).toHaveLength(1)
      expect(cmd.cells[0].output.char).toBe('I')
      expect(cmd.cells[0].vx).toBe(10)
      expect(cmd.cells[0].vy).toBe(10)
      expect(cmd.bounds).toEqual({ vx: 10, vy: 10, vw: 1, vh: 1 })
    })

    it('returns 0 cells when outside viewport', () => {
      const { mask, explored } = makeMask([], [])
      const cmd = ironMineEntity.getDrawCommand(-10, -10, 0, 0, false, mask, explored)

      expect(cmd.cells).toHaveLength(0)
    })

    it('returns 0 cells when not visible nor explored', () => {
      const { mask, explored } = makeMask([], [])
      const cmd = ironMineEntity.getDrawCommand(10, 10, 0, 0, false, mask, explored)

      expect(cmd.cells).toHaveLength(0)
    })

    it('renders explored-but-invisible cells', () => {
      const { mask, explored } = makeMask([[10, 10]], [])
      const cmd = ironMineEntity.getDrawCommand(10, 10, 0, 0, false, mask, explored)

      expect(cmd.cells).toHaveLength(1)
      expect(cmd.cells[0].output.char).toBe('I')
    })

    it('returns correct output.char when dimmed', () => {
      const { mask, explored } = makeMask([[10, 10]], [[10, 10]])
      const cmd = ironMineEntity.getDrawCommand(10, 10, 0, 0, true, mask, explored)

      expect(cmd.cells).toHaveLength(1)
      expect(cmd.cells[0].output.char).toBe('I')
    })
  })

  it('onEnter returns setpiece.ironMine eventId', () => {
    expect(ironMineEntity.onEnter).toBeDefined()
    const ctx = {} as any
    const result = ironMineEntity.onEnter!(ctx)
    expect(result).toEqual({ eventId: 'setpiece.ironMine' })
  })
})
