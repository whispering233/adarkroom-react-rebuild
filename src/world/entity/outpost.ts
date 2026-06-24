/**
 * World — Outpost Entity
 *
 * 前哨实体，1×1 单格，字符 'P'。
 * 玩家走入时触发 setpiece.outpost 事件，并标记清除（绘制道路回村庄）。
 */

import type { EntityTriggerContext, EntityTriggerResult } from '../types'
import { createUniformEntity } from './factory'

export const outpostEntity = createUniformEntity({
  type: 'outpost',
  char: 'P',
  onEnter(_ctx: EntityTriggerContext): EntityTriggerResult | null {
    return { eventId: 'setpiece.outpost', clearOutpost: true }
  },
})
