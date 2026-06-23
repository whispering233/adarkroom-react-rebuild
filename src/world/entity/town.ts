/**
 * World — Town Entity
 *
 * 城镇实体，1×1 单格，字符 'O'。
 * 玩家走入时触发 setpiece.town 事件。
 */

import type { WorldEntity, EntityDrawCommand } from './types'
import type { RenderCell } from '../renderViewport'

const CHAR = 'O'
const FONT_BOLD = 'bold 12px "Courier New", Courier, monospace'

export const townEntity: WorldEntity = {
  type: 'town',
  footprint: { w: 1, h: 1 },

  getDrawCommand(
    anchorX: number,
    anchorY: number,
    viewportOriginX: number,
    viewportOriginY: number,
    isDimmed: boolean,
    mask: boolean[][],
    explored: boolean[][],
  ): EntityDrawCommand {
    const cells: RenderCell[] = []

    for (let dy = 0; dy < 1; dy++) {
      for (let dx = 0; dx < 1; dx++) {
        const gx = anchorX + dx
        const gy = anchorY + dy
        const visible = mask[gx]?.[gy] ?? false
        const seen = explored[gx]?.[gy] ?? false
        if (!visible && !seen) continue

        const dimmed = isDimmed || (!visible && seen)

        cells.push({
          vx: gx - viewportOriginX,
          vy: gy - viewportOriginY,
          char: CHAR,
          font: FONT_BOLD,
          fillStyle: dimmed ? 'var(--game-text-muted)' : 'var(--game-accent)',
        })
      }
    }

    return {
      bounds: {
        vx: anchorX - viewportOriginX,
        vy: anchorY - viewportOriginY,
        vw: 1,
        vh: 1,
      },
      cells,
    }
  },

  onEnter() {
    return { eventId: 'setpiece.town' }
  },
}
