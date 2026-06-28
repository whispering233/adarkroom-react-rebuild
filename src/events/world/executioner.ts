/**
 * World Setpiece — Executioner Boss Fight
 *
 * 多场景刽子手 Boss 战斗事件。
 * 通过执行者地标实体（eventId: 'executioner'）触发。
 */

import type { EventDef } from '../types'

const executionerEvent: EventDef = {
  id: 'executioner',
  title: 'events.executioner.title',
  isAvailable: () => true,
  scenes: {
    start: {
      text: [
        'events.executioner.start.0',
        'events.executioner.start.1',
      ],
      buttons: {
        enter: {
          text: 'events.executioner.enter',
          nextScene: 'antechamber',
        },
        leave: {
          text: 'actions.leave',
          nextScene: 'end',
        },
      },
    },
    antechamber: {
      text: [
        'events.executioner.antechamber.0',
      ],
      buttons: {
        fight: {
          text: 'events.executioner.fight',
          nextScene: 'combat',
        },
        retreat: {
          text: 'events.executioner.retreat',
          nextScene: 'end',
        },
      },
    },
    combat: {
      text: ['events.executioner.combat'],
      combat: true,
      chara: 'X',
      health: 50,
      damage: 8,
      hit: 0.7,
      attackDelay: 2,
      loot: {
        'fleet beacon': { min: 1, max: 1, chance: 1 },
      },
      buttons: {},
    },
  },
}

export { executionerEvent }
