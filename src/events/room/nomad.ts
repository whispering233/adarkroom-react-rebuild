/**
 * Room 事件 — The Nomad（商人来访）
 *
 * 触发：fur > 0 时在暗室中随机触发
 */
import type { EventDef } from '../types'
import type { GameState } from '../../state/types'

export const nomad: EventDef = {
  id: 'nomad',
  title: 'events.nomad.title',
  isAvailable: (state: GameState) =>
    state.currentRoom === 'room' && (state.stores['fur'] ?? 0) > 0,
  scenes: {
    start: {
      text: [
        'events.nomad.text.0',
        'events.nomad.text.1',
      ],
      notification: 'events.nomad.arrived',
      blink: true,
      buttons: {
        buyScales: {
          text: 'events.nomad.buy_scales',
          cost: { fur: 100 },
          reward: { scales: 1 },
        },
        buyTeeth: {
          text: 'events.nomad.buy_teeth',
          cost: { fur: 200 },
          reward: { teeth: 1 },
        },
        buyBait: {
          text: 'events.nomad.buy_bait',
          cost: { fur: 5 },
          reward: { bait: 1 },
          notification: 'events.nomad.bait_effective',
        },
        buyCompass: {
          text: 'events.nomad.buy_compass',
          available: (state) => (state.stores['compass'] ?? 0) < 1,
          cost: { fur: 300, scales: 15, teeth: 5 },
          reward: { compass: 1 },
          notification: 'events.nomad.compass_desc',
        },
        goodbye: {
          text: 'events.nomad.goodbye',
          nextScene: 'end',
        },
      },
    },
  },
}
