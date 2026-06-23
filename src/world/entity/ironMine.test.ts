import { describe, it, expect } from 'vitest'
import { ironMineEntity } from './ironMine'
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

describe('ironMine entity', () => {
  it('has 1x1 footprint', () => {
    expect(ironMineEntity.footprint).toEqual({ w: 1, h: 1 })
  })

  it('has type ironMine', () => {
    expect(ironMineEntity.type).toBe('ironMine')
  })

  describe('getDrawCommand', () => {
    it('returns 1 cell with char I', () => {
      const mask = fullMask()
      const explored = fullExplored()
      const cmd = ironMineEntity.getDrawCommand(10, 10, 0, 0, false, mask, explored)

      expect(cmd.cells).toHaveLength(1)
      expect(cmd.cells[0].char).toBe('I')
      expect(cmd.cells[0].vx).toBe(10)
      expect(cmd.cells[0].vy).toBe(10)
      expect(cmd.bounds).toEqual({ vx: 10, vy: 10, vw: 1, vh: 1 })
    })

    it('returns 0 cells when outside viewport', () => {
      const mask = fullMask()
      const explored = fullExplored()
      const cmd = ironMineEntity.getDrawCommand(-10, -10, 0, 0, false, mask, explored)

      expect(cmd.cells).toHaveLength(0)
    })

    it('returns 0 cells when not visible nor explored', () => {
      const mask = emptyMask()
      const explored = emptyMask()
      const cmd = ironMineEntity.getDrawCommand(10, 10, 0, 0, false, mask, explored)

      expect(cmd.cells).toHaveLength(0)
    })

    it('renders explored-but-invisible cells', () => {
      const mask = emptyMask()
      const explored = fullExplored()
      const cmd = ironMineEntity.getDrawCommand(10, 10, 0, 0, false, mask, explored)

      expect(cmd.cells).toHaveLength(1)
      expect(cmd.cells[0].char).toBe('I')
    })

    it('returns correct char when dimmed', () => {
      const mask = fullMask()
      const explored = fullExplored()
      const cmd = ironMineEntity.getDrawCommand(10, 10, 0, 0, true, mask, explored)

      expect(cmd.cells).toHaveLength(1)
      expect(cmd.cells[0].char).toBe('I')
    })
  })

  describe('onEnter', () => {
    it('returns eventId setpiece.ironMine', () => {
      const mockCtx: EntityTriggerContext = {
        pos: [10, 10],
        state: {} as any,
        dispatch: () => {},
        t: () => '',
        _globalTick: 0,
      }

      const result = ironMineEntity.onEnter!(mockCtx)
      expect(result).toEqual({ eventId: 'setpiece.ironMine' })
    })
  })
})
