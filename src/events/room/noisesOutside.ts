/**
 * Room 事件 — Noises Outside（门外异响：获取 wood/fur）
 */
import type { EventDef } from '../types'
import type { GameState } from '../../state/types'

export const noisesOutside: EventDef = {
  id: 'noises_outside',
  title: 'events.noises.title',
  isAvailable: (state: GameState) =>
    state.currentRoom === 'room' && (state.stores['wood'] ?? 0) > 0,
  scenes: {
    start: {
      text: [
        'events.noises.text.0',
        'events.noises.text.1',
      ],
      notification: 'events.noises.arrived',
      blink: true,
      buttons: {
        investigate: {
          text: 'events.noises.investigate',
          nextScene: { 0.3: 'stuff', 1: 'nothing' },
        },
        ignore: {
          text: 'events.noises.ignore',
          nextScene: 'end',
        },
      },
    },
    nothing: {
      text: [
        'events.noises.nothing.0',
        'events.noises.nothing.1',
      ],
      buttons: {
        backinside: {
          text: 'events.noises.back',
          nextScene: 'end',
        },
      },
    },
    stuff: {
      text: [
        'events.noises.stuff.0',
        'events.noises.stuff.1',
      ],
      reward: { wood: 100, fur: 10 },
      buttons: {
        backinside: {
          text: 'events.noises.back',
          nextScene: 'end',
        },
      },
    },
  },
}
