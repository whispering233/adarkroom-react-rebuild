/**
 * World Setpiece — City
 *
 * 废墟城市地标事件。
 */
import type { EventDef } from '../../types'

const citySetpiece: EventDef = {
  id: 'setpiece.city',
  title: 'events.setpiece.city',
  isAvailable: () => true,
  scenes: {
    start: {
      text: ['events.setpiece.city.text'],
      buttons: {
        leave: {
          text: 'actions.leave',
          nextScene: 'end',
        },
      },
    },
  },
}
export { citySetpiece }
