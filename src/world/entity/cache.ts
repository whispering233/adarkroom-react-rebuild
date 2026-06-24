/**
 * World — Cache Entity
 *
 * 藏匿处地标，1×1 单格，字符 'U'。
 * 玩家走入时触发 setpiece.cache 事件。
 */

import { createUniformEntity } from './factory'

export const cacheEntity = createUniformEntity({
  type: 'cache',
  char: 'U',
  eventId: 'setpiece.cache',
})
