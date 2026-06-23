/**
 * World — City Entity
 *
 * 城市实体，2×2 多格，所有格渲染相同字符 'Y'。
 * 玩家走入时触发 setpiece.city 事件。
 */

import type { WorldEntity, EntityDrawCommand } from './types'
import type { RenderCell } from '../renderViewport'

const CHAR = 'Y'
const FONT_BOLD = 'bold 12px "Courier New", Courier, monospace'

export const cityEntity: WorldEntity = {
  type: 'city',
  footprint: { w: 2, h: 2 },

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

    for (let dy = 0; dy < 2; dy++) {
      for (let dx = 0; dx < 2; dx++) {
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
        vw: 2,
        vh: 2,
      },
      cells,
    }
  },

  onEnter() {
    return { eventId: 'setpiece.city' }
  },
}
