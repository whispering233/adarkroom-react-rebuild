/**
 * World Setpiece — Cave
 *
 * 洞穴地标事件。
 */
import { registerEvent } from '../../registry'
import type { EventDef } from '../../types'

const caveSetpiece: EventDef = {
  id: 'setpiece.cave',
  title: 'events.setpiece.cave',
  isAvailable: () => true,
  scenes: {
    start: {
      text: ['events.setpiece.cave.text'],
      buttons: {
        leave: {
          text: 'actions.leave',
          nextScene: 'end',
        },
      },
    },
  },
}
registerEvent(caveSetpiece)
export { caveSetpiece }
