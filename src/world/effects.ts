/**
 * World — TileEffect 组合函数
 *
 * 地形和地标的 TileEffectFn 在此通过 composeEffects() 合并。
 * World 组件走入一格时调用组合函数，延迟求值。
 */

import type { TileEffectFn } from './types'

/** 组合 terrain + landmark 的效果。
 *  - 数组字段（narrations/encounters）拼接
 *  - 对象字段（modifiers）浅合并
 *  - nextMapId/nextPos：landmark 优先覆盖 terrain
 */
export function composeEffects(
  terrainEffect?: TileEffectFn,
  landmarkEffect?: TileEffectFn,
): TileEffectFn {
  return (ctx) => {
    const t = terrainEffect?.(ctx) ?? {}
    const l = landmarkEffect?.(ctx) ?? {}
    return {
      narrations: [...(t.narrations ?? []), ...(l.narrations ?? [])],
      encounters: [...(t.encounters ?? []), ...(l.encounters ?? [])],
      modifiers: { ...t.modifiers, ...l.modifiers },
      nextMapId: l.nextMapId ?? t.nextMapId,
      nextPos: l.nextPos ?? t.nextPos,
    }
  }
}

/** 获取两个地形间切换时的叙事 i18n key */
export function getTerrainNarrationKey(
  from: string,
  _to: string,
  narrateMap?: Partial<Record<string, string>>,
): string | undefined {
  return narrateMap?.[from]
}
