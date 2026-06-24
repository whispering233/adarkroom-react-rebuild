/**
 * World — CoalMine 实体
 *
 * 1×1 单格实体，渲染为 'C' 字符。
 * onEnter 触发 setpiece.coalMine 事件。
 */

import { createUniformEntity } from './factory'

export const coalMineEntity = createUniformEntity({
  type: 'coalMine',
  char: 'C',
  eventId: 'setpiece.coalMine',
})
