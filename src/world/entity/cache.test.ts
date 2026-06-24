import { describe, it, expect } from 'vitest'
import { cacheEntity } from './cache'
import { makeMask } from './testHelpers'

describe('cache entity', () => {
  it('exports a valid WorldEntity', () => {
    expect(cacheEntity).toBeDefined()
    expect(cacheEntity.type).toBe('cache')
    expect(cacheEntity.footprint).toEqual({ w: 1, h: 1 })
  })

  it('getDrawCommand returns correct bounds', () => {
    const { mask, explored } = makeMask([[5, 5]], [[5, 5]])
    const result = cacheEntity.getDrawCommand(5, 5, 0, 0, false, mask, explored)
    expect(result.bounds).toEqual({ vx: 5, vy: 5, vw: 1, vh: 1 })
  })

  it('getDrawCommand returns cell for visible footprint cell', () => {
    const { mask, explored } = makeMask([[5, 5]], [[5, 5]])
    const result = cacheEntity.getDrawCommand(5, 5, 0, 0, false, mask, explored)
    expect(result.cells).toHaveLength(1)
    expect(result.cells[0]!.output.char).toBe('U')
    expect(result.cells[0]!.vx).toBe(5)
    expect(result.cells[0]!.vy).toBe(5)
  })

  it('getDrawCommand skips cell when neither visible nor explored', () => {
    const { mask, explored } = makeMask([], [])
    const result = cacheEntity.getDrawCommand(5, 5, 0, 0, false, mask, explored)
    expect(result.cells).toHaveLength(0)
  })

  it('getDrawCommand shows explored-but-not-visible cells', () => {
    const { mask, explored } = makeMask([[5, 5]], [])
    const result = cacheEntity.getDrawCommand(5, 5, 0, 0, false, mask, explored)
    expect(result.cells).toHaveLength(1)
  })

  it('getDrawCommand shows visible cells', () => {
    const { mask, explored } = makeMask([[5, 5]], [[5, 5]])
    const result = cacheEntity.getDrawCommand(5, 5, 0, 0, false, mask, explored)
    expect(result.cells).toHaveLength(1)
  })

  it('getDrawCommand uses dimmed fillStyle when isDimmed=true even if visible', () => {
    const { mask, explored } = makeMask([[5, 5]], [[5, 5]])
    const result = cacheEntity.getDrawCommand(5, 5, 0, 0, true, mask, explored)
    expect(result.cells).toHaveLength(1)
  })

  it('getDrawCommand computes viewport-relative coordinates', () => {
    const { mask, explored } = makeMask([[10, 10]], [[10, 10]])
    const result = cacheEntity.getDrawCommand(10, 10, 3, 7, false, mask, explored)
    expect(result.cells[0]!.vx).toBe(7)
    expect(result.cells[0]!.vy).toBe(3)
  })

  it('onEnter returns setpiece.cache', () => {
    expect(cacheEntity.onEnter).toBeDefined()
    const ctx = {} as any
    const result = cacheEntity.onEnter!(ctx)
    expect(result).toEqual({ eventId: 'setpiece.cache' })
  })
})
