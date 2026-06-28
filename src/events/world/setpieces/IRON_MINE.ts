/**
 * World Setpiece — Iron Mine
 *
 * 铁矿地标事件。
 */
import type { EventDef } from '../../types'

const ironMineSetpiece: EventDef = {
  id: 'setpiece.ironMine',
  title: 'events.setpiece.ironMine',
  isAvailable: () => true,
  scenes: {
    start: {
      text: ['events.setpiece.ironMine.text'],
      buttons: {
        leave: {
          text: 'actions.leave',
          nextScene: 'end',
        },
      },
    },
  },
}
export { ironMineSetpiece }
