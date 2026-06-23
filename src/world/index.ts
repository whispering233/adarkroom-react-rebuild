/**
 * src/world — 世界系统统一导出
 */
export * from './types'
export { WORLD, TERRAINS, LANDMARKS } from './constants'
export { generateMap, lightMap, createNewMask, createMask } from './generator'
export { createWorldCanvasScene } from './WorldCanvasScene'
export type { WorldCanvasSceneDrawFn, WorldCanvasSceneOptions } from './WorldCanvasScene'
export type { RenderCell } from './renderViewport'
export { renderViewport, drawComposed } from './renderViewport'
export { createStyleResolver } from './styleResolver'
export type { StyleResolver } from './styleResolver'
export { buildEntityCellMap } from './entity/types'
export type { WorldEntity, EntityDrawCommand, EntityCatalog } from './entity/types'
