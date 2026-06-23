import { describe, it, expect } from 'vitest'
import { caveEntity } from './cave'

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

describe('cave entity', () => {
  it('exports a valid WorldEntity', () => {
    expect(caveEntity).toBeDefined()
    expect(caveEntity.type).toBe('cave')
    expect(caveEntity.footprint).toEqual({ w: 1, h: 1 })
  })

  it('getDrawCommand returns correct bounds', () => {
    const { mask, explored } = makeMask([[5, 5]], [[5, 5]])
    const result = caveEntity.getDrawCommand(5, 5, 0, 0, false, mask, explored)
    expect(result.bounds).toEqual({ vx: 5, vy: 5, vw: 1, vh: 1 })
  })

  it('getDrawCommand returns cell for visible footprint cell', () => {
    const { mask, explored } = makeMask([[5, 5]], [[5, 5]])
    const result = caveEntity.getDrawCommand(5, 5, 0, 0, false, mask, explored)
    expect(result.cells).toHaveLength(1)
    expect(result.cells[0]!.char).toBe('V')
    expect(result.cells[0]!.vx).toBe(5)
    expect(result.cells[0]!.vy).toBe(5)
  })

  it('getDrawCommand skips cell when neither visible nor explored', () => {
    const { mask, explored } = makeMask([], [])
    const result = caveEntity.getDrawCommand(5, 5, 0, 0, false, mask, explored)
    expect(result.cells).toHaveLength(0)
  })

  it('getDrawCommand shows explored-but-not-visible cells with dimmed fillStyle', () => {
    const { mask, explored } = makeMask([[5, 5]], [])
    const result = caveEntity.getDrawCommand(5, 5, 0, 0, false, mask, explored)
    expect(result.cells).toHaveLength(1)
    expect(result.cells[0]!.fillStyle).toBe('var(--game-text-muted)')
  })

  it('getDrawCommand shows visible cells with accent fillStyle', () => {
    const { mask, explored } = makeMask([[5, 5]], [[5, 5]])
    const result = caveEntity.getDrawCommand(5, 5, 0, 0, false, mask, explored)
    expect(result.cells[0]!.fillStyle).toBe('var(--game-accent)')
  })

  it('getDrawCommand uses dimmed fillStyle when isDimmed=true even if visible', () => {
    const { mask, explored } = makeMask([[5, 5]], [[5, 5]])
    const result = caveEntity.getDrawCommand(5, 5, 0, 0, true, mask, explored)
    expect(result.cells[0]!.fillStyle).toBe('var(--game-text-muted)')
  })

  it('getDrawCommand computes viewport-relative coordinates', () => {
    const { mask, explored } = makeMask([[10, 10]], [[10, 10]])
    const result = caveEntity.getDrawCommand(10, 10, 3, 7, false, mask, explored)
    expect(result.cells[0]!.vx).toBe(7) // 10 - 3
    expect(result.cells[0]!.vy).toBe(3) // 10 - 7
  })

  it('onEnter returns setpiece.cave', () => {
    expect(caveEntity.onEnter).toBeDefined()
    const ctx = {} as any
    const result = caveEntity.onEnter!(ctx)
    expect(result).toEqual({ eventId: 'setpiece.cave' })
  })
})
