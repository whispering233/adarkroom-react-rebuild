/**
 * Outside 事件 — Ruined Trap（陷阱被毁）
 *
 * 触发：outside && traps > 0
 * 效果：随机销毁陷阱，追踪有概率找到野兽尸体。
 */
import type { EventDef } from '../types'
import type { GameState } from '../../state/types'

export const ruinedTrap: EventDef = {
  id: 'ruined_trap',
  title: 'events.ruined.title',
  isAvailable: (state: GameState) =>
    state.currentRoom === 'outside' && (state.game.buildings['trap'] ?? 0) > 0,
  scenes: {
    start: {
      text: [
        'events.ruined.text.0',
        'events.ruined.text.1',
      ],
      notification: 'events.ruined.arrived',
      blink: true,
      onLoad: (dispatch) => {
        dispatch({
          type: 'APPLY_RECIPE',
          recipe: (draft: GameState) => {
            const traps = draft.game.buildings['trap'] ?? 0
            if (traps <= 0) return
            const numWrecked = Math.floor(Math.random() * traps) + 1
            draft.game.buildings['trap'] = Math.max(0, traps - numWrecked)
          },
        })
      },
      buttons: {
        track: {
          text: 'events.ruined.track',
          nextScene: { 0.5: 'nothing', 1: 'catch' },
        },
        ignore: {
          text: 'events.ruined.ignore',
          nextScene: 'end',
        },
      },
    },
    nothing: {
      text: [
        'events.ruined.nothing.0',
        'events.ruined.nothing.1',
      ],
      notification: 'events.ruined.found_nothing',
      buttons: {
        end: { text: 'events.ruined.go_home', nextScene: 'end' },
      },
    },
    catch: {
      text: [
        'events.ruined.catch.0',
        'events.ruined.catch.1',
      ],
      notification: 'events.ruined.found_beast',
      reward: { fur: 100, meat: 100, teeth: 10 },
      buttons: {
        end: { text: 'events.ruined.go_home', nextScene: 'end' },
      },
    },
  },
}
