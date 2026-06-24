/**
 * World Setpiece — Ship
 *
 * 坠毁星舰地标事件。
 */
import { registerEvent } from '../../registry'
import type { EventDef } from '../../types'

const shipSetpiece: EventDef = {
  id: 'setpiece.ship',
  title: 'events.setpiece.ship',
  isAvailable: () => true,
  scenes: {
    start: {
      text: ['events.setpiece.ship.text'],
      buttons: {
        leave: {
          text: 'actions.leave',
          nextScene: 'end',
        },
      },
    },
  },
}
registerEvent(shipSetpiece)
export { shipSetpiece }
