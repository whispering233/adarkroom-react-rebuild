import type { WorldEntity, EntityCell, EntityDrawCommand } from './types'

export interface UniformEntityConfig {
  type: string
  char: string
  footprint?: { w: number; h: number }
  onEnter?: WorldEntity['onEnter']
  prominent?: boolean
  bold?: boolean
}

export function createUniformEntity(config: UniformEntityConfig): WorldEntity {
  const footprint = config.footprint ?? { w: 1, h: 1 }

  const getDrawCommand = (
    anchorX: number,
    anchorY: number,
    viewportOriginX: number,
    viewportOriginY: number,
    _isDimmed: boolean,
    mask: boolean[][],
    explored: boolean[][],
  ): EntityDrawCommand => {
    const cells: EntityCell[] = []

    for (let dy = 0; dy < footprint.h; dy++) {
      for (let dx = 0; dx < footprint.w; dx++) {
        const gx = anchorX + dx
        const gy = anchorY + dy
        const visible = mask[gx]?.[gy] ?? false
        const seen = explored[gx]?.[gy] ?? false
        if (!visible && !seen) continue

        cells.push({
          vx: gx - viewportOriginX,
          vy: gy - viewportOriginY,
          output: {
            char: config.char,
            prominent: config.prominent ?? true,
            bold: config.bold ?? true,
          },
        })
      }
    }

    return {
      bounds: {
        vx: anchorX - viewportOriginX,
        vy: anchorY - viewportOriginY,
        vw: footprint.w,
        vh: footprint.h,
      },
      cells,
    }
  }

  return {
    type: config.type,
    footprint,
    getDrawCommand,
    ...(config.onEnter ? { onEnter: config.onEnter } : {}),
  }
}

export function deriveEntity(
  base: WorldEntity,
  overrides: {
    type: string
    footprint?: { w: number; h: number }
    onEnter?: WorldEntity['onEnter']
    getDrawCommand?: WorldEntity['getDrawCommand']
  },
): WorldEntity {
  return { ...base, ...overrides }
}
