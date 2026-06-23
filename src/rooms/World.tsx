/**
 * World — 世界探索场景
 *
 * Canvas 地图 + 四向行走（WASD / 方向键）
 * + 补给消耗 + 随机遭遇战 + 实体地标事件触发。
 *
 * 复用现有 EventOverlay + CombatOverlay——事件通过 dispatch(startEvent) 触发，
 * CombatOverlay 由 EventOverlay 按 scene.combat=true 自动渲染。
 *
 * 移动触发逻辑：
 *   1. 通行性检查（地形 + 实体阻碍）
 *   2. 更新玩家位置 + 光照/探索/踩踏
 *   3. 地形变化叙事
 *   4. 实体 onEnter 触发（entityCellMap 查找）
 *   5. 补给消耗 + 随机遭遇战（仅当实体 onEnter 未返回 skipSupplies）
 */
import { useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useGameState,
  useGameDispatch,
  startEvent,
  applyRecipe,
  pushNarrative,
  returnFromWorld,
} from '../state'
import { WORLD, TERRAINS } from '../world/constants'
import { WORLD_ENCOUNTERS } from '../events/world/encounters'
import { lightMap } from '../world/generator'
import styles from './World.module.css'
import { renderViewport, drawComposed } from '../world/renderViewport'
import { createStyleResolver } from '../world/styleResolver'
import { createWorldCanvasScene } from '../world/WorldCanvasScene'
import { getEntity, getEntityCatalog } from '../world/entity/catalog'

export function World() {
  const { t } = useTranslation()
  const state = useGameState()
  const dispatch = useGameDispatch()

  // Stale-closure guard: always reads latest state, not render-captured copy
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state })

  const wr = state.game.worldRuntime
  const pw = state.game.world

  // ── 补给消耗 ────────────────────────────────────────
  const consumeSupplies = useCallback((): boolean => {
    let survived = true
    dispatch(applyRecipe(d => {
      const w = d.game.worldRuntime
      if (!w) return
      w.foodMove++
      w.waterMove++

      // 食物
      let foodRate = WORLD.MOVES_PER_FOOD
      if (d.character.perks?.['slow metabolism']) foodRate *= 2
      if (w.foodMove >= foodRate) {
        w.foodMove = 0
        const meat = d.outfit['cured meat'] ?? 0
        if (meat <= 0 && !w.starvation) {
          w.starvation = true
          d.narrativeLog.unshift({
            id: d._nextNarrativeId++, text: t('world.starvation'), tick: d._globalTick,
          })
        } else if (meat <= 0) {
          survived = false
        } else {
          w.starvation = false
          w.health = Math.min(w.maxHealth, w.health + WORLD.MEAT_HEAL)
          d.outfit['cured meat'] = meat - 1
        }
      }

      // 水源
      let waterRate = WORLD.MOVES_PER_WATER
      if (d.character.perks?.['desert rat']) waterRate *= 2
      if (w.waterMove >= waterRate) {
        w.waterMove = 0
        if (w.water <= 0 && !w.thirst) {
          w.thirst = true
          d.narrativeLog.unshift({
            id: d._nextNarrativeId++, text: t('world.thirst'), tick: d._globalTick,
          })
        } else if (w.water <= 0) {
          survived = false
        } else {
          w.thirst = false
          w.water--
        }
      }
    }))

    if (!survived) {
      dispatch(returnFromWorld(true))
      return false
    }
    return true
  }, [dispatch, t])

  // ── 随机遭遇战 ──────────────────────────────────────
  const checkFight = useCallback(() => {
    dispatch(applyRecipe(d => {
      const w = d.game.worldRuntime
      if (!w) return
      w.fightCounter++
      if (w.fightCounter <= WORLD.FIGHT_DELAY) return
      const chance = WORLD.FIGHT_CHANCE * (d.character.perks?.stealthy ? 0.5 : 1)
      if (Math.random() < chance) {
        w.fightCounter = 0
        const available = WORLD_ENCOUNTERS.filter(e => e.isAvailable(stateRef.current))
        if (available.length > 0) {
          const enc = available[Math.floor(Math.random() * available.length)]
          // Defer dispatch outside draft
          setTimeout(() => dispatch(startEvent(enc.id)), 0)
        }
      }
    }))
  }, [dispatch])

  // ── 移动逻辑 ────────────────────────────────────────
  const move = useCallback((dir: readonly [number, number]) => {
    const s = stateRef.current
    const wr = s.game.worldRuntime
    const pw = s.game.world
    if (!wr || !pw) return
    const curPos = wr.curPos
    const terrainMap = pw.worldMap.terrainMap
    const entityCellMap = pw.worldMap.entityCellMap
    const [nx, ny] = [curPos[0] + dir[0], curPos[1] + dir[1]]
    const size = terrainMap.length
    if (nx < 0 || nx >= size || ny < 0 || ny >= size) return

    // 通行性检查（地形）
    const terrDef = TERRAINS.find(td => td.type === terrainMap[nx][ny])
    if (!terrDef?.passable) return

    dispatch(applyRecipe(d => {
      const w = d.game.worldRuntime
      if (!w) return
      const prevTerrain = terrainMap[curPos[0]][curPos[1]]
      const newTerrain = terrainMap[nx][ny]
      w.curPos = [nx, ny]
      lightMap(w.mask, [nx, ny], WORLD.LIGHT_RADIUS)
      lightMap(w.explored, [nx, ny], WORLD.LIGHT_RADIUS)
      w.traveled[nx][ny] = true

      if (prevTerrain !== newTerrain) {
        const td = TERRAINS.find(td => td.type === newTerrain)
        const narKey = td?.narrateOnEnter?.[prevTerrain]
        if (narKey) {
          d.narrativeLog.unshift({
            id: d._nextNarrativeId++, text: t(narKey), tick: d._globalTick,
          })
        }
      }
    }))

    // 实体触发检查（entityCellMap 查找替代旧 tile.landmark）
    const cell = entityCellMap.get(`${nx},${ny}`)
    if (cell) {
      const entity = getEntity(cell.entityId)
      if (entity?.onEnter) {
        const result = entity.onEnter({
          pos: [nx, ny],
          state: s,
          dispatch,
          t,
          _globalTick: s._globalTick,
        })
        if (result) {
          // 叙事文本优先分发（确保展示在任何跳转/事件之前）
          if (result.narrations) {
            result.narrations.forEach(n => dispatch(pushNarrative(n)))
          }
          if (result.returnHome) { dispatch(returnFromWorld(false)); return }
          if (result.eventId) { dispatch(startEvent(result.eventId)) }
          if (result.skipSupplies) return
        }
      }
    }

    if (!consumeSupplies()) return
    checkFight()
  }, [dispatch, t, consumeSupplies, checkFight])

  // ── 键盘监听 ────────────────────────────────────────
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      const s = stateRef.current
      if (!s.game.worldRuntime || !s.game.world) return
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W':
          e.preventDefault(); move(WORLD.NORTH); break
        case 'ArrowDown': case 's': case 'S':
          e.preventDefault(); move(WORLD.SOUTH); break
        case 'ArrowLeft': case 'a': case 'A':
          e.preventDefault(); move(WORLD.WEST); break
        case 'ArrowRight': case 'd': case 'D':
          e.preventDefault(); move(WORLD.EAST); break
      }
    },
    [move],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  // ── Canvas 场景 ──────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<ReturnType<typeof createWorldCanvasScene> | null>(null)

  // 创建 scene（仅在挂载时一次，避免 render 期间捕获 ref）
  useEffect(() => {
    sceneRef.current = createWorldCanvasScene({
      draw: () => {
        const s = stateRef.current
        const pw = s.game.world
        const wr = s.game.worldRuntime
        if (!pw || !wr) return () => {}

        // 每帧构建 StyleResolver——从此处读取 CSS 变量，自动适配主题切换
        const cssVars = {
          accent: getComputedStyle(document.documentElement).getPropertyValue('--game-accent').trim(),
          terrain: getComputedStyle(document.documentElement).getPropertyValue('--game-terrain').trim(),
          muted: getComputedStyle(document.documentElement).getPropertyValue('--game-text-muted').trim(),
        }
        const styleResolver = createStyleResolver(cssVars)

        const result = renderViewport(
          pw.worldMap.terrainMap,
          pw.worldMap.entityLayer,
          getEntityCatalog(),
          styleResolver,
          wr.curPos,
          wr.mask,
          wr.explored,
          wr.traveled,
        )
        return (ctx: CanvasRenderingContext2D, cellSize: number) => {
          drawComposed(ctx, result, cellSize)
        }
      },
    })
    return () => { sceneRef.current = null }
  }, [])

  // 挂载/卸载 canvas 场景（仅在 worldRuntime 存在时）
  useEffect(() => {
    if (!canvasRef.current || !wr || !sceneRef.current) return
    return sceneRef.current.mount(canvasRef.current)
  }, [wr])

  return (
    <div className={styles.worldPanel}>
      {wr && pw ? (
        <div className={styles.mapContainer}>
          <canvas ref={canvasRef} className={styles.mapCanvas} />
        </div>
      ) : (
        <div>{t('world.not_available')}</div>
      )}
    </div>
  )
}
