import { describe, it, expect } from 'vitest'
import { coalMineEntity } from './coalMine'
import type { EntityTriggerContext } from '../types'

const WORLD_SIZE = 61

function fullMask(): boolean[][] {
  return Array.from({ length: WORLD_SIZE }, () => Array(WORLD_SIZE).fill(true))
}

function fullExplored(): boolean[][] {
  return Array.from({ length: WORLD_SIZE }, () => Array(WORLD_SIZE).fill(true))
}

function emptyMask(): boolean[][] {
  return Array.from({ length: WORLD_SIZE }, () => Array(WORLD_SIZE).fill(false))
}

describe('coalMine entity', () => {
  it('has 1x1 footprint', () => {
    expect(coalMineEntity.footprint).toEqual({ w: 1, h: 1 })
  })

  it('has type coalMine', () => {
    expect(coalMineEntity.type).toBe('coalMine')
  })

  describe('getDrawCommand', () => {
    it('returns 1 cell with char C', () => {
      const mask = fullMask()
      const explored = fullExplored()
      const cmd = coalMineEntity.getDrawCommand(10, 10, 0, 0, false, mask, explored)

      expect(cmd.cells).toHaveLength(1)
      expect(cmd.cells[0].char).toBe('C')
      expect(cmd.cells[0].vx).toBe(10)
      expect(cmd.cells[0].vy).toBe(10)
      expect(cmd.bounds).toEqual({ vx: 10, vy: 10, vw: 1, vh: 1 })
    })

    it('returns 0 cells when outside viewport', () => {
      const mask = fullMask()
      const explored = fullExplored()
      const cmd = coalMineEntity.getDrawCommand(-10, -10, 0, 0, false, mask, explored)

      expect(cmd.cells).toHaveLength(0)
    })

    it('returns 0 cells when not visible nor explored', () => {
      const mask = emptyMask()
      const explored = emptyMask()
      const cmd = coalMineEntity.getDrawCommand(10, 10, 0, 0, false, mask, explored)

      expect(cmd.cells).toHaveLength(0)
    })

    it('renders explored-but-invisible cells', () => {
      const mask = emptyMask()
      const explored = fullExplored()
      const cmd = coalMineEntity.getDrawCommand(10, 10, 0, 0, false, mask, explored)

      expect(cmd.cells).toHaveLength(1)
      expect(cmd.cells[0].char).toBe('C')
    })
  })

  describe('onEnter', () => {
    it('returns eventId setpiece.coalMine', () => {
      const mockCtx: EntityTriggerContext = {
        pos: [10, 10],
        state: {} as any,
        dispatch: () => {},
        t: () => '',
        _globalTick: 0,
      }

      const result = coalMineEntity.onEnter!(mockCtx)
      expect(result).toEqual({ eventId: 'setpiece.coalMine' })
    })
  })
})
