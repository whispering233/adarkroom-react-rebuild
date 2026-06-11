/**
 * GameContext — React Context 状态管理
 *
 * 提供：
 *   <GameProvider>         顶层包裹
 *   useGameState()         读取完整状态（触发重渲染）
 *   useGameDispatch()      获取 dispatch 函数
 *   useGameValue(path)     读取某个路径的值
 *   useOnStateChange()     订阅状态变更（类似 $.Dispatch('stateUpdate').subscribe）
 */

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import type { GameState, CategoryName } from './types'
import { INITIAL_STATE } from './types'
import type { GameAction, UpdateMeta } from './reducer'
import { gameReducer, getUpdateMeta } from './reducer'
import { getPath } from './path'

// ─── Context 类型 ─────────────────────────────────────────

export type StateChangeHandler = (meta: UpdateMeta) => void

interface GameContextValue {
  state: GameState
  dispatch: React.Dispatch<GameAction>
  /** 订阅状态变更，返回取消订阅函数 */
  subscribe: (category: string, handler: StateChangeHandler) => () => void
}

const GameContext = createContext<GameContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────

export function GameProvider({
  children,
  initialState,
}: {
  children: ReactNode
  initialState?: GameState
}) {
  const [state, dispatch] = useReducer(gameReducer, initialState ?? INITIAL_STATE)

  // 订阅者列表
  const subscribers = useRef<Map<string, Set<StateChangeHandler>>>(new Map())

  const subscribe = useCallback(
    (category: string, handler: StateChangeHandler): (() => void) => {
      if (!subscribers.current.has(category)) {
        subscribers.current.set(category, new Set())
      }
      subscribers.current.get(category)!.add(handler)

      return () => {
        subscribers.current.get(category)?.delete(handler)
      }
    },
    [],
  )

  // 包装 dispatch：在状态变更前计算元信息，dispatch 后通知订阅者
  const dispatchWithNotify = useCallback(
    (action: GameAction) => {
      const meta = getUpdateMeta(action)

      // 执行 dispatch（会触发 React 重渲染）
      dispatch(action)

      // 通知订阅者
      if (meta) {
        const { category } = meta
        subscribers.current.get(category)?.forEach((h) => h(meta))
        subscribers.current.get('all')?.forEach((h) => h(meta))
      }
    },
    [dispatch],
  )

  return (
    <GameContext.Provider value={{ state, dispatch: dispatchWithNotify, subscribe }}>
      {children}
    </GameContext.Provider>
  )
}

// ─── Hooks ────────────────────────────────────────────────

/** 获取完整 GameContext */
export function useGameContext(): GameContextValue {
  const ctx = useContext(GameContext)
  if (!ctx) {
    throw new Error('useGameContext must be used within a <GameProvider>')
  }
  return ctx
}

/** 只读状态（任何状态变更都会触发重渲染） */
export function useGameState(): GameState {
  return useGameContext().state
}

/** 获取 dispatch 函数（不因 state 变化重渲染） */
export function useGameDispatch(): React.Dispatch<GameAction> {
  return useGameContext().dispatch
}

/**
 * 读取某个路径的值（类似 $SM.get(path)）
 * 自动随状态变更重渲染
 */
export function useGameValue<T = unknown>(path: string): T | undefined {
  const { state } = useGameContext()
  return getPath(state as unknown as Record<string, unknown>, path) as T | undefined
}

/**
 * 订阅状态变更
 *
 * @param category 监听的分类名（'stores', 'game', 'features' 或 'all'）
 * @param handler  变更处理函数
 * @param deps     handler 的依赖数组
 */
export function useOnStateChange(
  category: CategoryName | 'all',
  handler: StateChangeHandler,
  deps: React.DependencyList = [],
) {
  const { subscribe } = useGameContext()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableHandler = useCallback(handler, deps)

  useEffect(() => {
    return subscribe(category, stableHandler)
  }, [category, subscribe, stableHandler])
}
