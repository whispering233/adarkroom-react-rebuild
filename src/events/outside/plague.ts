/**
 * Outside 事件 — Plague（瘟疫，大型）
 *
 * 触发：outside && pop > 50 && medicine > 0
 * 效果：需 5 medicine 治愈 / 可用 scales+teeth 买 medicine / 无视死 10-90 人
 */
import type { EventDef } from '../types'
import type { GameState } from '../../state/types'

export const plague: EventDef = {
  id: 'plague',
  title: 'events.plague.title',
  isAvailable: (state: GameState) =>
    state.currentRoom === 'outside' &&
    state.game.population > 50 &&
    (state.stores['medicine'] ?? 0) > 0,
  scenes: {
    start: {
      text: [
        'events.plague.text.0',
        'events.plague.text.1',
      ],
      notification: 'events.plague.arrived',
      blink: true,
      buttons: {
        buyMedicine: {
          text: 'events.plague.buy_meds',
          cost: { scales: 70, teeth: 50 },
          reward: { medicine: 1 },
        },
        heal: {
          text: 'events.plague.heal',
          cost: { medicine: 5 },
          nextScene: { 1: 'healed' },
        },
        ignore: {
          text: 'events.plague.ignore',
          nextScene: { 1: 'death' },
        },
      },
    },
    healed: {
      text: [
        'events.plague.healed.0',
        'events.plague.healed.1',
        'events.plague.healed.2',
      ],
      notification: 'events.plague.healed_notify',
      onLoad: (dispatch) => {
        dispatch({
          type: 'APPLY_RECIPE',
          recipe: (draft: GameState) => {
            const numKilled = Math.floor(Math.random() * 5) + 2
            draft.game.population = Math.max(0, draft.game.population - numKilled)
          },
        })
      },
      buttons: {
        end: { text: 'events.plague.go_home', nextScene: 'end' },
      },
    },
    death: {
      text: [
        'events.plague.death.0',
        'events.plague.death.1',
        'events.plague.death.2',
      ],
      notification: 'events.plague.death_notify',
      onLoad: (dispatch) => {
        dispatch({
          type: 'APPLY_RECIPE',
          recipe: (draft: GameState) => {
            const numKilled = Math.floor(Math.random() * 80) + 10
            draft.game.population = Math.max(0, draft.game.population - numKilled)
          },
        })
      },
      buttons: {
        end: { text: 'events.plague.go_home', nextScene: 'end' },
      },
    },
  },
}
