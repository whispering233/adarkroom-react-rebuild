/**
 * src/world — 世界系统统一导出
 */
export * from './types'
export { WORLD, TERRAINS, LANDMARKS } from './constants'
export { generateMap, lightMap, createNewMask } from './generator'
export { composeEffects, getTerrainNarrationKey } from './effects'
