/**
 * World Setpiece — Cache
 *
 * 废墟村庄（藏匿处）地标事件。
 */
import { registerEvent } from '../../registry'
import type { EventDef } from '../../types'

const cacheSetpiece: EventDef = {
  id: 'setpiece.cache',
  title: 'events.setpiece.cache',
  isAvailable: () => true,
  scenes: {
    start: {
      text: ['events.setpiece.cache.text'],
      buttons: {
        leave: {
          text: 'actions.leave',
          nextScene: 'end',
        },
      },
    },
  },
}
registerEvent(cacheSetpiece)
export { cacheSetpiece }
