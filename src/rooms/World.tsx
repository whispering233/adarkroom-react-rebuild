/**
 * World — 世界探索场景
 *
 * 61×61 CSS Grid 地图 + 四向行走（WASD / 方向键 / 点击 / 按钮）
 * + 补给消耗 + 随机遭遇战 + 地标事件触发。
 *
 * 复用现有 EventOverlay + CombatOverlay——事件通过 dispatch(startEvent) 触发，
 * CombatOverlay 由 EventOverlay 按 scene.combat=true 自动渲染。
 */
import { useCallback, useEffect, useMemo } from 'react'
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

export function World() {
  const { t } = useTranslation()
  const state = useGameState()
  const dispatch = useGameDispatch()

  const wr = state.game.worldRuntime
  const pw = state.game.world

  // ── 键盘监听 ────────────────────────────────────────
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wr],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  if (!wr || !pw) {
    return <div className={styles.worldPanel}>{t('world.not_available')}</div>
  }

  const tiles = pw.tiles
  const { curPos, water, health, maxHealth } = wr
  const outfit = state.outfit ?? {}

  // ── 移动逻辑 ────────────────────────────────────────
  const move = (dir: readonly [number, number]) => {
    const [nx, ny] = [curPos[0] + dir[0], curPos[1] + dir[1]]
    const size = tiles.length
    if (nx < 0 || nx >= size || ny < 0 || ny >= size) return

    const prevTile = tiles[curPos[0]][curPos[1]]
    const newTile = tiles[nx][ny]

    // 更新位置 + 揭露地图 + 地形叙事
    dispatch(applyRecipe(d => {
      const w = d.game.worldRuntime
      if (!w) return
      w.curPos = [nx, ny]
      lightMap(d.game.world!.tiles, w.mask, [nx, ny], WORLD.LIGHT_RADIUS)

      // 地形切换叙事
      if (prevTile.terrain !== newTile.terrain) {
        const td = TERRAINS.find(td => td.type === newTile.terrain)
        const narKey = td?.narrateOnEnter?.[prevTile.terrain]
        if (narKey) {
          d.narrativeLog.unshift({
            id: d._nextNarrativeId++,
            text: t(narKey),
            tick: d._globalTick,
          })
        }
      }
    }))

    // 地标处理
    if (newTile.landmark) {
      if (newTile.landmark === 'village') {
        dispatch(returnFromWorld(false))
        return
      }
      const lm = LANDMARKS.find(l => l.type === newTile.landmark)
      if (lm) {
        dispatch(startEvent(lm.sceneId))
      }
      return
    }

    // 补给消耗
    if (!consumeSupplies()) return

    // 随机遭遇战
    checkFight()
  }

  // ── 补给消耗 ────────────────────────────────────────
  const consumeSupplies = (): boolean => {
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
  }

  // ── 随机遭遇战 ──────────────────────────────────────
  const checkFight = () => {
    dispatch(applyRecipe(d => {
      const w = d.game.worldRuntime
      if (!w) return
      w.fightCounter++
      if (w.fightCounter <= WORLD.FIGHT_DELAY) return
      const chance = WORLD.FIGHT_CHANCE * (d.character.perks?.stealthy ? 0.5 : 1)
      if (Math.random() < chance) {
        w.fightCounter = 0
        const available = WORLD_ENCOUNTERS.filter(e => e.isAvailable(state))
        if (available.length > 0) {
          const enc = available[Math.floor(Math.random() * available.length)]
          // Defer dispatch outside draft
          setTimeout(() => dispatch(startEvent(enc.id)), 0)
        }
      }
    }))
  }

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

  // ── 地图渲染（CSS Grid） ────────────────────────────
  const mapCells = useMemo(() => {
    const cells: React.ReactNode[] = []
    const size = tiles.length

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const tile = tiles[x][y]
        const masked = !wr.mask[x][y]
        const isCur = curPos[0] === x && curPos[1] === y
        const td = TERRAINS.find(t => t.type === tile.terrain)
        const lm = tile.landmark ? LANDMARKS.find(l => l.type === tile.landmark) : null

        const cls = [
          styles.tile,
          masked ? styles.masked : '',
          td && td.cssClass in styles ? styles[td.cssClass as keyof typeof styles] ?? '' : '',
          isCur ? styles.current : '',
          tile.landmark && !isCur ? styles.landmark : '',
        ].filter(Boolean).join(' ')

        let char = '&nbsp;'
        if (!masked) {
          if (isCur) char = '@'
          else if (tile.landmark) char = lm?.char ?? '?'
          else char = td?.char ?? '?'
        }

        cells.push(
          <span
            key={`${x}-${y}`}
            className={cls}
            title={lm && !masked ? t(lm.labelKey) : undefined}
            onClick={() => {
              const dx = x - curPos[0]
              const dy = y - curPos[1]
              if (Math.abs(dx) + Math.abs(dy) === 1) {
                move([Math.sign(dx), Math.sign(dy)] as readonly [number, number])
              }
            }}
            dangerouslySetInnerHTML={{ __html: char }}
          />,
        )
      }
    }
    return cells
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiles, wr.mask, curPos, t])

  return (
    <div className={styles.worldPanel}>
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
      <div className={styles.worldMap}>{mapCells}</div>

      {/* Direction Controls */}
      <div className={styles.worldControls}>
        <div className={styles.dirPad}>
          <div />
          <button className={styles.dirBtn} onClick={() => move(WORLD.NORTH)}>↑</button>
          <div />
          <button className={styles.dirBtn} onClick={() => move(WORLD.WEST)}>←</button>
          <div className={styles.dirCenter}>@</div>
          <button className={styles.dirBtn} onClick={() => move(WORLD.EAST)}>→</button>
          <div />
          <button className={styles.dirBtn} onClick={() => move(WORLD.SOUTH)}>↓</button>
          <div />
        </div>
      </div>
    </div>
  )
}
