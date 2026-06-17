/**
 * Room 事件 — Mysterious Wanderer Wood（神秘流浪者：木材投机）
 *
 * TODO: Phase 7 — 实现 Events.saveDelay 持久化延迟奖励机制
 * 原版在 50% / 30% 概率下 60 秒后返回 300 / 1500 wood。
 * 当前简化版本：结算到 reward 字段即时发放。
 */
import type { EventDef } from '../types'
import type { GameState } from '../../state/types'

export const mysteriousWandererWood: EventDef = {
  id: 'mysterious_wanderer_wood',
  title: 'events.wanderer.title',
  isAvailable: (state: GameState) =>
    state.currentRoom === 'room' && (state.stores['wood'] ?? 0) > 0,
  scenes: {
    start: {
      text: [
        'events.wanderer.text.0',
        'events.wanderer.text.1',
      ],
      notification: 'events.wanderer.arrived',
      blink: true,
      buttons: {
        wood100: {
          text: 'events.wanderer.give_100',
          cost: { wood: 100 },
          nextScene: { 1: 'wood100' },
        },
        wood500: {
          text: 'events.wanderer.give_500',
          cost: { wood: 500 },
          nextScene: { 1: 'wood500' },
        },
        deny: {
          text: 'events.wanderer.deny',
          nextScene: 'end',
        },
      },
    },
    wood100: {
      text: ['events.wanderer.wood_sent'],
      // 简化：50% 概率获得双倍回报，否则看概率
      nextScene: { 0.5: 'returned', 1: 'nothing' },
      buttons: {
        leave: { text: 'events.wanderer.goodbye', nextScene: 'end' },
      },
    },
    wood500: {
      text: ['events.wanderer.wood_sent'],
      nextScene: { 0.3: 'returned_big', 1: 'nothing' },
      buttons: {
        leave: { text: 'events.wanderer.goodbye', nextScene: 'end' },
      },
    },
    returned: {
      text: ['events.wanderer.return_text'],
      reward: { wood: 300 },
      notification: 'events.wanderer.return',
      buttons: {
        leave: { text: 'events.wanderer.goodbye', nextScene: 'end' },
      },
    },
    returned_big: {
      text: ['events.wanderer.return_text'],
      reward: { wood: 1500 },
      notification: 'events.wanderer.return',
      buttons: {
        leave: { text: 'events.wanderer.goodbye', nextScene: 'end' },
      },
    },
    nothing: {
      text: ['events.wanderer.nothing'],
      buttons: {
        leave: { text: 'events.wanderer.goodbye', nextScene: 'end' },
      },
    },
  },
}
