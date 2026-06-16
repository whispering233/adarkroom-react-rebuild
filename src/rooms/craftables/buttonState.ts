/**
 * 按钮可访问性统一计算
 *
 * 合并 evaluateUnlock + max 检查，Room 组件只需调用一次。
 * 成本提示由 Button 组件根据 cost prop 自动生成。
 */
import type { GameState } from '../../state'
import type { CraftableDef } from './types'
import { evaluateUnlock } from './unlock'

export interface ButtonState {
  /** 是否渲染按钮（false = hidden） */
  visible: boolean
  /** 是否禁用按钮 */
  disabled: boolean
}

/**
 * 计算制造物按钮的完整可访问性状态。
 * 集中了隐藏判断、解锁状态、上限，避免逻辑散落。
 * 成本提示由 Button 根据 cost prop 自动渲染，此处不再处理。
 */
export function computeButtonState(
  state: GameState,
  craftable: CraftableDef,
): ButtonState {
  const unlockState = evaluateUnlock(state, craftable)
  const current = state.game.buildings[craftable.id] ?? 0
  const isMaxed = current >= craftable.max

  if (unlockState === 'hidden') {
    return { visible: false, disabled: true }
  }

  if (isMaxed) {
    return { visible: true, disabled: true }
  }

  return {
    visible: true,
    disabled: unlockState === 'locked',
  }
}
