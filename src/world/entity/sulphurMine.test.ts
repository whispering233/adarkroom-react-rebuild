import { describe, it, expect } from 'vitest'
import { sulphurMineEntity } from './sulphurMine'
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

describe('sulphurMine entity', () => {
  it('has 1x1 footprint', () => {
    expect(sulphurMineEntity.footprint).toEqual({ w: 1, h: 1 })
  })

  it('has type sulphurMine', () => {
    expect(sulphurMineEntity.type).toBe('sulphurMine')
  })

  describe('getDrawCommand', () => {
    it('returns 1 cell with char S', () => {
      const mask = fullMask()
      const explored = fullExplored()
      const cmd = sulphurMineEntity.getDrawCommand(10, 10, 0, 0, false, mask, explored)

      expect(cmd.cells).toHaveLength(1)
      expect(cmd.cells[0].char).toBe('S')
      expect(cmd.cells[0].vx).toBe(10)
      expect(cmd.cells[0].vy).toBe(10)
      expect(cmd.bounds).toEqual({ vx: 10, vy: 10, vw: 1, vh: 1 })
    })

    it('returns 0 cells when outside viewport', () => {
      const mask = fullMask()
      const explored = fullExplored()
      const cmd = sulphurMineEntity.getDrawCommand(-10, -10, 0, 0, false, mask, explored)

      expect(cmd.cells).toHaveLength(0)
    })

    it('returns 0 cells when not visible nor explored', () => {
      const mask = emptyMask()
      const explored = emptyMask()
      const cmd = sulphurMineEntity.getDrawCommand(10, 10, 0, 0, false, mask, explored)

      expect(cmd.cells).toHaveLength(0)
    })

    it('renders explored-but-invisible cells', () => {
      const mask = emptyMask()
      const explored = fullExplored()
      const cmd = sulphurMineEntity.getDrawCommand(10, 10, 0, 0, false, mask, explored)

      expect(cmd.cells).toHaveLength(1)
      expect(cmd.cells[0].char).toBe('S')
    })
  })

  describe('onEnter', () => {
    it('returns eventId setpiece.sulphurMine', () => {
      const mockCtx: EntityTriggerContext = {
        pos: [10, 10],
        state: {} as any,
        dispatch: () => {},
        t: () => '',
        _globalTick: 0,
      }

      const result = sulphurMineEntity.onEnter!(mockCtx)
      expect(result).toEqual({ eventId: 'setpiece.sulphurMine' })
    })
  })
})
