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
        d.stores.wood = 0
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
        d.stores.wood = 10
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
    expect(INITIAL_STATE.stores.wood).toBe(10000) // per config: wood.initial = 10000
    expect(INITIAL_STATE).toEqual(original)
  })

  // ── 边界条件 ─────────────────────────────────────────

  it('stores 负数保护：wood 不会低于 0', async () => {
    const { lightFire, applyRecipe } = await import('./reducer')
    const { INITIAL_STATE } = await import('./types')
    const s0 = await runReducer(INITIAL_STATE, applyRecipe(d => { d.stores.wood = 0 }))
    const s1 = await runReducer(s0, lightFire()) // wood=0, 扣 5
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
    expect(INITIAL_STATE.stores.wood).toBe(10000) // per config: wood.initial = 10000
    expect(INITIAL_STATE.game.fire).toBe(FireLevel.Dead)
    expect(INITIAL_STATE.game.temperature).toBe(TempLevel.Freezing)
    expect(INITIAL_STATE.game.builder.level).toBe(0)
    expect(INITIAL_STATE.character.health).toBe(100)
    expect(INITIAL_STATE.config.soundOn).toBe(true)
  })

  // ── 资源叙事生成 ──────────────────────────────────

  it('modifyResource 带 source → _pendingSources 归并', async () => {
    const { applyRecipe, modifyResource } = await import('./reducer')
    const { INITIAL_STATE } = await import('./types')
    const s1 = await runReducer(
      INITIAL_STATE,
      applyRecipe(d => {
        modifyResource(d, 'wood', 10, 'event.test')
        modifyResource(d, 'fur', 5, 'event.test')
        modifyResource(d, 'wood', -3, 'cost.other')
      }),
    )
    // 同一 source 两次调用应合并
    expect(s1._pendingSources).toHaveLength(2)
    const evt = s1._pendingSources.find(s => s.source === 'event.test')
    expect(evt).toBeDefined()
    expect(evt!.stores.wood).toBe(10)
    expect(evt!.stores.fur).toBe(5)
    const cost = s1._pendingSources.find(s => s.source === 'cost.other')
    expect(cost!.stores.wood).toBe(-3)
  })

  it('INCOME_TICK flush _pendingSources → 叙事日志含 delta', async () => {
    const { applyRecipe, incomeTick, modifyResource } = await import('./reducer')
    const { INITIAL_STATE } = await import('./types')

    // 准备带 source 的资源变更
    const s0 = await runReducer(
      INITIAL_STATE,
      applyRecipe(d => {
        modifyResource(d, 'wood', 2, 'income.builder')
      }),
    )

    const s1 = await runReducer(s0, incomeTick())
    // 应生成一条叙事
    const latest = s1.deltaLog[0]
    expect(latest).toBeDefined()
    expect(latest.delta).toBeDefined()
    expect(latest.delta!.source).toBe('income.builder')
    expect(latest.delta!.stores.wood).toBe(2)
  })

  it('INCOME_TICK 无 source 变更时不产生 delta 叙事', async () => {
    const { applyRecipe, incomeTick } = await import('./reducer')
    const { INITIAL_STATE } = await import('./types')
    // 不带 source 的资源变更
    const s0 = await runReducer(
      INITIAL_STATE,
      applyRecipe(d => {
        d.stores.wood = 100
      }),
    )
    const before = s0.deltaLog.length
    const s1 = await runReducer(s0, incomeTick())
    // 叙条目数不应因纯 _pendingDeltas 而增加（只有 _pendingSources 才生成叙事）
    expect(s1.deltaLog.length).toBe(before)
  })

  it('INCOME_TICK 清空 _pendingSources', async () => {
    const { applyRecipe, incomeTick, modifyResource } = await import('./reducer')
    const { INITIAL_STATE } = await import('./types')
    const s0 = await runReducer(
      INITIAL_STATE,
      applyRecipe(d => {
        modifyResource(d, 'wood', 5, 'income.test')
      }),
    )
    expect(s0._pendingSources.length).toBe(1)
    const s1 = await runReducer(s0, incomeTick())
    expect(s1._pendingSources.length).toBe(0)
  })

  // ─── 人口 & 工人 ──────────────────────────────────

  it('getNumGatherers: 人口 10，workers{hunter:3, trapper:2} → gatherers=5', async () => {
    const { getNumGatherers } = await import('./reducer')
    const { INITIAL_STATE } = await import('./types')
    const { applyRecipe } = await import('./reducer')
    const s = await runReducer(
      INITIAL_STATE,
      applyRecipe(d => {
        d.game.population = 10
        d.game.workers = { hunter: 3, trapper: 2 }
      }),
    )
    expect(getNumGatherers(s)).toBe(5)
  })

  it('getNumGatherers: 工人总数 > 人口 → 归零', async () => {
    const { getNumGatherers } = await import('./reducer')
    const { INITIAL_STATE } = await import('./types')
    const { applyRecipe } = await import('./reducer')
    const s = await runReducer(
      INITIAL_STATE,
      applyRecipe(d => {
        d.game.population = 2
        d.game.workers = { hunter: 3 }
      }),
    )
    expect(getNumGatherers(s)).toBe(0)
  })

  it('INCREASE_POPULATION: 有 hut 且有空位 → 人口增长', async () => {
    const { increasePopulation } = await import('./reducer')
    const { INITIAL_STATE } = await import('./types')
    const { applyRecipe } = await import('./reducer')
    const s0 = await runReducer(
      INITIAL_STATE,
      applyRecipe(d => {
        d.game.buildings['hut'] = 5 // maxPop = 20
        d.game.population = 5
      }),
    )
    const s1 = await runReducer(s0, increasePopulation())
    expect(s1.game.population).toBeGreaterThan(5)
    expect(s1.game.population).toBeLessThanOrEqual(20)
  })

  it('INCREASE_POPULATION: 无 hut → 不增长', async () => {
    const { increasePopulation } = await import('./reducer')
    const { INITIAL_STATE } = await import('./types')
    const s1 = await runReducer(INITIAL_STATE, increasePopulation())
    expect(s1.game.population).toBe(0)
  })

  it('INCREASE_POPULATION: 人口已满 → 不增长', async () => {
    const { increasePopulation } = await import('./reducer')
    const { INITIAL_STATE } = await import('./types')
    const { applyRecipe } = await import('./reducer')
    const s0 = await runReducer(
      INITIAL_STATE,
      applyRecipe(d => {
        d.game.buildings['hut'] = 2 // maxPop = 8
        d.game.population = 8
      }),
    )
    const s1 = await runReducer(s0, increasePopulation())
    expect(s1.game.population).toBe(8)
  })

  it('INCREASE_POPULATION: 可指定 num', async () => {
    const { increasePopulation } = await import('./reducer')
    const { INITIAL_STATE } = await import('./types')
    const { applyRecipe } = await import('./reducer')
    const s0 = await runReducer(
      INITIAL_STATE,
      applyRecipe(d => {
        d.game.buildings['hut'] = 10 // maxPop = 40
        d.game.population = 5
      }),
    )
    const s1 = await runReducer(s0, increasePopulation(3))
    expect(s1.game.population).toBe(8)
  })

  it('ASSIGN_WORKER: 从采集者分配 1 人到某职业', async () => {
    const { assignWorker } = await import('./reducer')
    const { INITIAL_STATE } = await import('./types')
    const { applyRecipe } = await import('./reducer')
    const s0 = await runReducer(
      INITIAL_STATE,
      applyRecipe(d => {
        d.game.population = 5
        d.game.workers = { hunter: 0 }
      }),
    )
    const s1 = await runReducer(s0, assignWorker('hunter'))
    expect(s1.game.workers['hunter']).toBe(1)
  })

  it('ASSIGN_WORKER: 采集者不足 → 不分配', async () => {
    const { assignWorker } = await import('./reducer')
    const { INITIAL_STATE } = await import('./types')
    const { applyRecipe } = await import('./reducer')
    const s0 = await runReducer(
      INITIAL_STATE,
      applyRecipe(d => {
        d.game.population = 1
        d.game.workers = { hunter: 1 } // no gatherers left
      }),
    )
    const s1 = await runReducer(s0, assignWorker('hunter'))
    expect(s1.game.workers['hunter']).toBe(1) // unchanged
  })

  it('UNASSIGN_WORKER: 从某职业退回 1 人到采集者', async () => {
    const { unassignWorker } = await import('./reducer')
    const { INITIAL_STATE } = await import('./types')
    const { applyRecipe } = await import('./reducer')
    const s0 = await runReducer(
      INITIAL_STATE,
      applyRecipe(d => {
        d.game.population = 5
        d.game.workers = { hunter: 3 }
      }),
    )
    const s1 = await runReducer(s0, unassignWorker('hunter'))
    expect(s1.game.workers['hunter']).toBe(2)
  })

  it('UNASSIGN_WORKER: 该职业无人 → 不变', async () => {
    const { unassignWorker } = await import('./reducer')
    const { INITIAL_STATE } = await import('./types')
    const { applyRecipe } = await import('./reducer')
    const s0 = await runReducer(
      INITIAL_STATE,
      applyRecipe(d => {
        d.game.population = 5
        d.game.workers = { hunter: 0 }
      }),
    )
    const s1 = await runReducer(s0, unassignWorker('hunter'))
    expect(s1.game.workers['hunter']).toBe(0)
  })

  it('KILL_VILLAGERS: 减少人口，工人不足时自动扣减', async () => {
    const { killVillagers } = await import('./reducer')
    const { INITIAL_STATE } = await import('./types')
    const { applyRecipe } = await import('./reducer')
    const s0 = await runReducer(
      INITIAL_STATE,
      applyRecipe(d => {
        d.game.population = 10
        d.game.workers = { hunter: 5, trapper: 3 } // 8 workers, 2 gatherers
      }),
    )
    const s1 = await runReducer(s0, killVillagers(4)) // kills 4: 2 gatherers + 2 workers
    expect(s1.game.population).toBe(6)
    // 8 workers now exceeds 6 population → shortfall 2 → workers should be reduced
    // trapper is reduced first (alphabetical? depends on Object.keys order)
    const totalWorkers = (s1.game.workers['hunter'] ?? 0) + (s1.game.workers['trapper'] ?? 0)
    expect(totalWorkers).toBe(6) // all remaining pop assigned as workers
  })

  it('KILL_VILLAGERS: 人口不会低于 0', async () => {
    const { killVillagers } = await import('./reducer')
    const { INITIAL_STATE } = await import('./types')
    const { applyRecipe } = await import('./reducer')
    const s0 = await runReducer(
      INITIAL_STATE,
      applyRecipe(d => {
        d.game.population = 5
      }),
    )
    const s1 = await runReducer(s0, killVillagers(100))
    expect(s1.game.population).toBe(0)
  })

  it('INCOME_TICK: gatherer 收入按剩余人口计算', async () => {
    const { incomeTick, registerIncome } = await import('./reducer')
    const { INITIAL_STATE } = await import('./types')
    const { applyRecipe } = await import('./reducer')
    const s0 = await runReducer(
      INITIAL_STATE,
      applyRecipe(d => {
        d.stores.wood = 0
        d.game.population = 3 // all gatherers
        d.game.workers = {}
      }),
    )
    // register gatherer income
    const s1 = await runReducer(s0, registerIncome('gatherer', { delay: 10, stores: { wood: 1 }, timeLeft: 10 }))
    // tick to just before income fires
    const s2 = await runReducer(s1, incomeTick())
    // After income tick, timeLeft should be 9 (was 10, -1). No income yet.
    expect(s2.income['gatherer'].timeLeft).toBe(9)

    // Fast-forward 9 more ticks to trigger income
    let s = s2
    for (let i = 0; i < 9; i++) {
      s = await runReducer(s, incomeTick())
    }
    // Income should have fired once: wood += 1 * 3 gatherers = 3
    // But we also lost 1 tick of countdown first time... let me rethink.
    // Actually: timeLeft starts at 10, first tick → 9 (no income), then 8 more ticks → 0 → income fires
    // But wait, income fires when timeLeft <= 0, then resets to delay.
    // So we need 10 ticks total for first income.
    // ticks done: 1 + 9 = 10. On the 10th tick, timeLeft becomes 0, income fires, wood+=3
    expect(s.stores.wood).toBe(3)
  })

  // ── 事件系统 ──────────────────────────────────────────

  describe('event actions', () => {
    it('START_EVENT sets activeEvent with default start scene', async () => {
      const { startEvent } = await import('./reducer')
      const { INITIAL_STATE } = await import('./types')
      const s1 = await runReducer(INITIAL_STATE, startEvent('nomad'))
      expect(s1.game.activeEvent).not.toBeNull()
      expect(s1.game.activeEvent!.eventId).toBe('nomad')
      expect(s1.game.activeEvent!.currentScene).toBe('start')
      expect(s1.game.activeEvent!.sceneHistory).toEqual([])
    })

    it('START_EVENT with custom sceneId', async () => {
      const { startEvent } = await import('./reducer')
      const { INITIAL_STATE } = await import('./types')
      const s1 = await runReducer(INITIAL_STATE, startEvent('nomad', 'trade'))
      expect(s1.game.activeEvent!.currentScene).toBe('trade')
    })

    it('GO_TO_SCENE pushes previous scene to history', async () => {
      const { goToScene, startEvent } = await import('./reducer')
      const { INITIAL_STATE } = await import('./types')
      const s0 = await runReducer(INITIAL_STATE, startEvent('nomad'))
      const s1 = await runReducer(s0, goToScene('trade'))
      expect(s1.game.activeEvent!.sceneHistory).toEqual(['start'])
      expect(s1.game.activeEvent!.currentScene).toBe('trade')
      const s2 = await runReducer(s1, goToScene('end'))
      expect(s2.game.activeEvent!.sceneHistory).toEqual(['start', 'trade'])
      expect(s2.game.activeEvent!.currentScene).toBe('end')
    })

    it('END_EVENT clears activeEvent', async () => {
      const { endEvent, startEvent } = await import('./reducer')
      const { INITIAL_STATE } = await import('./types')
      const s0 = await runReducer(INITIAL_STATE, startEvent('nomad'))
      expect(s0.game.activeEvent).not.toBeNull()
      const s1 = await runReducer(s0, endEvent())
      expect(s1.game.activeEvent).toBeNull()
    })

    it('COMPLETE_EVENT records result', async () => {
      const { completeEvent } = await import('./reducer')
      const { INITIAL_STATE } = await import('./types')
      const s1 = await runReducer(INITIAL_STATE, completeEvent('nomad', 'completed'))
      expect(s1.game.narrative.eventsCompleted['nomad']).toBe('completed')
    })

    it('SET_NARRATIVE_FLAG toggles flag', async () => {
      const { setNarrativeFlag } = await import('./reducer')
      const { INITIAL_STATE } = await import('./types')
      const s1 = await runReducer(INITIAL_STATE, setNarrativeFlag('helped_beggar', true))
      expect(s1.game.narrative.flags['helped_beggar']).toBe(true)
      const s2 = await runReducer(s1, setNarrativeFlag('helped_beggar', false))
      expect(s2.game.narrative.flags['helped_beggar']).toBe(false)
    })
  })

  // ── 战斗系统 ──────────────────────────────────────────

  describe('combat actions', () => {
    it('START_COMBAT sets combat state', async () => {
      const { startCombat } = await import('./reducer')
      const { INITIAL_STATE } = await import('./types')
      const s1 = await runReducer(
        INITIAL_STATE,
        startCombat({
          active: false,
          enemyId: 'beast',
          enemyHp: 30,
          enemyMaxHp: 30,
          playerHp: 100,
          playerMaxHp: 100,
          attackDelay: 2,
          enemyDamage: 4,
          enemyHit: 0.8,
        }),
      )
      expect(s1.combat).not.toBeNull()
      expect(s1.combat!.active).toBe(true)
      expect(s1.combat!.enemyId).toBe('beast')
      expect(s1.combat!.enemyHp).toBe(30)
      expect(s1.combat!.playerHp).toBe(100)
    })

    it('END_COMBAT clears combat', async () => {
      const { endCombat, startCombat } = await import('./reducer')
      const { INITIAL_STATE } = await import('./types')
      const s0 = await runReducer(
        INITIAL_STATE,
        startCombat({
          active: false,
          enemyId: 'beast',
          enemyHp: 30,
          enemyMaxHp: 30,
          playerHp: 100,
          playerMaxHp: 100,
        }),
      )
      expect(s0.combat).not.toBeNull()
      const s1 = await runReducer(s0, endCombat())
      expect(s1.combat).toBeNull()
    })
  })

  // ── 视图模式 ──────────────────────────────────────────

  describe('SET_VIEWPORT_MODE', () => {
    it('sets viewportMode to fullmap', async () => {
      const { setViewportMode } = await import('./reducer')
      const { INITIAL_STATE } = await import('./types')
      const s1 = await runReducer(INITIAL_STATE, setViewportMode('fullmap'))
      expect(s1.config.viewportMode).toBe('fullmap')
    })

    it('sets viewportMode to normal', async () => {
      const { setViewportMode } = await import('./reducer')
      const { INITIAL_STATE } = await import('./types')
      // Start from fullmap to verify the transition
      const s0 = await runReducer(INITIAL_STATE, setViewportMode('fullmap'))
      expect(s0.config.viewportMode).toBe('fullmap')
      const s1 = await runReducer(s0, setViewportMode('normal'))
      expect(s1.config.viewportMode).toBe('normal')
    })
  })
})
