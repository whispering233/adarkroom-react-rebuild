/**
 * Room 事件 — The Shady Builder（可疑建造者：300 wood 赌 hut）
 */
import type { EventDef } from '../types'
import type { GameState } from '../../state/types'

export const shadyBuilder: EventDef = {
  id: 'shady_builder',
  title: 'events.shady.title',
  isAvailable: (state: GameState) => {
    const huts = state.game.buildings['hut'] ?? 0
    return state.currentRoom === 'room' && huts >= 5 && huts < 20
  },
  scenes: {
    start: {
      text: [
        'events.shady.text.0',
        'events.shady.text.1',
      ],
      notification: 'events.shady.arrived',
      buttons: {
        build: {
          text: 'events.shady.build',
          cost: { wood: 300 },
          nextScene: { 0.6: 'steal', 1: 'build' },
        },
        deny: {
          text: 'events.shady.goodbye',
          nextScene: 'end',
        },
      },
    },
    steal: {
      text: ['events.shady.steal'],
      notification: 'events.shady.steal_notify',
      buttons: {
        end: { text: 'events.shady.go_home', nextScene: 'end' },
      },
    },
    build: {
      text: ['events.shady.build_ok'],
      notification: 'events.shady.build_notify',
      onLoad: (dispatch) => {
        dispatch({
          type: 'APPLY_RECIPE',
          recipe: (d: GameState) => {
            const n = d.game.buildings['hut'] ?? 0
            if (n < 20) {
              d.game.buildings['hut'] = n + 1
            }
          },
        })
      },
      buttons: {
        end: { text: 'events.shady.go_home', nextScene: 'end' },
      },
    },
  },
}
