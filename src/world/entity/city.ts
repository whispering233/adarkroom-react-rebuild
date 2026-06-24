/**
 * World — City Entity
 *
 * 城市实体，2×2 多格，所有格渲染相同字符 'Y'。
 * 玩家走入时触发 setpiece.city 事件。
 */

import { createUniformEntity } from './factory'

export const cityEntity = createUniformEntity({
  type: 'city',
  char: 'Y',
  eventId: 'setpiece.city',
  footprint: { w: 2, h: 2 },
})
