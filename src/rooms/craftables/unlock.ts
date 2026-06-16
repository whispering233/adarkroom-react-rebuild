/**
 * 解锁评估器 — 判断制造物在当前状态下是否可见/可建造
 *
 * 纯函数，不依赖 React。Room 组件在渲染时调用。
 */
import type { GameState } from '../../state'
import type { CraftableDef } from './types'

/** 解锁状态三态 */
export type UnlockState = 'hidden' | 'locked' | 'available'

/**
 * 评估制造物的解锁状态
 *
 * 规则：
 *   1. 建造者等级不足 → hidden
 *   2. 前置建筑缺失 → hidden
 *   3. 材料从未见过（值为 0）→ hidden
 *   4. 建筑类型：木材 < 成本 × 0.5 → hidden（渐进提示）
 *   5. 以上通过但资源不足 → locked（灰显）
 *   6. 全部满足 → available
 */
export function evaluateUnlock(
  state: GameState,
  craftable: CraftableDef,
): UnlockState {
  const { unlock } = craftable
  const cost = craftable.cost(state)

  // 已建造过至少一次 → 永不隐藏，只区分能否再建
  if ((state.game.buildings[craftable.id] ?? 0) > 0) {
    for (const [key, amount] of Object.entries(cost)) {
      if ((state.stores[key] ?? 0) < amount) return 'locked'
    }
    return 'available'
  }

  // ① 建造者等级
  const minBuilder = unlock.builderLevel ?? 4
  if (state.game.builder.level < minBuilder) return 'hidden'

  // ② 前置建筑
  if (unlock.building) {
    if ((state.game.buildings[unlock.building] ?? 0) === 0) return 'hidden'
  }

  // ③ 见过所有材料（值 > 0 视为见过）
  const seenKeys = unlock.seenAllOf ?? Object.keys(cost)
  for (const key of seenKeys) {
    if ((state.stores[key] ?? 0) === 0) return 'hidden'
  }

  // ④ 建筑类型：木材阈值（≥ 成本 × 0.5 才显示）
  if (craftable.type === 'building' && cost.wood > 0) {
    if ((state.stores.wood ?? 0) < cost.wood * 0.5) return 'hidden'
  }

  // ⑤ minResources 检查
  if (unlock.minResources) {
    for (const [key, min] of Object.entries(unlock.minResources)) {
      if ((state.stores[key] ?? 0) < min) return 'locked'
    }
  }

  // ⑥ 能否支付？
  for (const [key, amount] of Object.entries(cost)) {
    if ((state.stores[key] ?? 0) < amount) return 'locked'
  }

  return 'available'
}
