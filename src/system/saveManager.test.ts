/**
 * saveManager.test.ts — 存档持久化模块单元测试
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest'
import { INITIAL_STATE } from '../state/types'
import {
  saveState,
  loadState,
  encodeState,
  decodeState,
  clearSave,
  migrateSave,
} from './saveManager'

// ─── localStorage mock (Node.js 环境没有浏览器 localStorage) ──

const _store = new Map<string, string>()

beforeAll(() => {
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => _store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { _store.set(key, value) }),
    removeItem: vi.fn((key: string) => { _store.delete(key) }),
    clear: vi.fn(() => { _store.clear() }),
  })
})

const SAVE_KEY = 'adr-save'

/** Helper: write raw value to the mock localStorage backing store */
function setRaw(key: string, value: string): void {
  _store.set(key, value)
}

describe('saveManager', () => {
  beforeEach(() => {
    _store.clear()
  })

  afterEach(() => {
    _store.clear()
  })

  // ── a. roundtrip: save → load ───────────────────────────
  it('saveState → loadState roundtrip should return deep-equal INITIAL_STATE', () => {
    saveState(INITIAL_STATE)
    const loaded = loadState()
    expect(loaded).not.toBeNull()
    expect(loaded).toEqual(INITIAL_STATE)
  })

  // ── b. loadState returns null when no key exists ─────────
  it('loadState should return null when no save key exists', () => {
    expect(loadState()).toBeNull()
  })

  // ── c. loadState returns null on corrupted JSON ──────────
  it('loadState should return null when localStorage has corrupted JSON', () => {
    setRaw(SAVE_KEY, 'not json')
    expect(loadState()).toBeNull()
  })

  // ── d. encodeState + decodeState roundtrip ───────────────
  it('encodeState → decodeState roundtrip should return deep-equal INITIAL_STATE', () => {
    const encoded = encodeState(INITIAL_STATE)
    const decoded = decodeState(encoded)
    expect(decoded).toEqual(INITIAL_STATE)
  })

  // ── e. decodeState throws on invalid Base64 ──────────────
  it('decodeState should throw on invalid Base64', () => {
    // Characters outside the Base64 alphabet (e.g. spaces, special chars)
    expect(() => decodeState('!!!bad!!!')).toThrow('Invalid save data')
  })

  // ── f. decodeState throws on valid Base64 but not SaveEnvelope ──
  it('decodeState should throw on valid Base64 without SaveEnvelope structure', () => {
    // btoa('{"not":"envelope"}') produces valid Base64 but missing version/state
    const validB64 = btoa('{"not":"envelope"}')
    expect(() => decodeState(validB64)).toThrow('Invalid save data')
  })

  // ── g. clearSave removes key → loadState returns null ────
  it('clearSave should remove the save key, loadState returns null after', () => {
    saveState(INITIAL_STATE)
    clearSave()
    expect(localStorage.getItem(SAVE_KEY)).toBeNull()
    expect(loadState()).toBeNull()
  })

  // ── h. migrateSave returns null for version < 1.3 ────────
  it('migrateSave should return null for version < 1.3', () => {
    expect(migrateSave({ version: 1.0 })).toBeNull()
    expect(migrateSave({ version: 1.2 })).toBeNull()
    expect(migrateSave({ version: 0 })).toBeNull()
    expect(migrateSave({})).toBeNull()
  })

  // ── i. migrateSave returns GameState for version >= 1.3 ──
  it('migrateSave should return GameState for version >= 1.3', () => {
    // Use INITIAL_STATE spread to pass all required fields
    const result = migrateSave({ ...INITIAL_STATE } as unknown as Record<string, unknown>)
    expect(result).not.toBeNull()
    expect(result?.version).toBe(1.4)

    const resultHigher = migrateSave({ ...INITIAL_STATE, version: 2.0 } as unknown as Record<string, unknown>)
    expect(resultHigher).not.toBeNull()
    expect(resultHigher?.version).toBe(2.0)
  })

  // ── j. encodeState produces valid Base64 ─────────────────
  it('encodeState should produce a Base64 string starting with valid chars', () => {
    const encoded = encodeState(INITIAL_STATE)
    // Valid Base64 alphabet: A-Z, a-z, 0-9, +, /
    const validStart = /^[A-Za-z0-9+/]/
    expect(encoded).toMatch(validStart)
    // Also verify it can be decoded back (sanity check)
    expect(() => decodeState(encoded)).not.toThrow()
  })
})
