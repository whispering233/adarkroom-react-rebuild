/**
 * Room 事件 — The Beggar（乞丐：fur 换 scales/teeth/cloth）
 */
import type { EventDef } from '../types'
import type { GameState } from '../../state/types'

export const beggar: EventDef = {
  id: 'beggar',
  title: 'events.beggar.title',
  isAvailable: (state: GameState) =>
    state.currentRoom === 'room' && (state.stores['fur'] ?? 0) > 0,
  scenes: {
    start: {
      text: [
        'events.beggar.text.0',
        'events.beggar.text.1',
      ],
      notification: 'events.beggar.arrived',
      blink: true,
      buttons: {
        give50: {
          text: 'events.beggar.give_50',
          cost: { fur: 50 },
          nextScene: { 0.5: 'scales', 0.8: 'teeth', 1: 'cloth' },
        },
        give100: {
          text: 'events.beggar.give_100',
          cost: { fur: 100 },
          nextScene: { 0.5: 'teeth', 0.8: 'scales', 1: 'cloth' },
        },
        deny: {
          text: 'events.beggar.deny',
          nextScene: 'end',
        },
      },
    },
    scales: {
      text: ['events.beggar.thanks', 'events.beggar.scales_result'],
      reward: { scales: 20 },
      buttons: {
        leave: { text: 'events.beggar.goodbye', nextScene: 'end' },
      },
    },
    teeth: {
      text: ['events.beggar.thanks', 'events.beggar.teeth_result'],
      reward: { teeth: 20 },
      buttons: {
        leave: { text: 'events.beggar.goodbye', nextScene: 'end' },
      },
    },
    cloth: {
      text: ['events.beggar.thanks', 'events.beggar.cloth_result'],
      reward: { cloth: 20 },
      buttons: {
        leave: { text: 'events.beggar.goodbye', nextScene: 'end' },
      },
    },
  },
}
