/**
 * src/world — 世界系统统一导出
 */
export * from './types'
export { WORLD, TERRAINS, LANDMARKS } from './constants'
export { generateMap, lightMap, createNewMask, createMask } from './generator'
export { composeEffects, getTerrainNarrationKey } from './effects'
export { createWorldCanvasScene } from './WorldCanvasScene'
export type { WorldCanvasSceneDrawFn, WorldCanvasSceneOptions } from './WorldCanvasScene'
export type { RenderCell } from './renderViewport'
export { renderViewport, renderTiles } from './renderViewport'
