import type { WorldEntity, EntityCatalog } from './types'

/**
 * Create visibility/exploration mask arrays from position tuples.
 */
export function makeMask(
  exploredPositions: Array<[number, number]>,
  visiblePositions: Array<[number, number]>,
): { mask: boolean[][]; explored: boolean[][] } {
  const mask: boolean[][] = []
  const explored: boolean[][] = []
  for (const [x, y] of exploredPositions) {
    explored[x] ??= []
    explored[x][y] = true
  }
  for (const [x, y] of visiblePositions) {
    mask[x] ??= []
    mask[x][y] = true
  }
  return { mask, explored }
}

/**
 * Create a minimal mock entity for testing entity catalog/buildEntityCellMap.
 */
export function createMockEntity(type: string, w: number, h: number): WorldEntity {
  return {
    type,
    footprint: { w, h },
    getDrawCommand: () => ({
      bounds: { vx: 0, vy: 0, vw: w, vh: h },
      cells: [],
    }),
  }
}

/**
 * Build an EntityCatalog from a list of mock entities.
 */
export function createCatalog(entities: WorldEntity[]): EntityCatalog {
  const cat: EntityCatalog = {}
  for (const e of entities) {
    cat[e.type] = e
  }
  return cat
}
