/**
 * World Setpiece — Village
 *
 * 玩家回到村庄后触发。回村逻辑由 World 组件的 goHome 处理（dispatches RETURN_FROM_WORLD），
 * 此事件提供叙事展示。
 */
import { registerEvent } from '../../registry'
import type { EventDef } from '../../types'

const villageSetpiece: EventDef = {
  id: 'setpiece.village',
  title: 'events.setpiece.village',
  isAvailable: () => true,
  scenes: {
    start: {
      text: ['events.setpiece.village.text'],
      buttons: {
        rest: {
          text: 'actions.rest',
          nextScene: 'end',
          notification: 'events.setpiece.village.rest',
        },
      },
    },
  },
}

registerEvent(villageSetpiece)
export { villageSetpiece }
