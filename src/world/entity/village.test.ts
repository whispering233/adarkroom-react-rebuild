import { describe, it, expect } from 'vitest'
import { villageEntity } from './village'
import type { EntityTriggerContext, EntityTriggerResult } from '../types'

// ─── 辅助 ──────────────────────────────────────────────

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

// ─── 测试 ──────────────────────────────────────────────

describe('village entity', () => {
  describe('footprint', () => {
    it('has 3x3 footprint', () => {
      expect(villageEntity.footprint).toEqual({ w: 3, h: 3 })
    })

    it('has type village', () => {
      expect(villageEntity.type).toBe('village')
    })
  })

  describe('getDrawCommand', () => {
    it('returns 9 cells for fully visible 3x3', () => {
      const mask = fullMask()
      const explored = fullExplored()
      const cmd = villageEntity.getDrawCommand(10, 10, 0, 0, false, mask, explored)

      expect(cmd.cells).toHaveLength(9)
      expect(cmd.bounds).toEqual({ vx: 10, vy: 10, vw: 3, vh: 3 })
    })

    it('renders correct box pattern chars', () => {
      const mask = fullMask()
      const explored = fullExplored()
      const cmd = villageEntity.getDrawCommand(10, 10, 0, 0, false, mask, explored)

      // Build lookup by (vx, vy)
      const cellMap = new Map<string, string>()
      for (const cell of cmd.cells) {
        cellMap.set(`${cell.vx},${cell.vy}`, cell.char)
      }

      // Row 0: ┌ ─ ┐
      expect(cellMap.get('10,10')).toBe('┌')
      expect(cellMap.get('11,10')).toBe('─')
      expect(cellMap.get('12,10')).toBe('┐')

      // Row 1: │ A │
      expect(cellMap.get('10,11')).toBe('│')
      expect(cellMap.get('11,11')).toBe('A')
      expect(cellMap.get('12,11')).toBe('│')

      // Row 2: └ ─ ┘
      expect(cellMap.get('10,12')).toBe('└')
      expect(cellMap.get('11,12')).toBe('─')
      expect(cellMap.get('12,12')).toBe('┘')
    })

    it('uses landmark char A for all cells when isDimmed=true', () => {
      const mask = fullMask()
      const explored = fullExplored()
      const cmd = villageEntity.getDrawCommand(10, 10, 0, 0, true, mask, explored)

      expect(cmd.cells).toHaveLength(9)
      for (const cell of cmd.cells) {
        expect(cell.char).toBe('A')
      }
    })

    it('returns 0 cells when outside viewport', () => {
      const mask = fullMask()
      const explored = fullExplored()
      // Place village at (-5, -5) → all cells have vx/vy < 0
      const cmd = villageEntity.getDrawCommand(-5, -5, 0, 0, false, mask, explored)

      expect(cmd.cells).toHaveLength(0)
    })

    it('skips cells not in mask nor explored', () => {
      const mask = emptyMask()
      const explored = emptyMask() // neither visible nor explored
      const cmd = villageEntity.getDrawCommand(10, 10, 0, 0, false, mask, explored)

      expect(cmd.cells).toHaveLength(0)
    })

    it('renders only explored-but-invisible cells (dimmed per-cell)', () => {
      const mask = emptyMask()
      const explored = fullExplored()
      const cmd = villageEntity.getDrawCommand(10, 10, 0, 0, false, mask, explored)

      // isDimmed=false passed to entity, but each cell is !visible && explored
      // getDrawCommand still renders them (they are explored), but the caller
      // passed isDimmed=false — so the entity renders normal chars
      expect(cmd.cells).toHaveLength(9)
      // Each cell gets the normal box char since isDimmed is false
      expect(cmd.cells[0].char).toBe('┌')
    })

    it('renders only partially when some cells are masked out and not explored', () => {
      const mask = emptyMask()
      const explored = Array.from({ length: WORLD_SIZE }, () => Array(WORLD_SIZE).fill(false))
      // Only the anchor cell is visible and explored
      mask[10][10] = true
      explored[10][10] = true

      const cmd = villageEntity.getDrawCommand(10, 10, 0, 0, false, mask, explored)

      // Only 1 cell passes (visible && explored)
      expect(cmd.cells).toHaveLength(1)
      expect(cmd.cells[0].vx).toBe(10)
      expect(cmd.cells[0].vy).toBe(10)
    })
  })

  describe('onEnter', () => {
    it('returns returnHome with village narration', () => {
      const mockCtx: EntityTriggerContext = {
        pos: [10, 10],
        state: {} as any,
        dispatch: () => {},
        t: (_key: string) => 'Village',
        _globalTick: 0,
      }

      const result: EntityTriggerResult | null = villageEntity.onEnter!(mockCtx)
      expect(result).not.toBeNull()
      expect(result!.returnHome).toBe(true)
      expect(result!.narrations).toEqual(['Village'])
    })
  })
})
