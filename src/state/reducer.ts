/**
 * GameState Reducer — 类型安全的状态管理，替代原项目 $SM
 *
 * Actions:
 *   SET      单值设置
 *   ADD      数值增减
 *   SET_M    批量设置（同父级下）
 *   ADD_M    批量增减（同父级下）
 *   REMOVE   删除状态
 *   LOAD     从存档加载完整状态
 */

import type { GameState, IncomeConfig } from './types'
import { getPath, setPath, getCategory, parsePath } from './path'

// ─── 常量 ────────────────────────────────────────────────

/** 数值上限（与原项目一致） */
export const MAX_STORE = 99999999999999

// ─── Action 类型 ──────────────────────────────────────────

export type GameAction =
  | { type: 'SET'; path: string; value: unknown }
  | { type: 'ADD'; path: string; delta: number }
  | { type: 'SET_M'; parent: string; values: Record<string, unknown> }
  | { type: 'ADD_M'; parent: string; deltas: Record<string, number> }
  | { type: 'REMOVE'; path: string }
  | { type: 'LOAD'; state: GameState }

// ─── 更新元信息 ────────────────────────────────────────────

export interface UpdateMeta {
  /** 变更涉及的状态分类 */
  category: string
  /** 变更的完整路径 */
  stateName: string
}

/**
 * 根据 action 计算变更元信息（在 dispatch 前调用）
 * 不修改状态，仅推导 category 和 stateName
 */
export function getUpdateMeta(action: GameAction): UpdateMeta | undefined {
  switch (action.type) {
    case 'SET':
    case 'ADD':
    case 'REMOVE':
      return { category: getCategory(action.path), stateName: action.path }
    case 'SET_M':
    case 'ADD_M':
      return { category: getCategory(action.parent), stateName: action.parent }
    case 'LOAD':
      return undefined
    default:
      return undefined
  }
}

// ─── 内部工具 ────────────────────────────────────────────

function cast<T>(obj: Record<string, unknown>): T {
  return obj as unknown as T
}

// ─── Reducer ──────────────────────────────────────────────

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET': {
      const { path, value } = action
      // 数值上限
      const clamped = typeof value === 'number' && value > MAX_STORE ? MAX_STORE : value
      let next = setPath(state as unknown as Record<string, unknown>, path, clamped)

      // stores 负数保护
      if (path.startsWith('stores')) {
        const current = getPath(next as unknown as Record<string, unknown>, path) as number
        if (typeof current === 'number' && current < 0) {
          next = setPath(next as unknown as Record<string, unknown>, path, 0)
        }
      }

      return cast<GameState>(next)
    }

    case 'ADD': {
      const { path, delta } = action
      const current = getPath(state as unknown as Record<string, unknown>, path)
      const old = (typeof current === 'number' ? current : 0) as number

      if (typeof current !== 'number' && current !== undefined && current !== null) {
        console.warn(`Can not do math with state: ${path} (not a number)`)
        return state
      }

      let nextVal = old + delta
      if (nextVal > MAX_STORE) nextVal = MAX_STORE

      // stores 负数保护
      if (path.startsWith('stores') && nextVal < 0) nextVal = 0

      const next = setPath(state as unknown as Record<string, unknown>, path, nextVal)
      return cast<GameState>(next)
    }

    case 'SET_M': {
      const { parent, values } = action
      let next = state

      // 确保父级存在
      if (getPath(next as unknown as Record<string, unknown>, parent) === undefined) {
        next = cast<GameState>(setPath(next as unknown as Record<string, unknown>, parent, {}))
      }

      for (const [k, v] of Object.entries(values)) {
        const fullPath = `${parent}["${k}"]`
        const clamped = typeof v === 'number' && v > MAX_STORE ? MAX_STORE : v
        next = cast<GameState>(
          setPath(next as unknown as Record<string, unknown>, fullPath, clamped),
        )
      }

      return next
    }

    case 'ADD_M': {
      const { parent, deltas } = action
      let next = state

      // 确保父级存在
      if (getPath(next as unknown as Record<string, unknown>, parent) === undefined) {
        next = cast<GameState>(setPath(next as unknown as Record<string, unknown>, parent, {}))
      }

      for (const [k, delta] of Object.entries(deltas)) {
        const fullPath = `${parent}["${k}"]`
        const current = getPath(next as unknown as Record<string, unknown>, fullPath)
        const old = (typeof current === 'number' ? current : 0) as number
        let nextVal = old + delta
        if (nextVal > MAX_STORE) nextVal = MAX_STORE
        if (fullPath.startsWith('stores') && nextVal < 0) nextVal = 0
        next = cast<GameState>(
          setPath(next as unknown as Record<string, unknown>, fullPath, nextVal),
        )
      }

      return next
    }

    case 'REMOVE': {
      const { path } = action
      const segments = parsePath(path)
      if (segments.length === 0) return state

      // 递归浅拷贝删除
      function removeAt(
        idx: number,
        obj: Record<string, unknown>,
      ): Record<string, unknown> {
        const key = segments[idx]
        if (idx === segments.length - 1) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [key]: _removed, ...rest } = obj
          return rest
        }
        const child = obj[key] as Record<string, unknown>
        if (!child || typeof child !== 'object') return obj
        return { ...obj, [key]: removeAt(idx + 1, child) }
      }

      return cast<GameState>(removeAt(0, state as unknown as Record<string, unknown>))
    }

    case 'LOAD': {
      return action.state
    }

    default:
      return state
  }
}

// ─── 便捷 Action 创建函数 ─────────────────────────────────

export const set = (path: string, value: unknown): GameAction => ({
  type: 'SET',
  path,
  value,
})

export const add = (path: string, delta: number): GameAction => ({
  type: 'ADD',
  path,
  delta,
})

export const setM = (
  parent: string,
  values: Record<string, unknown>,
): GameAction => ({
  type: 'SET_M',
  parent,
  values,
})

export const addM = (
  parent: string,
  deltas: Record<string, number>,
): GameAction => ({
  type: 'ADD_M',
  parent,
  deltas,
})

export const remove = (path: string): GameAction => ({
  type: 'REMOVE',
  path,
})

export const load = (state: GameState): GameAction => ({
  type: 'LOAD',
  state,
})

// ─── 收入相关辅助函数 ─────────────────────────────────────

/** 设置收入来源 */
export function setIncome(
  source: string,
  options: Omit<IncomeConfig, 'timeLeft'>,
): GameAction {
  return setM('income', {
    [source]: { ...options, timeLeft: options.delay } satisfies IncomeConfig,
  })
}
