/**
 * World Setpiece — Town
 *
 * 废弃城镇地标事件。
 */
import { registerEvent } from '../../registry'
import type { EventDef } from '../../types'

const townSetpiece: EventDef = {
  id: 'setpiece.town',
  title: 'events.setpiece.town',
  isAvailable: () => true,
  scenes: {
    start: {
      text: ['events.setpiece.town.text'],
      buttons: {
        leave: {
          text: 'actions.leave',
          nextScene: 'end',
        },
      },
    },
  },
}
registerEvent(townSetpiece)
export { townSetpiece }
