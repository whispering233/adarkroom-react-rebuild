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

import type { WorldEntity, EntityDrawCommand, EntityCell } from './types'
import type { EntityTriggerContext, EntityTriggerResult } from '../types'
// ─── 常量 ──────────────────────────────────────────────
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
    const cells: EntityCell[] = []

    for (let dy = 0; dy < 3; dy++) {
      for (let dx = 0; dx < 3; dx++) {
        const vx = vx0 + dx
        const vy = vy0 + dy

        // 可见性检查
        const wx = anchorX + dx
        const wy = anchorY + dy
        const isVisible = mask[wx]?.[wy] ?? false
        const isExplored = explored[wx]?.[wy] ?? false
        if (!isVisible && !isExplored) continue

        if (isDimmed) {
          cells.push({ vx, vy, output: { char: LANDMARK_CHAR, prominent: false, bold: false } })
        } else {
          cells.push({ vx, vy, output: { char: BOX_CHARS[dy][dx], prominent: true, bold: true } })
        }
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
