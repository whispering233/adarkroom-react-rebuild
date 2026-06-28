import type { EntityTriggerResult } from '../world/types'
import type { GameState } from '../state/types'
import type { GameAction } from '../state'
import {
  returnFromWorld,
  startEvent,
  applyRecipe,
  pushNarrative,
} from '../state'
import { drawRoadToVillage } from '../world/generator'
import { buildEntityCellMap } from '../world/entity/types'
import { getEntityCatalog } from '../world/entity/catalog'
import { WORLD } from '../world/constants'

export type EffectType =
  | 'return_home'
  | 'start_event'
  | 'clear_outpost'
  | 'flag'
  | 'narration'

export interface TriggerConfig {
  entityType: string
  effects: EffectType[]
}

export interface TriggerEvent {
  entityType: string
  result: EntityTriggerResult
  pos: [number, number]
}

function inferEffects(result: EntityTriggerResult): EffectType[] {
  const effects: EffectType[] = []
  if (result.narrations?.length) effects.push('narration')
  if (result.returnHome) effects.push('return_home')
  if (result.clearOutpost) effects.push('clear_outpost')
  if (result.eventId) effects.push('start_event')
  if (result.shipFound || result.executionerFound) effects.push('flag')
  return effects
}

function dispatchClearOutpost(
  state: GameState,
  dispatch: (action: GameAction) => void,
  pos: [number, number],
): void {
  const pw = state.game.world
  if (!pw) return
  const key = `${pos[0]},${pos[1]}`
  const cell = pw.worldMap.entityCellMap[key]
  if (!cell) return

  dispatch(applyRecipe(d => {
    const pw = d.game.world
    if (!pw) return
    const el = pw.worldMap.entityLayer
    const idx = el.findIndex(
      e => e.entityId === 'outpost' && e.anchorX === cell.anchorX && e.anchorY === cell.anchorY,
    )
    if (idx !== -1) {
      el.splice(idx, 1)
      const villagePos: [number, number] = [WORLD.DEFAULT_MAP_RADIUS, WORLD.DEFAULT_MAP_RADIUS]
      drawRoadToVillage(pw.worldMap.terrainMap, [cell.anchorX, cell.anchorY], villagePos, el)
      pw.worldMap.entityCellMap = buildEntityCellMap(el, getEntityCatalog())
    }
  }))
}

function dispatchFlags(
  dispatch: (action: GameAction) => void,
  result: EntityTriggerResult,
): void {
  dispatch(applyRecipe(d => {
    const wr = d.game.worldRuntime
    if (!wr) return
    if (result.shipFound) wr.shipFound = true
    if (result.executionerFound) wr.executionerFound = true
  }))
}

export function dispatchEffect(
  triggerEvent: TriggerEvent,
  state: GameState,
  dispatch: (action: GameAction) => void,
  t: (key: string) => string,
): void {
  const { result, pos } = triggerEvent
  const effects = inferEffects(result)

  for (const effect of effects) {
    switch (effect) {
      case 'narration': {
        result.narrations?.forEach(n => dispatch(pushNarrative(t(n))))
        break
      }
      case 'return_home': {
        dispatch(returnFromWorld(false))
        return
      }
      case 'clear_outpost': {
        dispatchClearOutpost(state, dispatch, pos)
        break
      }
      case 'start_event': {
        if (result.eventId) dispatch(startEvent(result.eventId))
        break
      }
      case 'flag': {
        dispatchFlags(dispatch, result)
        break
      }
    }
  }
}
