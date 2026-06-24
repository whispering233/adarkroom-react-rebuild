/**
 * World — Battlefield Entity
 *
 * 战场地标，1×1 单格，字符 'F'。
 * 玩家走入时触发 setpiece.battlefield 事件。
 */

import { createUniformEntity } from './factory'

export const battlefieldEntity = createUniformEntity({
  type: 'battlefield',
  char: 'F',
  eventId: 'setpiece.battlefield',
})
