/**
 * World — Landmarks Entity 单元测试
 *
 * 覆盖全部 14 种地标实体的公共行为 + 多格特例 + 自定义 onEnter 特例。
 */

import { describe, it, expect } from 'vitest'
import { makeMask } from './testHelpers'
import type { WorldEntity } from './types'
import {
  battlefieldEntity,
  boreholeEntity,
  cacheEntity,
  caveEntity,
  cityEntity,
  coalMineEntity,
  executionerEntity,
  houseEntity,
  ironMineEntity,
  outpostEntity,
  shipEntity,
  sulphurMineEntity,
  swampEntity,
  townEntity,
} from './landmarks'

// ─── 实体查找表 ──────────────────────────────────────

const entities: Record<string, WorldEntity> = {
  battlefield: battlefieldEntity,
  borehole: boreholeEntity,
  cache: cacheEntity,
  cave: caveEntity,
  city: cityEntity,
  coalMine: coalMineEntity,
  executioner: executionerEntity,
  house: houseEntity,
  ironMine: ironMineEntity,
  outpost: outpostEntity,
  ship: shipEntity,
  sulphurMine: sulphurMineEntity,
  swamp: swampEntity,
  town: townEntity,
}

// ─── 多格掩码生成辅助 ──────────────────────────────────

function makeMultiMask(
  footprint: { w: number; h: number },
  anchorX: number,
  anchorY: number,
) {
  const positions: Array<[number, number]> = []
  for (let dy = 0; dy < footprint.h; dy++) {
    for (let dx = 0; dx < footprint.w; dx++) {
      positions.push([anchorX + dx, anchorY + dy])
    }
  }
  return makeMask(positions, positions)
}

// ─── Block A — 全部 14 种实体的公共测试 ───────────────

const commonCases: Array<[string, string, string, { w: number; h: number }]> = [
  ['battlefield', 'battlefield', 'F', { w: 1, h: 1 }],
  ['borehole', 'borehole', 'B', { w: 1, h: 1 }],
  ['cache', 'cache', 'U', { w: 1, h: 1 }],
  ['cave', 'cave', 'V', { w: 1, h: 1 }],
  ['city', 'city', 'Y', { w: 2, h: 2 }],
  ['coalMine', 'coalMine', 'C', { w: 1, h: 1 }],
  ['executioner', 'executioner', 'X', { w: 1, h: 1 }],
  ['house', 'house', 'H', { w: 1, h: 1 }],
  ['ironMine', 'ironMine', 'I', { w: 1, h: 1 }],
  ['outpost', 'outpost', 'P', { w: 1, h: 1 }],
  ['ship', 'ship', 'W', { w: 2, h: 2 }],
  ['sulphurMine', 'sulphurMine', 'S', { w: 1, h: 1 }],
  ['swamp', 'swamp', 'M', { w: 1, h: 1 }],
  ['town', 'town', 'O', { w: 1, h: 1 }],
]

describe.each(commonCases)('common: %s', (_name, type, char, footprint) => {
  const entity = entities[_name]

  it('has correct type and footprint', () => {
    expect(entity.type).toBe(type)
    expect(entity.footprint).toEqual(footprint)
  })

  it('getDrawCommand returns correct bounds at anchor (5,5) with viewport (0,0)', () => {
    const { mask, explored } = makeMultiMask(footprint, 5, 5)
    const result = entity.getDrawCommand(5, 5, 0, 0, false, mask, explored)
    expect(result.bounds).toEqual({ vx: 5, vy: 5, vw: footprint.w, vh: footprint.h })
  })

  it('getDrawCommand returns cell(s) with correct char when visible', () => {
    const { mask, explored } = makeMultiMask(footprint, 5, 5)
    const result = entity.getDrawCommand(5, 5, 0, 0, false, mask, explored)
    expect(result.cells).toHaveLength(footprint.w * footprint.h)
    for (const cell of result.cells) {
      expect(cell.output.char).toBe(char)
    }
  })

  it('getDrawCommand returns 0 cells when neither visible nor explored', () => {
    const { mask, explored } = makeMask([], [])
    const result = entity.getDrawCommand(5, 5, 0, 0, false, mask, explored)
    expect(result.cells).toHaveLength(0)
  })

  it('getDrawCommand shows explored-but-not-visible cells', () => {
    // explored=true, mask=false
    const positions: Array<[number, number]> = []
    for (let dy = 0; dy < footprint.h; dy++) {
      for (let dx = 0; dx < footprint.w; dx++) {
        positions.push([5 + dx, 5 + dy])
      }
    }
    const { mask, explored } = makeMask(positions, [])
    const result = entity.getDrawCommand(5, 5, 0, 0, false, mask, explored)
    expect(result.cells).toHaveLength(footprint.w * footprint.h)
  })

  it('getDrawCommand shows cells when isDimmed=true even if visible', () => {
    const { mask, explored } = makeMultiMask(footprint, 5, 5)
    const result = entity.getDrawCommand(5, 5, 0, 0, true, mask, explored)
    expect(result.cells).toHaveLength(footprint.w * footprint.h)
  })

  it('getDrawCommand computes viewport-relative coordinates (anchor 10,10, vp origin 3,7)', () => {
    const { mask, explored } = makeMultiMask(footprint, 10, 10)
    const result = entity.getDrawCommand(10, 10, 3, 7, false, mask, explored)
    if (footprint.w === 1 && footprint.h === 1) {
      expect(result.cells[0]!.vx).toBe(7)
      expect(result.cells[0]!.vy).toBe(3)
    } else {
      const vxSet = new Set(result.cells.map((c) => c.vx))
      const vySet = new Set(result.cells.map((c) => c.vy))
      expect(vxSet).toEqual(new Set([7, 8]))
      expect(vySet).toEqual(new Set([3, 4]))
    }
  })
})

// ─── Block B — 多格实体专属测试（city + ship） ──────

const multiCases: Array<[string, string]> = [
  ['city', 'Y'],
  ['ship', 'W'],
]

describe.each(multiCases)('multi-tile: %s', (name, char) => {
  const entity = entities[name]

  it('getDrawCommand returns 4 cells when all footprint tiles visible', () => {
    const { mask, explored } = makeMultiMask(entity.footprint, 5, 5)
    const result = entity.getDrawCommand(5, 5, 0, 0, false, mask, explored)
    expect(result.cells).toHaveLength(4)
  })

  it('all footprint cells render with same char', () => {
    const { mask, explored } = makeMultiMask(entity.footprint, 5, 5)
    const result = entity.getDrawCommand(5, 5, 0, 0, false, mask, explored)
    for (const cell of result.cells) {
      expect(cell.output.char).toBe(char)
    }
  })

  it('getDrawCommand returns fewer cells when some tiles not visible', () => {
    // Only 2 of 4 cells visible/explored
    const { mask, explored } = makeMask(
      [
        [5, 5],
        [6, 5],
      ],
      [
        [5, 5],
        [6, 5],
      ],
    )
    const result = entity.getDrawCommand(5, 5, 0, 0, false, mask, explored)
    expect(result.cells).toHaveLength(2)
  })

  it('viewport-relative coordinates for each cell (anchor 10,10, vp origin 2,3)', () => {
    const { mask, explored } = makeMultiMask(entity.footprint, 10, 10)
    const result = entity.getDrawCommand(10, 10, 2, 3, false, mask, explored)
    const vxSet = new Set(result.cells.map((c) => c.vx))
    const vySet = new Set(result.cells.map((c) => c.vy))
    expect(vxSet).toEqual(new Set([8, 9]))
    expect(vySet).toEqual(new Set([7, 8]))
  })
})

// ─── Block C — 自定义 onEnter 测试 ──────────────────
// 所有工厂实体的 onEnter 均在 triggerConfig 中声明式配置，
// 实体本身不再携带 onEnter 逻辑。
