/**
 * World — Outpost Entity
 *
 * 前哨实体，1×1 单格，字符 'P'。
 * 玩家走入时触发 setpiece.outpost 事件。
 */

import { createUniformEntity } from './factory'

export const outpostEntity = createUniformEntity({
  type: 'outpost',
  char: 'P',
  eventId: 'setpiece.outpost',
})
