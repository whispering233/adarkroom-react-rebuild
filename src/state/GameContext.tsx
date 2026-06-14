/**
 * GameContext — React Context 状态管理（Immer 精简版）
 *
 * 提供 <GameProvider> 顶层包裹和 GameContext。
 * Hook 函数集中在 ./hooks.ts 中。
 */

/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  type ReactNode,
} from 'react'
import { useImmerReducer } from 'use-immer'
import type { GameState } from './types'
import { INITIAL_STATE } from './types'
import type { GameAction } from './reducer'
import { gameReducer } from './reducer'

// ─── Context ──────────────────────────────────────────────

export interface GameContextValue {
  state: GameState
  dispatch: React.Dispatch<GameAction>
}

export const GameContext = createContext<GameContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────

export function GameProvider({
  children,
  initialState,
}: {
  children: ReactNode
  initialState?: GameState
}) {
  const [state, dispatch] = useImmerReducer(
    gameReducer,
    initialState ?? INITIAL_STATE,
  )

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  )
}
