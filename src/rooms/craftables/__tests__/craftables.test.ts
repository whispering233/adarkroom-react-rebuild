import { describe, it, expect } from 'vitest'
import { produce } from 'immer'
import type { GameState } from '../../../state/types'
import type { GameAction } from '../../../state/reducer'

/**
 * 测试辅助：包装 gameReducer 为 (state, action) => GameState
 */
async function runReducer(
  state: GameState,
  action: GameAction,
): Promise<GameState> {
  const { gameReducer } = await import('../../../state/reducer')
  return produce(state, draft => gameReducer(draft, action))
}

describe('craftables 模块', () => {
  // ── evaluateUnlock ──────────────────────────────────

  it('evaluateUnlock: builderLevel < 4 → hidden', async () => {
    const { INITIAL_STATE } = await import('../../../state/types')
    const { CRAFTABLES, evaluateUnlock } = await import('..')
    const state = { ...INITIAL_STATE }
    state.game.builder.level = 0
    const result = evaluateUnlock(state, CRAFTABLES['trap'])
    expect(result).toBe('hidden')
  })

  it('evaluateUnlock: builderLevel >= 4 但未见材料 → hidden', async () => {
    const { INITIAL_STATE } = await import('../../../state/types')
    const { CRAFTABLES, evaluateUnlock } = await import('..')
    const state = { ...INITIAL_STATE }
    state.game.builder.level = 4
    // 无毛皮、肉 → lodge 的 seenAllOf 不满足
    const result = evaluateUnlock(state, CRAFTABLES['lodge'])
    expect(result).toBe('hidden')
  })

  it('evaluateUnlock: builderLevel >= 4 且木材不足 50% → hidden', async () => {
    const { INITIAL_STATE } = await import('../../../state/types')
    const { CRAFTABLES, evaluateUnlock } = await import('..')
    const state = { ...INITIAL_STATE }
    state.game.builder.level = 4
    state.stores.wood = 1 // trap 成本 10，50% = 5，不够
    const result = evaluateUnlock(state, CRAFTABLES['trap'])
    expect(result).toBe('hidden')
  })

  it('evaluateUnlock: 木材超过 50% 但不够全额 → locked', async () => {
    const { INITIAL_STATE } = await import('../../../state/types')
    const { CRAFTABLES, evaluateUnlock } = await import('..')
    const state = { ...INITIAL_STATE }
    state.game.builder.level = 4
    state.stores.wood = 8 // trap 成本 10，50% = 5 够了，但不够 10
    const result = evaluateUnlock(state, CRAFTABLES['trap'])
    expect(result).toBe('locked')
  })

  it('evaluateUnlock: 资源充足 → available', async () => {
    const { INITIAL_STATE } = await import('../../../state/types')
    const { CRAFTABLES, evaluateUnlock } = await import('..')
    const state = { ...INITIAL_STATE }
    state.game.builder.level = 4
    state.stores.wood = 200
    state.stores.fur = 20
    state.stores.meat = 20
    const result = evaluateUnlock(state, CRAFTABLES['lodge'])
    expect(result).toBe('available')
  })

  it('evaluateUnlock: 到达上限后仍返回 available（由组件处理 max 禁用）', async () => {
    const { INITIAL_STATE } = await import('../../../state/types')
    const { CRAFTABLES, evaluateUnlock } = await import('..')
    const state = { ...INITIAL_STATE }
    state.game.builder.level = 4
    state.stores.wood = 50
    state.game.buildings['cart'] = 1 // cart max = 1
    const result = evaluateUnlock(state, CRAFTABLES['cart'])
    // evaluateUnlock 不检查 max — 这是 UI 层的职责
    expect(result).toBe('available')
  })

  // ── buildCraftable ──────────────────────────────────

  it('buildCraftable: 扣除资源 + 增加建筑', async () => {
    const { INITIAL_STATE } = await import('../../../state/types')
    const { applyRecipe } = await import('../../../state/reducer')
    const { buildCraftable } = await import('..')

    // 准备：builder Lv4 + 足够木头
    const s0 = await runReducer(
      INITIAL_STATE,
      applyRecipe(d => {
        d.game.builder.level = 4
        d.stores.wood = 50
      }),
    )

    const s1 = await runReducer(s0, buildCraftable('trap'))
    expect(s1.stores.wood).toBe(40) // 扣了 10
    expect(s1.game.buildings['trap']).toBe(1)
    // 陷阱本身不注册收入——收入由 lodge 的 onBuild 统一注册
    expect(s1.income['trapper']).toBeUndefined()
  })

  it('buildCraftable: 动态成本 — 第二个 trap 成本更高', async () => {
    const { applyRecipe } = await import('../../../state/reducer')
    const { INITIAL_STATE } = await import('../../../state/types')
    const { buildCraftable } = await import('..')

    const s0 = await runReducer(
      INITIAL_STATE,
      applyRecipe(d => {
        d.game.builder.level = 4
        d.stores.wood = 100
        d.game.buildings['trap'] = 1
      }),
    )

    const s1 = await runReducer(s0, buildCraftable('trap'))
    // cost = 10 + (n * 10)，n 是当前拥有量，n=1 → cost = 20
    expect(s1.stores.wood).toBe(80) // 100 - 20
    expect(s1.game.buildings['trap']).toBe(2)
  })

  it('buildCraftable: 达到 max 后不再增加', async () => {
    const { applyRecipe } = await import('../../../state/reducer')
    const { INITIAL_STATE } = await import('../../../state/types')
    const { buildCraftable } = await import('..')

    const s0 = await runReducer(
      INITIAL_STATE,
      applyRecipe(d => {
        d.game.builder.level = 4
        d.stores.wood = 100
        d.game.buildings['cart'] = 1 // max = 1
      }),
    )

    const s1 = await runReducer(s0, buildCraftable('cart'))
    expect(s1.game.buildings['cart']).toBe(1) // 不变
    expect(s1.stores.wood).toBe(100) // 未扣资源
  })

  it('buildCraftable: onBuild 副作用 — hut 扣资源不增加人口（人口由定时器增长）', async () => {
    const { applyRecipe } = await import('../../../state/reducer')
    const { INITIAL_STATE } = await import('../../../state/types')
    const { buildCraftable } = await import('..')

    const s0 = await runReducer(
      INITIAL_STATE,
      applyRecipe(d => {
        d.game.builder.level = 4
        d.stores.wood = 200
      }),
    )

    const s1 = await runReducer(s0, buildCraftable('hut'))
    expect(s1.game.population).toBe(0) // hut 不再直接增加人口
    expect(s1.game.buildings['hut']).toBe(1)
    expect(s1.stores.wood).toBe(100) // 200 - 100
  })

  it('buildCraftable: onBuild 副作用 — workshop 解锁 craft 功能', async () => {
    const { applyRecipe } = await import('../../../state/reducer')
    const { INITIAL_STATE } = await import('../../../state/types')
    const { buildCraftable } = await import('..')

    const s0 = await runReducer(
      INITIAL_STATE,
      applyRecipe(d => {
        d.game.builder.level = 4
        d.stores.wood = 1000
        d.stores.leather = 100
        d.stores.scales = 10
      }),
    )

    const s1 = await runReducer(s0, buildCraftable('workshop'))
    expect(s1.features['room.craft']).toBe(true)
  })

  // ── 新物品存在性验证 ──────────────────────────────

  describe('新物品存在性验证', () => {
    const newItemIds = [
      'leather armour', 'iron armour', 'steel armour',
      'waterskin', 'cask', 'water tank',
      'rucksack', 'wagon', 'convoy',
      'bone spear', 'iron sword', 'steel sword', 'rifle',
      'torch',
    ]

    it('所有 14 个新物品存在于 CRAFTABLES 中', async () => {
      const { CRAFTABLES } = await import('..')
      for (const id of newItemIds) {
        expect(CRAFTABLES[id]).toBeDefined()
      }
    })

    it('每个物品具有合法的 CraftableDef 结构', async () => {
      const { CRAFTABLES } = await import('..')
      for (const id of newItemIds) {
        const def = CRAFTABLES[id]
        expect(def.id).toBe(id)
        expect(def.type).toMatch(/^(upgrade|weapon|tool)$/)
        expect(def.max).toBeGreaterThan(0)
        expect(def.unlock).toBeDefined()
        expect(typeof def.unlock.builderLevel).toBe('number')
        expect(typeof def.cost).toBe('function')
        expect(typeof def.onBuild).toBe('function')
      }
    })
  })

  // ── buildCraftable — 护甲升级 ─────────────────────

  describe('buildCraftable — 护甲升级', () => {
    const items: Array<[string, Record<string, number>, Record<string, number>, string]> = [
      ['leather armour', { leather: 10, scales: 20 }, { leather: -5, scales: -10 }, 'armour.leather'],
      ['iron armour', { leather: 15, iron: 15, scales: 25 }, { leather: -10, iron: -10, scales: -20 }, 'armour.iron'],
      ['steel armour', { leather: 15, steel: 25, scales: 35 }, { leather: -10, steel: -20, scales: -30 }, 'armour.steel'],
    ]

    it.each(items)('%s: 扣资源 + 计数 +1 + 解锁 feature', async (id, init, deltas, feature) => {
      const { applyRecipe } = await import('../../../state/reducer')
      const { INITIAL_STATE } = await import('../../../state/types')
      const { buildCraftable } = await import('..')

      const s0 = await runReducer(
        INITIAL_STATE,
        applyRecipe(d => {
          d.game.builder.level = 4
          for (const [key, val] of Object.entries(init)) {
            d.stores[key] = val
          }
        }),
      )

      const initialCount = s0.game.buildings[id] ?? 0
      const s1 = await runReducer(s0, buildCraftable(id))

      for (const [key, delta] of Object.entries(deltas)) {
        expect(s1.stores[key]).toBe(init[key] + delta)
      }
      expect(s1.game.buildings[id]).toBe(initialCount + 1)
      expect(s1.features[feature]).toBe(true)
    })
  })

  // ── buildCraftable — 水容器升级 ───────────────────

  describe('buildCraftable — 水容器升级', () => {
    const items: Array<[string, Record<string, number>, Record<string, number>, string]> = [
      ['waterskin', { leather: 10 }, { leather: -5 }, 'water.waterskin'],
      ['cask', { leather: 30, iron: 15 }, { leather: -20, iron: -10 }, 'water.cask'],
      ['water tank', { iron: 60, steel: 30, leather: 30 }, { iron: -50, steel: -20, leather: -20 }, 'water.tank'],
    ]

    it.each(items)('%s: 扣资源 + 计数 +1 + 解锁 feature', async (id, init, deltas, feature) => {
      const { applyRecipe } = await import('../../../state/reducer')
      const { INITIAL_STATE } = await import('../../../state/types')
      const { buildCraftable } = await import('..')

      const s0 = await runReducer(
        INITIAL_STATE,
        applyRecipe(d => {
          d.game.builder.level = 4
          for (const [key, val] of Object.entries(init)) {
            d.stores[key] = val
          }
        }),
      )

      const initialCount = s0.game.buildings[id] ?? 0
      const s1 = await runReducer(s0, buildCraftable(id))

      for (const [key, delta] of Object.entries(deltas)) {
        expect(s1.stores[key]).toBe(init[key] + delta)
      }
      expect(s1.game.buildings[id]).toBe(initialCount + 1)
      expect(s1.features[feature]).toBe(true)
    })
  })

  // ── buildCraftable — 背包升级 ─────────────────────

  describe('buildCraftable — 背包升级', () => {
    const items: Array<[string, Record<string, number>, Record<string, number>, string]> = [
      ['rucksack', { leather: 10 }, { leather: -5 }, 'bag.rucksack'],
      ['wagon', { wood: 200, iron: 15, leather: 15 }, { wood: -100, iron: -10, leather: -10 }, 'bag.wagon'],
      ['convoy', { wood: 300, iron: 50, steel: 30, leather: 30 }, { wood: -200, iron: -30, steel: -20, leather: -20 }, 'bag.convoy'],
    ]

    it.each(items)('%s: 扣资源 + 计数 +1 + 解锁 feature', async (id, init, deltas, feature) => {
      const { applyRecipe } = await import('../../../state/reducer')
      const { INITIAL_STATE } = await import('../../../state/types')
      const { buildCraftable } = await import('..')

      const s0 = await runReducer(
        INITIAL_STATE,
        applyRecipe(d => {
          d.game.builder.level = 4
          for (const [key, val] of Object.entries(init)) {
            d.stores[key] = val
          }
        }),
      )

      const initialCount = s0.game.buildings[id] ?? 0
      const s1 = await runReducer(s0, buildCraftable(id))

      for (const [key, delta] of Object.entries(deltas)) {
        expect(s1.stores[key]).toBe(init[key] + delta)
      }
      expect(s1.game.buildings[id]).toBe(initialCount + 1)
      expect(s1.features[feature]).toBe(true)
    })
  })

  // ── buildCraftable — 武器 ─────────────────────────

  describe('buildCraftable — 武器', () => {
    const items: Array<[string, Record<string, number>, Record<string, number>, string]> = [
      ['bone spear', { wood: 200, leather: 10, teeth: 15 }, { wood: -100, leather: -5, teeth: -10 }, 'weapon.bone_spear'],
      ['iron sword', { wood: 300, leather: 15, iron: 15, teeth: 15 }, { wood: -200, leather: -10, iron: -10, teeth: -10 }, 'weapon.iron_sword'],
      ['steel sword', { wood: 600, leather: 25, steel: 25, teeth: 15 }, { wood: -500, leather: -20, steel: -20, teeth: -10 }, 'weapon.steel_sword'],
      ['rifle', { wood: 300, steel: 60, sulphur: 60 }, { wood: -200, steel: -50, sulphur: -50 }, 'weapon.rifle'],
    ]

    it.each(items)('%s: 扣资源 + 计数 +1 + 解锁 feature', async (id, init, deltas, feature) => {
      const { applyRecipe } = await import('../../../state/reducer')
      const { INITIAL_STATE } = await import('../../../state/types')
      const { buildCraftable } = await import('..')

      const s0 = await runReducer(
        INITIAL_STATE,
        applyRecipe(d => {
          d.game.builder.level = 4
          for (const [key, val] of Object.entries(init)) {
            d.stores[key] = val
          }
        }),
      )

      const initialCount = s0.game.buildings[id] ?? 0
      const s1 = await runReducer(s0, buildCraftable(id))

      for (const [key, delta] of Object.entries(deltas)) {
        expect(s1.stores[key]).toBe(init[key] + delta)
      }
      expect(s1.game.buildings[id]).toBe(initialCount + 1)
      expect(s1.features[feature]).toBe(true)
    })
  })

  // ── buildCraftable — 工具 ─────────────────────────

  describe('buildCraftable — 工具', () => {
    const items: Array<[string, Record<string, number>, Record<string, number>, string]> = [
      ['torch', { wood: 5, cloth: 5 }, { wood: -1, cloth: -1 }, 'tool.torch'],
    ]

    it.each(items)('%s: 扣资源 + 计数 +1 + 解锁 feature', async (id, init, deltas, feature) => {
      const { applyRecipe } = await import('../../../state/reducer')
      const { INITIAL_STATE } = await import('../../../state/types')
      const { buildCraftable } = await import('..')

      const s0 = await runReducer(
        INITIAL_STATE,
        applyRecipe(d => {
          d.game.builder.level = 4
          for (const [key, val] of Object.entries(init)) {
            d.stores[key] = val
          }
        }),
      )

      const initialCount = s0.game.buildings[id] ?? 0
      const s1 = await runReducer(s0, buildCraftable(id))

      for (const [key, delta] of Object.entries(deltas)) {
        expect(s1.stores[key]).toBe(init[key] + delta)
      }
      expect(s1.game.buildings[id]).toBe(initialCount + 1)
      expect(s1.features[feature]).toBe(true)
    })
  })
})
