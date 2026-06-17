/**
 * Room 事件 — The Sick Man（病人：给 medicine 换 random reward）
 */
import type { EventDef } from '../types'
import type { GameState } from '../../state/types'

export const sickMan: EventDef = {
  id: 'sick_man',
  title: 'events.sick.title',
  isAvailable: (state: GameState) =>
    state.currentRoom === 'room' && (state.stores['medicine'] ?? 0) > 0,
  scenes: {
    start: {
      text: [
        'events.sick.text.0',
        'events.sick.text.1',
      ],
      notification: 'events.sick.arrived',
      blink: true,
      buttons: {
        help: {
          text: 'events.sick.give_meds',
          cost: { medicine: 1 },
          notification: 'events.sick.meds_eaten',
          nextScene: { 0.1: 'alloy', 0.3: 'cells', 0.5: 'scales', 1: 'nothing' },
        },
        ignore: {
          text: 'events.sick.ignore',
          nextScene: 'end',
        },
      },
    },
    alloy: {
      text: [
        'events.sick.thanks',
        'events.sick.reward',
        'events.sick.alloy',
      ],
      reward: { 'alien alloy': 1 },
      buttons: {
        bye: { text: 'events.sick.goodbye', nextScene: 'end' },
      },
    },
    cells: {
      text: [
        'events.sick.thanks',
        'events.sick.reward',
        'events.sick.cells',
      ],
      reward: { 'energy cell': 3 },
      buttons: {
        bye: { text: 'events.sick.goodbye', nextScene: 'end' },
      },
    },
    scales: {
      text: [
        'events.sick.thanks',
        'events.sick.reward',
        'events.sick.scales',
      ],
      reward: { scales: 5 },
      buttons: {
        bye: { text: 'events.sick.goodbye', nextScene: 'end' },
      },
    },
    nothing: {
      text: ['events.sick.nothing'],
      buttons: {
        bye: { text: 'events.sick.goodbye', nextScene: 'end' },
      },
    },
  },
}
