/**
 * World Setpiece — Borehole
 *
 * 钻井地标事件。
 */
import { registerEvent } from '../../registry'
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
registerEvent(boreholeSetpiece)
export { boreholeSetpiece }
