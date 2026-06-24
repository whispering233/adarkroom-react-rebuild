/**
 * World — Executioner Entity
 *
 * 刽子手地标，1×1 单格，字符 'X'。
 * 玩家走入时触发 setpiece.executioner 事件。
 */

import type { EntityTriggerContext, EntityTriggerResult } from '../types'
import { createUniformEntity } from './factory'

export const executionerEntity = createUniformEntity({
  type: 'executioner',
  char: 'X',
  onEnter(_ctx: EntityTriggerContext): EntityTriggerResult | null {
    return { eventId: 'executioner', executionerFound: true }
  },
})
