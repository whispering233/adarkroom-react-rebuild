/**
 * GameState Hooks — 访问全局游戏状态的 React Hook 集合。
 *
 * 所有 hook 均依赖 <GameProvider> 提供的 GameContext。
 */

import { useContext } from 'react'
import { GameContext } from './GameContext'
import type { GameContextValue } from './GameContext'
import type { GameState } from './types'
import type { GameAction } from './reducer'

/** 获取完整 GameContext（state + dispatch）。最底层 hook。 */
export function useGameContext(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) {
    throw new Error('useGameContext must be used within a <GameProvider>')
  }
  return ctx
}

/** 只读状态。任何 state 变更都会触发调用组件重渲染。 */
export function useGameState(): GameState {
  return useGameContext().state
}

/**
 * 获取 dispatch 函数。
 * 引用在组件生命周期内保持稳定，不随 state 变化而重渲染。
 */
export function useGameDispatch(): React.Dispatch<GameAction> {
  return useGameContext().dispatch
}
