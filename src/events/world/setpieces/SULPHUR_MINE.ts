/**
 * World Setpiece — Sulphur Mine
 *
 * 硫磺矿地标事件。
 */
import { registerEvent } from '../../registry'
import type { EventDef } from '../../types'

const sulphurMineSetpiece: EventDef = {
  id: 'setpiece.sulphurMine',
  title: 'events.setpiece.sulphurMine',
  isAvailable: () => true,
  scenes: {
    start: {
      text: ['events.setpiece.sulphurMine.text'],
      buttons: {
        leave: {
          text: 'actions.leave',
          nextScene: 'end',
        },
      },
    },
  },
}
registerEvent(sulphurMineSetpiece)
export { sulphurMineSetpiece }
