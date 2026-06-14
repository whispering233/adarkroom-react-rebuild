import { describe, it, expect } from 'vitest'
import { produce } from 'immer'
import type { GameState } from './types'
import type { GameAction } from './reducer'

/**
 * 测试辅助：将 draft-recipe 形式的 gameReducer 包装为
 * 旧版 (state, action) => GameState 签名，方便链式调用测试。
 */
async function runReducer(
  state: GameState,
  action: GameAction,
): Promise<GameState> {
  const { gameReducer } = await import('./reducer')
  return produce(state, draft => gameReducer(draft, action))
}

describe('state 模块 (useImmerReducer 版)', () => {
  // ── 语义 action 测试 ──────────────────────────────────

  it('LIGHT_FIRE: 扣 5 木，火堆点燃为 Burning', async () => {
    const { lightFire } = await import('./reducer')
    const { INITIAL_STATE } = await import('./types')
    const { applyRecipe } = await import('./reducer')
    // 确保有足够木头
    const s0 = await runReducer(
      INITIAL_STATE,
      applyRecipe(d => {
        d.stores.wood = 10
      }),
    )
    const s1 = await runReducer(s0, lightFire())
    expect(s1.stores.wood).toBe(5)
    expect(s1.game.fire).toBe(3) // FireLevel.Burning
  })

  it('STOKE_FIRE: 扣 1 木，火堆 +1', async () => {
    const { stokeFire, applyRecipe } = await import('./reducer')
    const { INITIAL_STATE, FireLevel } = await import('./types')
    const s0 = await runReducer(
      INITIAL_STATE,
      applyRecipe(d => {
        d.stores.wood = 5
        d.game.fire = FireLevel.Flickering
      }),
    )
    const s1 = await runReducer(s0, stokeFire())
    expect(s1.stores.wood).toBe(4)
    expect(s1.game.fire).toBe(FireLevel.Burning)
  })

  it('STOKE_FIRE: 火堆已达 Roaring 不再增长', async () => {
    const { stokeFire, applyRecipe } = await import('./reducer')
    const { INITIAL_STATE, FireLevel } = await import('./types')
    const s0 = await runReducer(
      INITIAL_STATE,
      applyRecipe(d => {
        d.stores.wood = 10
        d.game.fire = FireLevel.Roaring
      }),
    )
    const s1 = await runReducer(s0, stokeFire())
    expect(s1.game.fire).toBe(FireLevel.Roaring)
  })

  it('FIRE_COOL: 火堆 -1', async () => {
    const { fireCool, applyRecipe } = await import('./reducer')
    const { INITIAL_STATE, FireLevel } = await import('./types')
    const s0 = await runReducer(
      INITIAL_STATE,
      applyRecipe(d => {
        d.game.fire = FireLevel.Burning
      }),
    )
    const s1 = await runReducer(s0, fireCool())
    expect(s1.game.fire).toBe(FireLevel.Flickering)
  })

  it('FIRE_COOL: 火堆 Dead 不再下降', async () => {
    const { fireCool } = await import('./reducer')
    const { INITIAL_STATE } = await import('./types')
    const s1 = await runReducer(INITIAL_STATE, fireCool())
    expect(s1.game.fire).toBe(0) // FireLevel.Dead
  })

  it('TEMP_INCREASE / TEMP_DECREASE: 温度边界', async () => {
    const { tempIncrease, tempDecrease, applyRecipe } =
      await import('./reducer')
    const { INITIAL_STATE, TempLevel } = await import('./types')
    const s0 = await runReducer(
      INITIAL_STATE,
      applyRecipe(d => {
        d.game.temperature = TempLevel.Mild
      }),
    )
    const s1 = await runReducer(s0, tempIncrease())
    expect(s1.game.temperature).toBe(TempLevel.Warm)
    const s2 = await runReducer(s1, tempDecrease())
    expect(s2.game.temperature).toBe(TempLevel.Mild)
  })

  it('BUILDER_ADVANCE: 建造者升级', async () => {
    const { builderAdvance } = await import('./reducer')
    const { INITIAL_STATE } = await import('./types')
    const s1 = await runReducer(INITIAL_STATE, builderAdvance(1))
    expect(s1.game.builder.level).toBe(1)
    const s2 = await runReducer(s1, builderAdvance(4))
    expect(s2.game.builder.level).toBe(4)
  })

  it('UNLOCK_FEATURE: 解锁标记', async () => {
    const { unlockFeature } = await import('./reducer')
    const { INITIAL_STATE } = await import('./types')
    const s1 = await runReducer(
      INITIAL_STATE,
      unlockFeature('location.outside'),
    )
    expect(s1.features['location.outside']).toBe(true)
  })

  it('INCOME_TICK: 推进倒计时并触发收入', async () => {
    const { incomeTick, applyRecipe } = await import('./reducer')
    const { INITIAL_STATE } = await import('./types')
    // 注册一个 2 秒周期的 builder 收入
    const s0 = await runReducer(
      INITIAL_STATE,
      applyRecipe(d => {
        d.income.builder = { delay: 2, stores: { wood: 3 }, timeLeft: 2 }
      }),
    )
    // Tick 1: timeLeft 2→1
    const s1 = await runReducer(s0, incomeTick())
    expect(s1.income.builder.timeLeft).toBe(1)
    expect(s1.stores.wood).toBe(0) // 还没触发

    // Tick 2: timeLeft 1→0→触发，reset 为 delay
    const s2 = await runReducer(s1, incomeTick())
    expect(s2.income.builder.timeLeft).toBe(2)
    expect(s2.stores.wood).toBe(3)
  })

  // ── APPLY_RECIPE 测试 ─────────────────────────────────

  it('APPLY_RECIPE: 通用资源修改', async () => {
    const { applyRecipe } = await import('./reducer')
    const { INITIAL_STATE } = await import('./types')
    const s1 = await runReducer(
      INITIAL_STATE,
      applyRecipe(d => {
        d.stores.wood += 10
        d.stores.fur += 5
      }),
    )
    expect(s1.stores.wood).toBe(10)
    expect(s1.stores.fur).toBe(5)
  })

  it('APPLY_RECIPE: 动态资源键', async () => {
    const { applyRecipe } = await import('./reducer')
    const { INITIAL_STATE } = await import('./types')
    const s1 = await runReducer(
      INITIAL_STATE,
      applyRecipe(d => {
        d.stores['alien alloy'] = 5
      }),
    )
    expect(s1.stores['alien alloy']).toBe(5)
  })

  // ── LOAD_SAVE ─────────────────────────────────────────

  it('LOAD_SAVE: 加载完整存档', async () => {
    const { loadSave, applyRecipe } = await import('./reducer')
    const { INITIAL_STATE } = await import('./types')
    const saved = await runReducer(
      INITIAL_STATE,
      applyRecipe(d => {
        d.stores.wood = 42
        d.game.fire = 4 // Roaring
      }),
    )
    const next = await runReducer(INITIAL_STATE, loadSave(saved))
    expect(next.stores.wood).toBe(42)
    expect(next.game.fire).toBe(4)
  })

  // ── 不可变性 ─────────────────────────────────────────

  it('reducer: 不可变性 — 原 state 不受影响', async () => {
    const { applyRecipe } = await import('./reducer')
    const { INITIAL_STATE } = await import('./types')
    const original = JSON.parse(JSON.stringify(INITIAL_STATE))
    await runReducer(
      INITIAL_STATE,
      applyRecipe(d => {
        d.stores.wood = 100
      }),
    )
    // 检查 INITIAL_STATE 未被修改
    expect(INITIAL_STATE.stores.wood).toBe(0)
    expect(INITIAL_STATE).toEqual(original)
  })

  // ── 边界条件 ─────────────────────────────────────────

  it('stores 负数保护：wood 不会低于 0', async () => {
    const { lightFire } = await import('./reducer')
    const { INITIAL_STATE } = await import('./types')
    const s1 = await runReducer(INITIAL_STATE, lightFire()) // wood=0, 扣 5
    expect(s1.stores.wood).toBe(0) // 不能为负
  })

  it('MAX_STORE 上限保护', async () => {
    const { applyRecipe, MAX_STORE, incomeTick } =
      await import('./reducer')
    const { INITIAL_STATE } = await import('./types')
    const s0 = await runReducer(
      INITIAL_STATE,
      applyRecipe(d => {
        d.stores.wood = MAX_STORE
        d.income.builder = { delay: 1, stores: { wood: 100 }, timeLeft: 1 }
      }),
    )
    const s1 = await runReducer(s0, incomeTick())
    expect(s1.stores.wood).toBe(MAX_STORE) // 被上限截断
  })

  it('初始状态全默认值', async () => {
    const { INITIAL_STATE, FireLevel, TempLevel } = await import('./types')
    expect(INITIAL_STATE.stores.wood).toBe(0)
    expect(INITIAL_STATE.game.fire).toBe(FireLevel.Dead)
    expect(INITIAL_STATE.game.temperature).toBe(TempLevel.Freezing)
    expect(INITIAL_STATE.game.builder.level).toBe(-1)
    expect(INITIAL_STATE.character.health).toBe(100)
    expect(INITIAL_STATE.config.soundOn).toBe(true)
  })
})
