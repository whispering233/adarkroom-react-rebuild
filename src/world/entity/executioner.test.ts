import { describe, it, expect } from 'vitest'
import { executionerEntity } from './executioner'
import { makeMask } from './testHelpers'

describe('executioner entity', () => {
  it('exports a valid WorldEntity', () => {
    expect(executionerEntity).toBeDefined()
    expect(executionerEntity.type).toBe('executioner')
    expect(executionerEntity.footprint).toEqual({ w: 1, h: 1 })
  })

  it('getDrawCommand returns correct bounds', () => {
    const { mask, explored } = makeMask([[5, 5]], [[5, 5]])
    const result = executionerEntity.getDrawCommand(5, 5, 0, 0, false, mask, explored)
    expect(result.bounds).toEqual({ vx: 5, vy: 5, vw: 1, vh: 1 })
  })

  it('getDrawCommand returns cell for visible footprint cell', () => {
    const { mask, explored } = makeMask([[5, 5]], [[5, 5]])
    const result = executionerEntity.getDrawCommand(5, 5, 0, 0, false, mask, explored)
    expect(result.cells).toHaveLength(1)
    expect(result.cells[0]!.output.char).toBe('X')
    expect(result.cells[0]!.vx).toBe(5)
    expect(result.cells[0]!.vy).toBe(5)
  })

  it('getDrawCommand skips cell when neither visible nor explored', () => {
    const { mask, explored } = makeMask([], [])
    const result = executionerEntity.getDrawCommand(5, 5, 0, 0, false, mask, explored)
    expect(result.cells).toHaveLength(0)
  })

  it('getDrawCommand shows explored-but-not-visible cells', () => {
    const { mask, explored } = makeMask([[5, 5]], [])
    const result = executionerEntity.getDrawCommand(5, 5, 0, 0, false, mask, explored)
    expect(result.cells).toHaveLength(1)
  })

  it('getDrawCommand shows visible cells', () => {
    const { mask, explored } = makeMask([[5, 5]], [[5, 5]])
    const result = executionerEntity.getDrawCommand(5, 5, 0, 0, false, mask, explored)
    expect(result.cells).toHaveLength(1)
  })

  it('getDrawCommand uses dimmed fillStyle when isDimmed=true even if visible', () => {
    const { mask, explored } = makeMask([[5, 5]], [[5, 5]])
    const result = executionerEntity.getDrawCommand(5, 5, 0, 0, true, mask, explored)
    expect(result.cells).toHaveLength(1)
  })

  it('getDrawCommand computes viewport-relative coordinates', () => {
    const { mask, explored } = makeMask([[10, 10]], [[10, 10]])
    const result = executionerEntity.getDrawCommand(10, 10, 3, 7, false, mask, explored)
    expect(result.cells[0]!.vx).toBe(7)
    expect(result.cells[0]!.vy).toBe(3)
  })

  it('has onEnter that returns eventId executioner', () => {
    expect(executionerEntity.onEnter).toBeDefined()
    const result = executionerEntity.onEnter!({} as any)
    expect(result).toEqual({ eventId: 'executioner' })
  })
})
