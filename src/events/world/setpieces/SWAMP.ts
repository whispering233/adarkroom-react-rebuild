/**
 * World Setpiece — Swamp
 *
 * 沼泽地标事件。
 */
import { registerEvent } from '../../registry'
import type { EventDef } from '../../types'

const swampSetpiece: EventDef = {
  id: 'setpiece.swamp',
  title: 'events.setpiece.swamp',
  isAvailable: () => true,
  scenes: {
    start: {
      text: ['events.setpiece.swamp.text'],
      buttons: {
        leave: {
          text: 'actions.leave',
          nextScene: 'end',
        },
      },
    },
  },
}
registerEvent(swampSetpiece)
export { swampSetpiece }
