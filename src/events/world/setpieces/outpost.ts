/**
 * World Setpiece — Outpost
 *
 * 前哨站：补水 + 休息。由 dungeons cleared 后在地图上生成。
 */
import type { EventDef } from '../../types'

const outpostSetpiece: EventDef = {
  id: 'setpiece.outpost',
  title: 'events.setpiece.outpost',
  isAvailable: () => true,
  scenes: {
    start: {
      text: ['events.setpiece.outpost.text'],
      buttons: {
        rest: {
          text: 'actions.rest',
          nextScene: 'end',
          notification: 'events.setpiece.outpost.rest',
        },
      },
    },
  },
}

export { outpostSetpiece }
