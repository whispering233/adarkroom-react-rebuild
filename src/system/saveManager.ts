/**
 * saveManager — 存档持久化模块
 *
 * 提供 localStorage 存取、Base64 编解码、版本迁移等能力。
 * 所有写入操作包裹 try/catch，QuotaExceededError 通过 onSaveError 回调报告。
 */

import type { GameState } from '../state/types'

// ─── SaveEnvelope ──────────────────────────────────────────

/** 存档信封：版本号 + 时间戳 + 游戏状态 */
export interface SaveEnvelope {
  version: number
  timestamp: number
  state: GameState
}

// ─── 错误回调 ──────────────────────────────────────────────

/** 存档写入失败时的错误报告回调（默认 null，由 UI 层注入） */
// eslint-disable-next-line prefer-const
export let onSaveError: ((msg: string) => void) | null = null

// ─── localStorage 键名 ─────────────────────────────────────

const SAVE_KEY = 'adr-save'

// ─── 本地存取 ──────────────────────────────────────────────

/**
 * 将 GameState 序列化为 JSON 存入 localStorage。
 * QuotaExceededError 会捕获并通过 onSaveError 报告。
 */
export function saveState(state: GameState): void {
  try {
    const json = JSON.stringify(state)
    localStorage.setItem(SAVE_KEY, json)
  } catch (err: unknown) {
    const msg =
      err instanceof Error && err.name === 'QuotaExceededError'
        ? 'Save failed: storage quota exceeded'
        : `Save failed: ${err instanceof Error ? err.message : String(err)}`
    onSaveError?.(msg)
  }
}

/**
 * 从 localStorage 读取并解析存档。
 * 返回 GameState（经过 migrateSave 校验），失败返回 null。
 */
export function loadState(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    return migrateSave(parsed as Record<string, unknown>)
  } catch {
    return null
  }
}

/**
 * 清除 localStorage 中的存档数据。
 */
export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY)
}

// ─── Base64 编解码 ─────────────────────────────────────────

/**
 * 将 GameState 编码为 Base64 字符串（用于导出/分享）。
 * 流程：包裹 SaveEnvelope → JSON → TextEncoder → byte array → btoa
 */
export function encodeState(state: GameState): string {
  const envelope: SaveEnvelope = {
    version: state.version,
    timestamp: Date.now(),
    state,
  }
  const json = JSON.stringify(envelope)
  const bytes = new TextEncoder().encode(json)
  const binary = String.fromCharCode(...bytes)
  return btoa(binary)
}

/**
 * 将 Base64 字符串解码为 GameState（用于导入）。
 * 流程：atob → byte array → TextDecoder → JSON.parse → 校验 SaveEnvelope
 *
 * @throws {Error} 当 Base64 无效或数据结构不符合 SaveEnvelope 时
 */
export function decodeState(b64: string): GameState {
  let binary: string
  try {
    binary = atob(b64)
  } catch {
    throw new Error('Invalid save data: not valid Base64')
  }

  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  const json = new TextDecoder().decode(bytes)

  let envelope: unknown
  try {
    envelope = JSON.parse(json)
  } catch {
    throw new Error('Invalid save data: not valid JSON')
  }

  if (
    !envelope ||
    typeof envelope !== 'object' ||
    !('version' in envelope) ||
    typeof (envelope as SaveEnvelope).version !== 'number' ||
    !('state' in envelope) ||
    !(envelope as SaveEnvelope).state
  ) {
    throw new Error('Invalid save data: missing required fields (version, state)')
  }

  return (envelope as SaveEnvelope).state as GameState
}

// ─── 版本迁移 ──────────────────────────────────────────────

/**
 * 存档版本兼容性检查。
 * - version < 1.3：返回 null（不兼容的旧存档）
 * - version >= 1.3：直接返回（当前版本，未来可在此扩展迁移逻辑）
 *
 * 这是一个占位实现，用于未来存档版本升级时插入迁移步骤。
 */
export function migrateSave(raw: Record<string, unknown>): GameState | null {
  const v = raw.version
  if (v === undefined || typeof v !== 'number' || v < 1.3) {
    return null
  }
  return raw as unknown as GameState
}
