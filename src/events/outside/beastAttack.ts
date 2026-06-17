/**
 * Outside 事件 — Beast Attack（野兽袭击）
 *
 * 触发：outside && population > 0
 * 效果：杀 1-11 人，掉落 fur/meat/teeth
 */
import type { EventDef } from '../types'
import type { GameState } from '../../state/types'

export const beastAttack: EventDef = {
  id: 'beast_attack',
  title: 'events.beast.title',
  isAvailable: (state: GameState) =>
    state.currentRoom === 'outside' && state.game.population > 0,
  scenes: {
    start: {
      text: [
        'events.beast.text.0',
        'events.beast.text.1',
        'events.beast.text.2',
      ],
      notification: 'events.beast.arrived',
      blink: true,
      onLoad: (dispatch) => {
        dispatch({
          type: 'APPLY_RECIPE',
          recipe: (draft: GameState) => {
            const numKilled = Math.floor(Math.random() * 10) + 1
            draft.game.population = Math.max(0, draft.game.population - numKilled)
          },
        })
      },
      reward: { fur: 100, meat: 100, teeth: 10 },
      buttons: {
        end: {
          text: 'events.beast.go_home',
          notification: 'events.beast.end_notify',
          nextScene: 'end',
        },
      },
    },
  },
}
