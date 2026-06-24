/**
 * World Setpiece — Coal Mine
 *
 * 煤矿地标事件。
 */
import { registerEvent } from '../../registry'
import type { EventDef } from '../../types'

const coalMineSetpiece: EventDef = {
  id: 'setpiece.coalMine',
  title: 'events.setpiece.coalMine',
  isAvailable: () => true,
  scenes: {
    start: {
      text: ['events.setpiece.coalMine.text'],
      buttons: {
        leave: {
          text: 'actions.leave',
          nextScene: 'end',
        },
      },
    },
  },
}
registerEvent(coalMineSetpiece)
export { coalMineSetpiece }
