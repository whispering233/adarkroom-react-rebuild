/**
 * Room 事件 — Mysterious Wanderer Fur（神秘流浪者：皮毛投机）
 * 同 wood 版本的简化处理。
 */
import type { EventDef } from '../types'
import type { GameState } from '../../state/types'

export const mysteriousWandererFur: EventDef = {
  id: 'mysterious_wanderer_fur',
  title: 'events.wanderer_fur.title',
  isAvailable: (state: GameState) =>
    state.currentRoom === 'room' && (state.stores['fur'] ?? 0) > 0,
  scenes: {
    start: {
      text: [
        'events.wanderer_fur.text.0',
        'events.wanderer_fur.text.1',
      ],
      notification: 'events.wanderer_fur.arrived',
      blink: true,
      buttons: {
        fur100: {
          text: 'events.wanderer_fur.give_100',
          cost: { fur: 100 },
          nextScene: { 1: 'fur100' },
        },
        fur500: {
          text: 'events.wanderer_fur.give_500',
          cost: { fur: 500 },
          nextScene: { 1: 'fur500' },
        },
        deny: {
          text: 'events.wanderer_fur.deny',
          nextScene: 'end',
        },
      },
    },
    fur100: {
      text: ['events.wanderer_fur.fur_sent'],
      nextScene: { 0.5: 'returned', 1: 'nothing' },
      buttons: {
        leave: { text: 'events.wanderer_fur.goodbye', nextScene: 'end' },
      },
    },
    fur500: {
      text: ['events.wanderer_fur.fur_sent'],
      nextScene: { 0.3: 'returned_big', 1: 'nothing' },
      buttons: {
        leave: { text: 'events.wanderer_fur.goodbye', nextScene: 'end' },
      },
    },
    returned: {
      text: ['events.wanderer_fur.return_text'],
      reward: { fur: 300 },
      notification: 'events.wanderer_fur.return',
      buttons: {
        leave: { text: 'events.wanderer_fur.goodbye', nextScene: 'end' },
      },
    },
    returned_big: {
      text: ['events.wanderer_fur.return_text'],
      reward: { fur: 1500 },
      notification: 'events.wanderer_fur.return',
      buttons: {
        leave: { text: 'events.wanderer_fur.goodbye', nextScene: 'end' },
      },
    },
    nothing: {
      text: ['events.wanderer_fur.nothing'],
      buttons: {
        leave: { text: 'events.wanderer_fur.goodbye', nextScene: 'end' },
      },
    },
  },
}
