/**
 * Craftables — 制造系统统一导出
 *
 * 所有制造物（建筑、工具、武器、升级、交易品）在此合并。
 * 新增类型时在对应模块追加，然后在这里加入合并对象即可。
 */
import type { GameAction } from '../../state'
import { applyRecipe, modifyResource } from '../../state'
import type { CraftableDef } from './types'
import { BUILDINGS } from './buildings'

/** 所有制造物（后续可合并武器、升级等） */
export const CRAFTABLES: Record<string, CraftableDef> = {
  ...BUILDINGS,
  // ...WEAPONS,   // 后续阶段
  // ...UPGRADES,  // 后续阶段
}

export type { CraftableDef, CraftableType, UnlockCondition } from './types'
export { Effects } from './effects'
export { evaluateUnlock } from './unlock'
export type { UnlockState } from './unlock'

/**
 * 创建建造 action — 扣除资源 + 增加建筑 + 触发 onBuild 副作用。
 * 使用 modifyResource 确保资源变更被正确记录到 _pendingDeltas。
 */
export function buildCraftable(id: string): GameAction {
  const def = CRAFTABLES[id]
  if (!def) throw new Error(`Unknown craftable: ${id}`)

  return applyRecipe((draft) => {
    const current = draft.game.buildings[id] ?? 0
    if (current >= def.max) return

    // 扣除资源
    const cost = def.cost(draft)
    const source = `cost.build.${id}`
    for (const [key, amount] of Object.entries(cost)) {
      modifyResource(draft, key, -amount, source)
    }

    // 增加建筑
    draft.game.buildings[id] = current + 1

    // 触发副作用（注册收入、解锁功能等）
    def.onBuild?.(draft)
  })
}
