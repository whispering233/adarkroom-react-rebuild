/**
 * World Setpiece — Borehole
 *
 * 钻井地标事件。
 */
import type { EventDef } from '../../types'

const boreholeSetpiece: EventDef = {
  id: 'setpiece.borehole',
  title: 'events.setpiece.borehole',
  isAvailable: () => true,
  scenes: {
    start: {
      text: ['events.setpiece.borehole.text'],
      buttons: {
        leave: {
          text: 'actions.leave',
          nextScene: 'end',
        },
      },
    },
  },
}
export { boreholeSetpiece }
