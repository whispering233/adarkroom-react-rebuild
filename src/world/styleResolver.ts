/**
 * World — StyleResolver 全局样式解析器
 *
 * 职责：
 *   将 EntityCellOutput（char + prominent + bold）+ EntityRenderInput（isDimmed）
 *   映射为具体的 fillStyle（颜色值）+ font 字符串。
 *
 * 设计要点：
 *   - 纯函数，零 DOM 访问。cssVars 由调用者（WorldCanvasScene）在初始化时
 *     从 getComputedStyle(document.documentElement) 一次性解析注入。
 *   - 配色修改只需改 CSS 变量（tokens.css），StyleResolver 零改动。
 *   - Entity 不碰 CSS 变量名——只表达视觉意图（prominent/bold）。
 */

import type { EntityCellOutput, EntityRenderInput } from './types'

// ─── 样式解析器接口 ───────────────────────────────────

export interface StyleResolver {
  resolve(cell: EntityCellOutput, input: EntityRenderInput): { fillStyle: string; font: string }
}

// ─── 字体常量 ─────────────────────────────────────────

export const FONT_NORMAL = '12px "Courier New", Courier, monospace'
export const FONT_BOLD = 'bold 12px "Courier New", Courier, monospace'

// ─── CSS 变量键名 ─────────────────────────────────────

type CssVarKey = 'accent' | 'terrain' | 'muted'

// ─── 工厂函数 ─────────────────────────────────────────

/**
 * 创建 StyleResolver 实例。
 *
 * @param cssVars - 预解析的 CSS 变量值对象，需包含以下键：
 *   - accent:   主要强调色（prominent=true 且 isDimmed=false 时使用）
 *   - terrain:  地形色（prominent=false 且 isDimmed=false 时使用）
 *   - muted:    弱化色（isDimmed=true 时使用，也用于边界墙）
 *   缺少任何键时回退到 'black'。
 */
export function createStyleResolver(cssVars: Record<string, string>): StyleResolver {
  const cssVarKeys: CssVarKey[] = ['accent', 'terrain', 'muted']
  const resolved: Record<CssVarKey, string> = { accent: 'black', terrain: 'black', muted: 'black' }
  for (const key of cssVarKeys) {
    const value = cssVars[key]?.trim()
    if (value && value.length > 0) {
      resolved[key] = value
    }
  }

  return {
    resolve(cell: EntityCellOutput, input: EntityRenderInput): { fillStyle: string; font: string } {
      const fillStyle = input.isDimmed
        ? resolved.muted
        : cell.prominent
          ? resolved.accent
          : resolved.terrain

      const font = cell.bold ? FONT_BOLD : FONT_NORMAL

      return { fillStyle, font }
    },
  }
}
