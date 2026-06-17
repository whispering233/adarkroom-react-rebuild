/**
 * Outside 事件 — Hut Fire（小屋火灾）
 *
 * 触发：outside && huts > 0 && population > 50
 * 效果：摧毁 1 座小屋，10 名居民死亡。
 */
import type { EventDef } from '../types'
import type { GameState } from '../../state/types'

export const hutFire: EventDef = {
  id: 'hut_fire',
  title: 'events.fire.title',
  isAvailable: (state: GameState) =>
    state.currentRoom === 'outside' &&
    (state.game.buildings['hut'] ?? 0) > 0 &&
    state.game.population > 50,
  scenes: {
    start: {
      text: [
        'events.fire.text.0',
        'events.fire.text.1',
      ],
      notification: 'events.fire.arrived',
      blink: true,
      onLoad: (dispatch) => {
        dispatch({
          type: 'APPLY_RECIPE',
          recipe: (draft: GameState) => {
            const huts = draft.game.buildings['hut'] ?? 0
            if (huts > 0) {
              draft.game.buildings['hut'] = huts - 1
            }
            draft.game.population = Math.max(0, draft.game.population - 10)
          },
        })
      },
      buttons: {
        mourn: {
          text: 'events.fire.mourn',
          notification: 'events.fire.mourn_notify',
          nextScene: 'end',
        },
      },
    },
  },
}
