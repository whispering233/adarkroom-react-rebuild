/**
 * World — IronMine 实体
 *
 * 1×1 单格实体，渲染为 'I' 字符。
 * onEnter 触发 setpiece.ironMine 事件。
 */

import { createUniformEntity } from './factory'

export const ironMineEntity = createUniformEntity({
  type: 'ironMine',
  char: 'I',
  eventId: 'setpiece.ironMine',
})
