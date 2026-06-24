/**
 * World — House 实体
 *
 * 1×1 单格实体，渲染为 'H' 字符。
 * onEnter 触发 setpiece.house 事件。
 */

import { createUniformEntity } from './factory'

export const houseEntity = createUniformEntity({
  type: 'house',
  char: 'H',
  eventId: 'setpiece.house',
})
