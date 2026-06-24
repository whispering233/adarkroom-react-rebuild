/**
 * World — Ship Entity
 *
 * 飞船实体，2×2 多格，所有格渲染相同字符 'W'。
 * 玩家走入时触发 setpiece.ship 事件。
 */

import { createUniformEntity } from './factory'

export const shipEntity = createUniformEntity({
  type: 'ship',
  char: 'W',
  eventId: 'setpiece.ship',
  footprint: { w: 2, h: 2 },
})
