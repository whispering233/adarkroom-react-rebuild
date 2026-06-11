import { describe, it, expect } from 'vitest'

describe('state 模块 (通过动态导入)', () => {
  it('path 工具：parsePath 解析 dot notation', async () => {
    const { parsePath } = await import('./path')
    expect(parsePath('stores.wood')).toEqual(['stores', 'wood'])
  })

  it('path 工具：parsePath 解析 bracket notation', async () => {
    const { parsePath } = await import('./path')
    expect(parsePath('stores["cured meat"]')).toEqual(['stores', 'cured meat'])
  })

  it('path 工具：getPath 读取嵌套值', async () => {
    const { getPath } = await import('./path')
    const obj = { stores: { wood: 10 } }
    expect(getPath(obj, 'stores.wood')).toBe(10)
  })

  it('path 工具：setPath 不可变设置', async () => {
    const { setPath } = await import('./path')
    const obj = { a: { b: 1 } }
    const next = setPath(obj, 'a.b', 2)
    expect(next).toEqual({ a: { b: 2 } })
    expect(obj.a.b).toBe(1)
  })

  it('reducer: SET 和 ADD', async () => {
    const { gameReducer, set, add } = await import('./reducer')
    const { INITIAL_STATE } = await import('./types')
    const s1 = gameReducer(INITIAL_STATE, set('stores.wood', 10))
    expect(s1.stores.wood).toBe(10)
    const s2 = gameReducer(s1, add('stores.wood', 5))
    expect(s2.stores.wood).toBe(15)
  })

  it('reducer: ADD_M 批量操作', async () => {
    const { gameReducer, setM, addM } = await import('./reducer')
    const { INITIAL_STATE } = await import('./types')
    const s1 = gameReducer(INITIAL_STATE, setM('stores', { wood: 10, fur: 5 }))
    const s2 = gameReducer(s1, addM('stores', { wood: -3, fur: 2 }))
    expect(s2.stores.wood).toBe(7)
    expect(s2.stores.fur).toBe(7)
  })

  it('reducer: 不可变性', async () => {
    const { gameReducer, set } = await import('./reducer')
    const { INITIAL_STATE } = await import('./types')
    const original = { ...INITIAL_STATE }
    gameReducer(INITIAL_STATE, set('stores.wood', 10))
    expect(INITIAL_STATE).toEqual(original)
  })

  it('reducer: LOAD 完整状态', async () => {
    const { gameReducer, load } = await import('./reducer')
    const { INITIAL_STATE } = await import('./types')
    const saved = { ...INITIAL_STATE, stores: { wood: 42 } }
    const next = gameReducer(INITIAL_STATE, load(saved))
    expect(next.stores.wood).toBe(42)
  })
})
