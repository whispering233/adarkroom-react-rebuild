/**
 * World — Village 实体
 *
 * 3×3 多格实体，渲染为带边框的盒子样式：
 *   ┌─┐
 *   │A│
 *   └─┘
 *
 * onEnter 返回 returnHome（回到暗室）+ 叙事文本。
 */

import type { WorldEntity, EntityDrawCommand } from './types'
import type { RenderCell } from '../renderViewport'
import type { EntityTriggerContext, EntityTriggerResult } from '../types'
import { WORLD } from '../constants'

// ─── 常量 ──────────────────────────────────────────────

const VIEWPORT_TOTAL = WORLD.VIEWPORT_RADIUS * 2 + 1
const LANDMARK_CHAR = 'A'

/** 3×3 盒子模式的字符映射：chars[dy][dx] */
const BOX_CHARS: string[][] = [
  ['┌', '─', '┐'],
  ['│', 'A', '│'],
  ['└', '─', '┘'],
]

// ─── 实体 ──────────────────────────────────────────────

export const villageEntity: WorldEntity = {
  type: 'village',
  footprint: { w: 3, h: 3 },

  getDrawCommand(
    anchorX: number,
    anchorY: number,
    viewportOriginX: number,
    viewportOriginY: number,
    isDimmed: boolean,
    mask: boolean[][],
    explored: boolean[][],
  ): EntityDrawCommand {
    const vx0 = anchorX - viewportOriginX
    const vy0 = anchorY - viewportOriginY
    const bounds = { vx: vx0, vy: vy0, vw: 3, vh: 3 }
    const cells: RenderCell[] = []

    for (let dy = 0; dy < 3; dy++) {
      for (let dx = 0; dx < 3; dx++) {
        const vx = vx0 + dx
        const vy = vy0 + dy

        // 视口边界检查
        if (vx < 0 || vx >= VIEWPORT_TOTAL || vy < 0 || vy >= VIEWPORT_TOTAL) continue

        // 可见性检查
        const wx = anchorX + dx
        const wy = anchorY + dy
        const isVisible = mask[wx]?.[wy] ?? false
        const isExplored = explored[wx]?.[wy] ?? false
        if (!isVisible && !isExplored) continue

        // isDimmed 时全部用地标字符（无边框细节）
        const char = isDimmed ? LANDMARK_CHAR : BOX_CHARS[dy][dx]

        cells.push({ vx, vy, char, font: '', fillStyle: '' })
      }
    }

    return { bounds, cells }
  },

  onEnter(ctx: EntityTriggerContext): EntityTriggerResult | null {
    return {
      returnHome: true,
      narrations: [ctx.t('world.landmark.village')],
    }
  },
}
