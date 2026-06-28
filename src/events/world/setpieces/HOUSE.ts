/**
 * World Setpiece — House
 *
 * 旧房屋地标事件。
 */
import type { EventDef } from '../../types'

const houseSetpiece: EventDef = {
  id: 'setpiece.house',
  title: 'events.setpiece.house',
  isAvailable: () => true,
  scenes: {
    start: {
      text: ['events.setpiece.house.text'],
      buttons: {
        leave: {
          text: 'actions.leave',
          nextScene: 'end',
        },
      },
    },
  },
}
export { houseSetpiece }
