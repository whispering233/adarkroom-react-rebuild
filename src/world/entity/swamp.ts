/**
 * World — Swamp Entity
 *
 * 沼泽地标，1×1 单格，字符 'M'。
 * 玩家走入时触发 setpiece.swamp 事件。
 */

import { createUniformEntity } from './factory'

export const swampEntity = createUniformEntity({
  type: 'swamp',
  char: 'M',
  eventId: 'setpiece.swamp',
})
