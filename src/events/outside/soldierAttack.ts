/**
 * Outside 事件 — Soldier Attack（士兵袭击）
 *
 * 触发：outside && population > 0 && cityCleared
 * 效果：杀 1-41 人，掉落 bullets + cured meat
 */
import type { EventDef } from '../types'
import type { GameState } from '../../state/types'

export const soldierAttack: EventDef = {
  id: 'soldier_attack',
  title: 'events.soldier.title',
  isAvailable: (state: GameState) =>
    state.currentRoom === 'outside' &&
    state.game.population > 0 &&
    (state.character.cityCleared ?? false),
  scenes: {
    start: {
      text: [
        'events.soldier.text.0',
        'events.soldier.text.1',
        'events.soldier.text.2',
      ],
      notification: 'events.soldier.arrived',
      blink: true,
      onLoad: (dispatch) => {
        dispatch({
          type: 'APPLY_RECIPE',
          recipe: (draft: GameState) => {
            const numKilled = Math.floor(Math.random() * 40) + 1
            draft.game.population = Math.max(0, draft.game.population - numKilled)
          },
        })
      },
      reward: { bullets: 10, 'cured meat': 50 },
      buttons: {
        end: {
          text: 'events.soldier.go_home',
          notification: 'events.soldier.end_notify',
          nextScene: 'end',
        },
      },
    },
  },
}
