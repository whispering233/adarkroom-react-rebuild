/**
 * World — Cave Entity
 *
 * 洞穴实体，1×1 单格，字符 'V'。
 * 玩家走入时触发 setpiece.cave 事件。
 */

import { createUniformEntity } from './factory'

export const caveEntity = createUniformEntity({
  type: 'cave',
  char: 'V',
  eventId: 'setpiece.cave',
})
