/**
 * World — SulphurMine 实体
 *
 * 1×1 单格实体，渲染为 'S' 字符。
 * onEnter 触发 setpiece.sulphurMine 事件。
 */

import type { WorldEntity, EntityDrawCommand } from './types'
import type { EntityTriggerContext, EntityTriggerResult } from '../types'
import { WORLD } from '../constants'

const VIEWPORT_TOTAL = WORLD.VIEWPORT_RADIUS * 2 + 1
const CHAR = 'S'

export const sulphurMineEntity: WorldEntity = {
  type: 'sulphurMine',
  footprint: { w: 1, h: 1 },

  getDrawCommand(
    anchorX: number,
    anchorY: number,
    viewportOriginX: number,
    viewportOriginY: number,
    _isDimmed: boolean,
    mask: boolean[][],
    explored: boolean[][],
  ): EntityDrawCommand {
    const vx = anchorX - viewportOriginX
    const vy = anchorY - viewportOriginY

    if (vx < 0 || vx >= VIEWPORT_TOTAL || vy < 0 || vy >= VIEWPORT_TOTAL) {
      return { bounds: { vx, vy, vw: 1, vh: 1 }, cells: [] }
    }

    const isVisible = mask[anchorX]?.[anchorY] ?? false
    const isExplored = explored[anchorX]?.[anchorY] ?? false
    if (!isVisible && !isExplored) {
      return { bounds: { vx, vy, vw: 1, vh: 1 }, cells: [] }
    }

    return {
      bounds: { vx, vy, vw: 1, vh: 1 },
      cells: [{ vx, vy, char: CHAR, font: '', fillStyle: '' }],
    }
  },

  onEnter(_ctx: EntityTriggerContext): EntityTriggerResult | null {
    return { eventId: 'setpiece.sulphurMine' }
  },
}
