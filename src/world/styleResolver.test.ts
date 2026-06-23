import { describe, it, expect } from 'vitest'
import { createStyleResolver, type StyleResolver } from './styleResolver'
import type { EntityCellOutput, EntityRenderInput } from './types'

// ─── 常量 ──────────────────────────────────────────────

const FONT_NORMAL = '12px "Courier New", Courier, monospace'
const FONT_BOLD = 'bold 12px "Courier New", Courier, monospace'
const ACCENT_COLOR = '#ffdd57'
const TERRAIN_COLOR = '#8a9b68'
const MUTED_COLOR = '#555555'

// ─── 辅助 ──────────────────────────────────────────────

function createTestResolver(): StyleResolver {
  return createStyleResolver({
    accent: ACCENT_COLOR,
    terrain: TERRAIN_COLOR,
    muted: MUTED_COLOR,
  })
}

// ─── 测试套件 ──────────────────────────────────────────

describe('StyleResolver', () => {
  describe('createStyleResolver returns a function', () => {
    it('returns a callable resolve function', () => {
      const r = createTestResolver()
      expect(typeof r.resolve).toBe('function')
    })
  })

  describe('resolve mapping', () => {
    it('prominent + bold + not dimmed → accent color + bold font', () => {
      const r = createTestResolver()
      const cell: EntityCellOutput = { char: 'A', prominent: true, bold: true }
      const input: EntityRenderInput = { isDimmed: false }
      const result = r.resolve(cell, input)
      expect(result.fillStyle).toBe(ACCENT_COLOR)
      expect(result.font).toBe(FONT_BOLD)
    })

    it('not prominent + not bold + dimmed → muted color + normal font', () => {
      const r = createTestResolver()
      const cell: EntityCellOutput = { char: '.', prominent: false, bold: false }
      const input: EntityRenderInput = { isDimmed: true }
      const result = r.resolve(cell, input)
      expect(result.fillStyle).toBe(MUTED_COLOR)
      expect(result.font).toBe(FONT_NORMAL)
    })

    it('prominent + not bold + dimmed → muted color + normal font', () => {
      const r = createTestResolver()
      const cell: EntityCellOutput = { char: 'A', prominent: true, bold: false }
      const input: EntityRenderInput = { isDimmed: true }
      const result = r.resolve(cell, input)
      expect(result.fillStyle).toBe(MUTED_COLOR)
      expect(result.font).toBe(FONT_NORMAL)
    })

    it('prominent + bold + dimmed → muted color + bold font', () => {
      const r = createTestResolver()
      const cell: EntityCellOutput = { char: 'A', prominent: true, bold: true }
      const input: EntityRenderInput = { isDimmed: true }
      const result = r.resolve(cell, input)
      expect(result.fillStyle).toBe(MUTED_COLOR)
      expect(result.font).toBe(FONT_BOLD)
    })

    it('not prominent + bold + not dimmed → terrain color + bold font', () => {
      const r = createTestResolver()
      const cell: EntityCellOutput = { char: '.', prominent: false, bold: true }
      const input: EntityRenderInput = { isDimmed: false }
      const result = r.resolve(cell, input)
      expect(result.fillStyle).toBe(TERRAIN_COLOR)
      expect(result.font).toBe(FONT_BOLD)
    })
  })

  describe('fallback handling', () => {
    it('missing cssVars key falls back to "black" for fillStyle', () => {
      const r = createStyleResolver({
        accent: '',
        terrain: '',
        // muted intentionally omitted
      })
      const cell: EntityCellOutput = { char: 'A', prominent: false, bold: false }
      const input: EntityRenderInput = { isDimmed: true }
      const result = r.resolve(cell, input)
      expect(result.fillStyle).toBe('black')
      expect(result.font).toBe(FONT_NORMAL)
    })
  })
})
