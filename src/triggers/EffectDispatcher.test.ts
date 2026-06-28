import { describe, it, expect, vi } from 'vitest'
import { produce } from 'immer'
import type { GameState } from '../state/types'
import type { GameAction } from '../state'
import type { PlacedCell } from '../world/types'
import { dispatchEffect } from './EffectDispatcher'

describe('dispatchEffect', () => {
  const t = (k: string) => k

  it('return_home dispatches returnFromWorld(false)', async () => {
    const { returnFromWorld } = await import('../state')
    const dispatch = vi.fn()
    dispatchEffect(
      { entityType: 'village', result: { returnHome: true }, pos: [30, 30] },
      {} as GameState,
      dispatch,
      t,
    )
    expect(dispatch).toHaveBeenCalledTimes(1)
    expect(dispatch).toHaveBeenCalledWith(returnFromWorld(false))
  })

  it('start_event dispatches startEvent with correct eventId', async () => {
    const { startEvent } = await import('../state')
    const dispatch = vi.fn()
    dispatchEffect(
      { entityType: 'ship', result: { eventId: 'setpiece.ship' as any }, pos: [28, 28] },
      {} as GameState,
      dispatch,
      t,
    )
    expect(dispatch).toHaveBeenCalledTimes(1)
    expect(dispatch).toHaveBeenCalledWith(startEvent('setpiece.ship'))
  })

  it('clear_outpost removes outpost from entityLayer via applyRecipe', async () => {
    const entityLayer = [
      { entityId: 'outpost', anchorX: 10, anchorY: 10 },
    ]
    const entityCellMap: Record<string, PlacedCell> = {
      '10,10': { entityId: 'outpost', anchorX: 10, anchorY: 10, dx: 0, dy: 0 },
    }
    const state = {
      game: {
        world: {
          worldMap: {
            size: 61,
            terrainMap: Array.from({ length: 61 }, () => Array(61).fill('barrens' as const)),
            entityLayer,
            entityCellMap,
          },
        },
        worldRuntime: {},
      },
      version: 1.4,
    } as unknown as GameState

    const dispatch = vi.fn()
    dispatchEffect(
      { entityType: 'outpost', result: { clearOutpost: true }, pos: [10, 10] },
      state,
      dispatch,
      t,
    )

    const action = dispatch.mock.calls[0]?.[0] as GameAction
    expect(action.type).toBe('APPLY_RECIPE' as const)

    const nextState = produce(state, draft => {
      if (action.type === 'APPLY_RECIPE') action.recipe(draft)
    })

    const el = nextState.game!.world!.worldMap.entityLayer
    expect(el.find(e => e.entityId === 'outpost')).toBeUndefined()
  })

  it('flag effect sets shipFound flag when result.shipFound is true', async () => {
    const state = {
      game: { worldRuntime: {} },
      version: 1.4,
    } as unknown as GameState

    const dispatch = vi.fn()
    dispatchEffect(
      { entityType: 'ship', result: { shipFound: true }, pos: [28, 28] },
      state,
      dispatch,
      t,
    )

    const action = dispatch.mock.calls[0]?.[0] as GameAction
    expect(action.type).toBe('APPLY_RECIPE' as const)

    const nextState = produce(state, draft => {
      if (action.type === 'APPLY_RECIPE') action.recipe(draft)
    })

    expect(nextState.game!.worldRuntime!.shipFound).toBe(true)
  })

  it('flag effect sets executionerFound flag when result.executionerFound is true', async () => {
    const state = {
      game: { worldRuntime: {} },
      version: 1.4,
    } as unknown as GameState

    const dispatch = vi.fn()
    dispatchEffect(
      { entityType: 'executioner', result: { executionerFound: true }, pos: [28, 28] },
      state,
      dispatch,
      t,
    )

    const action = dispatch.mock.calls[0]?.[0] as GameAction
    expect(action.type).toBe('APPLY_RECIPE' as const)

    const nextState = produce(state, draft => {
      if (action.type === 'APPLY_RECIPE') action.recipe(draft)
    })

    expect(nextState.game!.worldRuntime!.executionerFound).toBe(true)
  })

  it('narration dispatches pushNarrative for each narration', async () => {
    const { pushNarrative } = await import('../state')
    const dispatch = vi.fn()
    dispatchEffect(
      {
        entityType: 'village',
        result: { narrations: ['narration.one', 'narration.two'] },
        pos: [30, 30],
      },
      {} as GameState,
      dispatch,
      t,
    )
    expect(dispatch).toHaveBeenCalledTimes(2)
    expect(dispatch).toHaveBeenCalledWith(pushNarrative('narration.one'))
    expect(dispatch).toHaveBeenCalledWith(pushNarrative('narration.two'))
  })

  it('outpost triggers start_event + clear_outpost together', async () => {
    const { startEvent } = await import('../state')
    const entityLayer = [
      { entityId: 'outpost', anchorX: 10, anchorY: 10 },
    ]
    const entityCellMap: Record<string, PlacedCell> = {
      '10,10': { entityId: 'outpost', anchorX: 10, anchorY: 10, dx: 0, dy: 0 },
    }
    const state = {
      game: {
        world: {
          worldMap: {
            size: 61,
            terrainMap: Array.from({ length: 61 }, () => Array(61).fill('barrens' as const)),
            entityLayer,
            entityCellMap,
          },
        },
        worldRuntime: {},
      },
      version: 1.4,
    } as unknown as GameState

    const dispatch = vi.fn()
    dispatchEffect(
      { entityType: 'outpost', result: { eventId: 'setpiece.outpost' as any, clearOutpost: true }, pos: [10, 10] },
      state,
      dispatch,
      t,
    )

    // Should dispatch: startEvent + APPLY_RECIPE for clearOutpost
    expect(dispatch).toHaveBeenCalledTimes(2)
    expect(dispatch).toHaveBeenCalledWith(startEvent('setpiece.outpost'))

    const applyRecipeAction = dispatch.mock.calls.find(c => c[0].type === 'APPLY_RECIPE')?.[0]
    expect(applyRecipeAction).toBeDefined()
  })

  it('no dispatch when result is empty (no effects inferred)', () => {
    const dispatch = vi.fn()
    dispatchEffect(
      { entityType: 'house', result: {}, pos: [5, 5] },
      {} as GameState,
      dispatch,
      t,
    )
    expect(dispatch).not.toHaveBeenCalled()
  })

  it('return_home stops processing subsequent effects', () => {
    const dispatch = vi.fn()
    dispatchEffect(
      { entityType: 'village', result: { returnHome: true, eventId: 'some.event' as any }, pos: [30, 30] },
      {} as GameState,
      dispatch,
      t,
    )
    // Only returnFromWorld should be dispatched, not startEvent
    expect(dispatch).toHaveBeenCalledTimes(1)
  })
})
