/**
 * Room 事件 — The Wandering Master（流浪大师：交换物资换取技能）
 * TODO: Phase 7 — 实现 Perk 系统后补上 onChoose 逻辑
 */
import type { EventDef } from '../types'
import type { GameState } from '../../state/types'

export const wanderingMaster: EventDef = {
  id: 'wandering_master',
  title: 'events.master.title',
  isAvailable: (state: GameState) =>
    state.currentRoom === 'room' && (state.features['location.world'] ?? false),
  scenes: {
    start: {
      text: [
        'events.master.text.0',
        'events.master.text.1',
      ],
      notification: 'events.master.arrived',
      blink: true,
      buttons: {
        agree: {
          text: 'events.master.agree',
          cost: { 'cured meat': 100, fur: 100, torch: 1 },
          nextScene: { 1: 'agree' },
        },
        deny: {
          text: 'events.master.deny',
          nextScene: 'end',
        },
      },
    },
    agree: {
      text: ['events.master.offer'],
      buttons: {
        evasion: {
          text: 'events.master.evasion',
          available: () => true, // TODO: !hasPerk('evasive')
          nextScene: 'end',
        },
        precision: {
          text: 'events.master.precision',
          available: () => true, // TODO: !hasPerk('precise')
          nextScene: 'end',
        },
        force: {
          text: 'events.master.force',
          available: () => true, // TODO: !hasPerk('barbarian')
          nextScene: 'end',
        },
        nothing: {
          text: 'events.master.nothing',
          nextScene: 'end',
        },
      },
    },
  },
}
