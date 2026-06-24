/**
 * World — Borehole Entity
 *
 * 钻井地标，1×1 单格，字符 'B'。
 * 玩家走入时触发 setpiece.borehole 事件。
 */

import { createUniformEntity } from './factory'

export const boreholeEntity = createUniformEntity({
  type: 'borehole',
  char: 'B',
  eventId: 'setpiece.borehole',
})
