/**
 * World Setpiece — Battlefield
 *
 * 战场地标事件。
 */
import type { EventDef } from '../../types'

const battlefieldSetpiece: EventDef = {
  id: 'setpiece.battlefield',
  title: 'events.setpiece.battlefield',
  isAvailable: () => true,
  scenes: {
    start: {
      text: ['events.setpiece.battlefield.text'],
      buttons: {
        leave: {
          text: 'actions.leave',
          nextScene: 'end',
        },
      },
    },
  },
}
export { battlefieldSetpiece }
