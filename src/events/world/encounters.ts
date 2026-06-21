/**
 * World — 随机遭遇战事件
 *
 * 每个 encounter 是标准 EventDef，combat: true 触发 CombatOverlay。
 * Tier 1 (<10 步) enemies，后续可扩展 Tier 2/3。
 */
import { registerEvent } from '../registry'
import type { EventDef } from '../types'
import { WORLD } from '../../world/constants'

function getDistance(state: import('../../state/types').GameState): number {
  const wr = state.game.worldRuntime
  if (!wr) return 0
  return (
    Math.abs(wr.curPos[0] - WORLD.DEFAULT_MAP_RADIUS) +
    Math.abs(wr.curPos[1] - WORLD.DEFAULT_MAP_RADIUS)
  )
}

function getCurTerrain(state: import('../../state/types').GameState): string {
  const wr = state.game.worldRuntime
  const pw = state.game.world
  if (!wr || !pw) return ''
  return pw.tiles[wr.curPos[0]][wr.curPos[1]].terrain
}

/** Snarling Beast — Tier 1, Forest */
const snarlingBeast: EventDef = {
  id: 'encounter.snarlingBeast',
  title: 'events.encounter.snarlingBeast',
  isAvailable: (state) =>
    getDistance(state) <= 10 && getCurTerrain(state) === 'forest',
  scenes: {
    start: {
      combat: true,
      health: 5,
      damage: 1,
      hit: 0.8,
      attackDelay: 1,
      loot: {
        fur: { min: 1, max: 3, chance: 1 },
        meat: { min: 1, max: 3, chance: 1 },
        teeth: { min: 1, max: 3, chance: 0.8 },
      },
      notification: 'events.encounter.snarlingBeast.notif',
      text: ['events.encounter.snarlingBeast.text'],
      buttons: { leave: { text: 'actions.continue', nextScene: 'end' } },
    },
  },
}

/** Gaunt Man — Tier 1, Barrens */
const gauntMan: EventDef = {
  id: 'encounter.gauntMan',
  title: 'events.encounter.gauntMan',
  isAvailable: (state) =>
    getDistance(state) <= 10 && getCurTerrain(state) === 'barrens',
  scenes: {
    start: {
      combat: true,
      health: 6,
      damage: 2,
      hit: 0.8,
      attackDelay: 2,
      loot: {
        cloth: { min: 1, max: 3, chance: 0.8 },
        teeth: { min: 1, max: 2, chance: 0.8 },
        leather: { min: 1, max: 2, chance: 0.5 },
      },
      notification: 'events.encounter.gauntMan.notif',
      text: ['events.encounter.gauntMan.text'],
      buttons: { leave: { text: 'actions.continue', nextScene: 'end' } },
    },
  },
}

/** Strange Bird — Tier 1, Field */
const strangeBird: EventDef = {
  id: 'encounter.strangeBird',
  title: 'events.encounter.strangeBird',
  isAvailable: (state) =>
    getDistance(state) <= 10 && getCurTerrain(state) === 'field',
  scenes: {
    start: {
      combat: true,
      health: 4,
      damage: 3,
      hit: 0.8,
      attackDelay: 2,
      loot: {
        scales: { min: 1, max: 3, chance: 0.8 },
        teeth: { min: 1, max: 2, chance: 0.5 },
        meat: { min: 1, max: 3, chance: 0.8 },
      },
      notification: 'events.encounter.strangeBird.notif',
      text: ['events.encounter.strangeBird.text'],
      buttons: { leave: { text: 'actions.continue', nextScene: 'end' } },
    },
  },
}

registerEvent(snarlingBeast)
registerEvent(gauntMan)
registerEvent(strangeBird)

export const WORLD_ENCOUNTERS: EventDef[] = [snarlingBeast, gauntMan, strangeBird]
