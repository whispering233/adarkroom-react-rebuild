import { describe, it, expect } from 'vitest'
import { INITIAL_STATE, RoomName, FireLevel, TempLevel } from './types'
import type { GameState } from './types'

// Helper that replicates GameProvider's initializer logic:
//   if (initialState) return initialState;
//   const saved = loadState();
//   return saved ? { ...INITIAL_STATE, ...saved } : INITIAL_STATE;
function getInitialState(
  initialState: GameState | undefined,
  loadStateFn: () => GameState | null,
): GameState {
  if (initialState) return initialState
  const saved = loadStateFn()
  return saved ? { ...INITIAL_STATE, ...saved } : INITIAL_STATE
}

describe('GameContext initial state selection', () => {
  it('should use INITIAL_STATE when no save exists', () => {
    const result = getInitialState(undefined, () => null)
    expect(result).toEqual(INITIAL_STATE)
  })

  it('should merge saved state with INITIAL_STATE when save exists', () => {
    const savedState: Partial<GameState> = {
      currentRoom: RoomName.Outside,
      game: {
        ...INITIAL_STATE.game,
        population: 5,
        fire: FireLevel.Burning,
      },
    }
    const result = getInitialState(undefined, () => savedState as GameState)
    expect(result.currentRoom).toBe(RoomName.Outside)
    expect(result.game.population).toBe(5)
    expect(result.game.fire).toBe(FireLevel.Burning)
    // Missing fields from saved state should come from INITIAL_STATE
    expect(result.game.temperature).toBe(TempLevel.Freezing)
    expect(result.combat).toBeNull()
  })

  it('should use initialState prop even when save exists', () => {
    const propState: GameState = { ...INITIAL_STATE, currentRoom: RoomName.Path }
    const savedState: GameState = { ...INITIAL_STATE, currentRoom: RoomName.Outside }
    const result = getInitialState(propState, () => savedState)
    expect(result.currentRoom).toBe(RoomName.Path)
  })

  it('should fill missing fields from INITIAL_STATE via shape merge', () => {
    const oldSave = JSON.parse(JSON.stringify(INITIAL_STATE))
    // Simulate an older save that didn't have the 'combat' field
    delete (oldSave as any).combat
    const result = getInitialState(undefined, () => oldSave as GameState)
    expect(result.combat).toBeNull() // filled by INITIAL_STATE
  })
})
