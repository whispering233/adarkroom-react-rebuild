/**
 * Room 事件 — The Scout（侦察兵：买地图 / 学技能）
 */
import type { EventDef } from '../types'
import type { GameState } from '../../state/types'

export const scout: EventDef = {
  id: 'scout',
  title: 'events.scout.title',
  isAvailable: (state: GameState) =>
    state.currentRoom === 'room' && (state.features['location.world'] ?? false),
  scenes: {
    start: {
      text: [
        'events.scout.text.0',
        'events.scout.text.1',
      ],
      notification: 'events.scout.arrived',
      blink: true,
      buttons: {
        buyMap: {
          text: 'events.scout.buy_map',
          cost: { fur: 200, scales: 10 },
          available: (state) => !(state.game.world as any)?.seenAll,
          notification: 'events.scout.map_desc',
          onChoose: (dispatch) => {
            // TODO: World.applyMap — apply world map reveal
            dispatch({ type: 'APPLY_RECIPE', recipe: () => {} } as any)
          },
        },
        learn: {
          text: 'events.scout.learn_scouting',
          cost: { fur: 1000, scales: 50, teeth: 20 },
          available: (state) => !state.character.perks['scout'],
          onChoose: (dispatch) => {
            dispatch({ type: 'APPLY_RECIPE', recipe: (d: any) => { d.character.perks['scout'] = true } } as any)
          },
        },
        leave: {
          text: 'events.scout.goodbye',
          nextScene: 'end',
        },
      },
    },
  },
}
