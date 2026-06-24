/**
 * World — Town Entity
 *
 * 城镇实体，1×1 单格，字符 'O'。
 * 玩家走入时触发 setpiece.town 事件。
 */

import { createUniformEntity } from './factory'

export const townEntity = createUniformEntity({
  type: 'town',
  char: 'O',
  eventId: 'setpiece.town',
})
