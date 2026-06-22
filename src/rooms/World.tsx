/**
 * World — 世界探索场景
 *
 * Canvas 地图 + 四向行走（WASD / 方向键）
 * + 补给消耗 + 随机遭遇战 + 地标事件触发。
 *
 * 复用现有 EventOverlay + CombatOverlay——事件通过 dispatch(startEvent) 触发，
 * CombatOverlay 由 EventOverlay 按 scene.combat=true 自动渲染。
 */
import { useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useGameState,
  useGameDispatch,
  startEvent,
  applyRecipe,
  returnFromWorld,
} from '../state'
import { WORLD, TERRAINS, LANDMARKS } from '../world/constants'
import { lightMap } from '../world/generator'
import { WORLD_ENCOUNTERS } from '../events/world/encounters'
import styles from './World.module.css'
import { renderViewport, renderTiles } from '../world/renderViewport'
import { createWorldCanvasScene } from '../world/WorldCanvasScene'
import { isTilePassable } from '../world'

export function World() {
  const { t } = useTranslation()
  const state = useGameState()
  const dispatch = useGameDispatch()

  // Stale-closure guard: always reads latest state, not render-captured copy
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state })

  const wr = state.game.worldRuntime
  const pw = state.game.world

  // ── 数据提取（空值安全）───────────────────────────────
  const water = wr?.water ?? 0
  const health = wr?.health ?? 0
  const maxHealth = wr?.maxHealth ?? 0
  const outfit = state.outfit ?? {}

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
    const tiles = pw.tiles
    const [nx, ny] = [curPos[0] + dir[0], curPos[1] + dir[1]]
    const size = tiles.length
    if (nx < 0 || nx >= size || ny < 0 || ny >= size) return

    const prevTile = tiles[curPos[0]][curPos[1]]
    const newTile = tiles[nx][ny]
    if (!isTilePassable(newTile)) return

    dispatch(applyRecipe(d => {
      const w = d.game.worldRuntime
      if (!w) return
      w.curPos = [nx, ny]
      lightMap(w.mask, [nx, ny], WORLD.LIGHT_RADIUS)
      lightMap(w.explored, [nx, ny], WORLD.LIGHT_RADIUS)
      w.traveled[nx][ny] = true

      if (prevTile.terrain !== newTile.terrain) {
        const td = TERRAINS.find(td => td.type === newTile.terrain)
        const narKey = td?.narrateOnEnter?.[prevTile.terrain]
        if (narKey) {
          d.narrativeLog.unshift({
            id: d._nextNarrativeId++, text: t(narKey), tick: d._globalTick,
          })
        }
      }
    }))

    if (newTile.landmark) {
      if (newTile.landmark === 'village') { dispatch(returnFromWorld(false)); return }
      const lm = LANDMARKS.find(l => l.type === newTile.landmark)
      if (lm) { dispatch(startEvent(lm.sceneId)) }
      return
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

  // ── 治疗 ────────────────────────────────────────────
  const heal = useCallback(
    (type: 'meat' | 'meds' | 'hypo', amount: number) => {
      dispatch(applyRecipe(d => {
        const w = d.game.worldRuntime
        if (!w) return
        const key = type === 'meat' ? 'cured meat' : type === 'meds' ? 'medicine' : 'hypo'
        if ((d.outfit[key] ?? 0) <= 0) return
        d.outfit[key] = (d.outfit[key] ?? 0) - 1
        w.health = Math.min(w.maxHealth, w.health + amount)
      }))
    },
    [dispatch],
  )

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

        const descriptors = renderViewport(pw.tiles, wr.curPos, wr.mask, wr.explored, wr.traveled)
        return (ctx: CanvasRenderingContext2D, cellSize: number) => {
          renderTiles(ctx, descriptors, cellSize)
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
        <>
          {/* HUD */}
          <div className={styles.worldHUD}>
            <div className={styles.hudItem}>
              <span className={styles.hudLabel}>{t('world.hp')}</span>
              <span className={styles.hudValue}>{health}/{maxHealth}</span>
            </div>
            <div className={styles.hudItem}>
              <span className={styles.hudLabel}>{t('world.water')}</span>
              <span className={styles.hudValue}>{water}</span>
            </div>
            <div className={styles.hudItem}>
              <span className={styles.hudLabel}>{t('cured meat')}</span>
              <span className={styles.hudValue}>{outfit['cured meat'] ?? 0}</span>
            </div>
            <button
              className={styles.healBtn}
              onClick={() => heal('meat', WORLD.MEAT_HEAL)}
              disabled={(outfit['cured meat'] ?? 0) <= 0}
            >
              {t('world.eat_meat')}
            </button>
            <button
              className={styles.healBtn}
              onClick={() => heal('meds', WORLD.MEDS_HEAL)}
              disabled={(outfit.medicine ?? 0) <= 0}
            >
              {t('world.use_meds')}
            </button>
            <button
              className={styles.healBtn}
              onClick={() => heal('hypo', WORLD.HYPO_HEAL)}
              disabled={(outfit.hypo ?? 0) <= 0}
            >
              {t('world.use_hypo')}
            </button>
            <button className={styles.healBtn} onClick={() => dispatch(returnFromWorld(false))}>
              {t('world.return_home')}
            </button>
          </div>

          {/* Map */}
          <div className={styles.mapContainer}>
            <canvas ref={canvasRef} className={styles.mapCanvas} />
          </div>
        </>
      ) : (
        <div>{t('world.not_available')}</div>
      )}
    </div>
  )
}
