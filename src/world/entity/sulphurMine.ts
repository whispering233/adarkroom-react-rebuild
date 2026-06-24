/**
 * World — SulphurMine 实体
 *
 * 1×1 单格实体，渲染为 'S' 字符。
 * onEnter 触发 setpiece.sulphurMine 事件。
 */

import { createUniformEntity } from './factory'

export const sulphurMineEntity = createUniformEntity({
  type: 'sulphurMine',
  char: 'S',
  eventId: 'setpiece.sulphurMine',
})
