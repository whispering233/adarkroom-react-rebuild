/**
 * Outside 事件 — Sickness（疫病，小型）
 *
 * 触发：outside && pop 10-50 && medicine > 0
 * 效果：给 medicine 治愈 / 无视则死一半人
 */
import type { EventDef } from '../types'
import type { GameState } from '../../state/types'

export const sickness: EventDef = {
  id: 'sickness',
  title: 'events.sickness.title',
  isAvailable: (state: GameState) =>
    state.currentRoom === 'outside' &&
    state.game.population > 10 &&
    state.game.population < 50 &&
    (state.stores['medicine'] ?? 0) > 0,
  scenes: {
    start: {
      text: [
        'events.sickness.text.0',
        'events.sickness.text.1',
      ],
      notification: 'events.sickness.arrived',
      blink: true,
      buttons: {
        heal: {
          text: 'events.sickness.heal',
          cost: { medicine: 1 },
          nextScene: { 1: 'healed' },
        },
        ignore: {
          text: 'events.sickness.ignore',
          nextScene: { 1: 'death' },
        },
      },
    },
    healed: {
      text: ['events.sickness.healed'],
      notification: 'events.sickness.healed_notify',
      buttons: {
        end: { text: 'events.sickness.go_home', nextScene: 'end' },
      },
    },
    death: {
      text: [
        'events.sickness.death.0',
        'events.sickness.death.1',
        'events.sickness.death.2',
      ],
      notification: 'events.sickness.death_notify',
      onLoad: (dispatch) => {
        dispatch({
          type: 'APPLY_RECIPE',
          recipe: (draft: GameState) => {
            const pop = draft.game.population
            if (pop <= 0) return
            const numKilled = Math.floor(Math.random() * Math.floor(pop / 2)) + 1
            draft.game.population = Math.max(0, pop - numKilled)
          },
        })
      },
      buttons: {
        end: { text: 'events.sickness.go_home', nextScene: 'end' },
      },
    },
  },
}
