/**
 * World — 组件冒烟测试
 *
 * 验证：
 *   1. 有世界数据时正常渲染
 *   2. 无世界数据时显示 world.not_available
 *   3. canvas 元素存在于 DOM
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { World } from './World'
import type { PlacedCell } from '../world/types'

// ── Mocks (for World.tsx condition) ────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const mockDispatch = vi.fn()

/** 每测试可替换的 mock state 引用（vi.mock closure 共享） */
let mockState: Record<string, unknown> = {}

vi.mock('../state', () => ({
  useGameState: () => mockState,
  useGameDispatch: () => mockDispatch,
  startEvent: vi.fn(),
  applyRecipe: vi.fn(),
  pushNarrative: vi.fn(),
  returnFromWorld: vi.fn(),
}))

// ── Helpers ───────────────────────────────────────────

/** 构建含 7×7 地图（worldMap 格式）的最小化 GameState */
function buildWorldState(): Record<string, unknown> {
  const size = 7
  const terrainMap = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => 'field' as const),
  )

  // 实体层：village 在 (3,3) 3×3 footprint
  const entityLayer = [
    { entityId: 'village', anchorX: 3, anchorY: 3 },
  ]

  // 手动构建 entityCellMap（3×3 footprint）
  const entityCellMap: Record<string, PlacedCell> = {}
  for (let dx = 0; dx < 3; dx++) {
    for (let dy = 0; dy < 3; dy++) {
      entityCellMap[`${3 + dx},${3 + dy}`] = {
        entityId: 'village',
        anchorX: 3,
        anchorY: 3,
        dx,
        dy,
      }
    }
  }

  const mask = terrainMap.map(row => row.map(() => true))

  return {
    features: {},
    currentRoom: 'world',
    stores: {},
    character: { health: 100, punches: 0, perks: {} },
    income: {},
    timers: {},
    game: {
      fire: 0,
      temperature: 0,
      builder: { level: 0 },
      buildings: {},
      population: 0,
      workers: {},
      activeEvent: null,
      narrative: { eventsCompleted: {}, flags: {} },
      // ── 世界数据（worldMap 格式） ──
      world: {
        mapId: 'test',
        worldMap: { size, terrainMap, entityLayer, entityCellMap },
        mask,
        explored: mask,
        traveled: mask,
        usedOutposts: {},
      },
      worldRuntime: {
        curPos: [3, 3] as [number, number],
        water: 50,
        health: 80,
        maxHealth: 100,
        foodMove: 0,
        waterMove: 0,
        fightCounter: 0,
        starvation: false,
        thirst: false,
        mask,
        explored: mask,
        traveled: mask,
        usedOutposts: {},
        minesFound: {},
        mapStack: [],
      },
    },
    playStats: {},
    previous: {},
    outfit: { 'cured meat': 5, medicine: 2, hypo: 1 },
    config: { soundOn: true, lightsOff: false, hyperMode: false },
    wait: {},
    cooldown: {},
    pendingRewards: {},
    resourceLog: [],
    _pendingDeltas: {},
    _pendingSources: [],
    narrativeLog: [],
    deltaLog: [],
    _nextNarrativeId: 1,
    combat: null,
    _globalTick: 0,
    version: 1.3,
  }
}

/** 构建不含 world/worldRuntime 的 state */
function buildWorldlessState(): Record<string, unknown> {
  const state = buildWorldState()
  const game = { ...(state.game as Record<string, unknown>) }
  delete game.world
  delete game.worldRuntime
  return { ...state, game }
}

// ── Polyfill jsdom 缺失的 browser API ─────────────────

beforeEach(() => {
  mockDispatch.mockClear()

  // ResizeObserver 在 jsdom 中不可用 → 提供空实现
  if (typeof window.ResizeObserver === 'undefined') {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver
  }
})

// ── Tests ──────────────────────────────────────────────

describe('World', () => {
  it('renders without crashing when world data is present', () => {
    mockState = buildWorldState()
    expect(() => render(<World />)).not.toThrow()
  })

  it('shows world.not_available when no world data', () => {
    mockState = buildWorldlessState()
    render(<World />)

    expect(screen.getByText('world.not_available')).toBeTruthy()
  })

  it('canvas element exists in DOM', () => {
    mockState = buildWorldState()
    const { container } = render(<World />)

    const canvas = container.querySelector('canvas')
    expect(canvas).not.toBeNull()
    expect(canvas!.tagName).toBe('CANVAS')
  })
})
