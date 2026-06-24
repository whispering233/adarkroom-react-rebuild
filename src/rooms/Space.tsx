/**
 * Space — Canvas 太空飞行小游戏
 *
 * 操控飞船躲避小行星，坚持 60 秒即可抵达太空。
 * WASD / 方向键控制移动，碰撞会损耗船体。
 */
import { useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameState, useGameDispatch, applyRecipe, savePrestige, pushNarrative } from '../state'

// ─── Constants
const CANVAS = 500
const SHIP_HALF = 8
const AST_HALF = 12
const BASE_SPEED = 3
const WIN_TIME = 60

interface Asteroid { x: number; y: number; char: string; speed: number }
const AST_CHARS = ['#', '$', '%', '&', 'H']

export function Space() {
  const { t } = useTranslation()
  const state = useGameState()
  const dispatch = useGameDispatch()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const hull = state.game.spaceShip?.hull ?? 0
  const thrusters = state.game.spaceShip?.thrusters ?? 1
  const shipSpeed = BASE_SPEED + thrusters

  const gameRef = useRef({
    shipX: CANVAS / 2, shipY: CANVAS / 2,
    hull, thrusters,
    asteroids: [] as Asteroid[],
    keys: { up: false, down: false, left: false, right: false },
    started: 0, altitude: 0, done: false,
    rafId: 0, spawnId: 0,
  })

  useEffect(() => {
    const g = gameRef.current
    g.hull = hull
    g.thrusters = thrusters
  }, [hull, thrusters])

  // ── Game loop
  const loop = useCallback(() => {
    const g = gameRef.current
    const canvas = canvasRef.current
    if (!canvas || g.done) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const elapsed = (Date.now() - g.started) / 1000
    g.altitude = Math.min(60, Math.floor(elapsed))

    // Clear
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, CANVAS, CANVAS)

    // Stars
    ctx.fillStyle = '#333'
    ctx.font = '10px monospace'
    for (let i = 0; i < 80; i++) {
      const sx = (i * 73 + 17) % CANVAS
      const sy = (i * 47 + 31 + elapsed * 30) % CANVAS
      ctx.fillText('.', sx, sy)
    }

    // Move ship
    if (g.keys.up) g.shipY = Math.max(SHIP_HALF, g.shipY - shipSpeed)
    if (g.keys.down) g.shipY = Math.min(CANVAS - SHIP_HALF, g.shipY + shipSpeed)
    if (g.keys.left) g.shipX = Math.max(SHIP_HALF, g.shipX - shipSpeed)
    if (g.keys.right) g.shipX = Math.min(CANVAS - SHIP_HALF, g.shipX + shipSpeed)

    // Spawn asteroids
    const spawnChance = 0.01 + g.altitude * 0.003
    if (Math.random() < spawnChance) {
      g.asteroids.push({
        x: Math.random() * (CANVAS - 20) + 10,
        y: -20,
        char: AST_CHARS[Math.floor(Math.random() * AST_CHARS.length)],
        speed: 1 + Math.random() * 2 + g.altitude * 0.05,
      })
    }

    // Move & check asteroids
    ctx.font = '20px monospace'
    for (let i = g.asteroids.length - 1; i >= 0; i--) {
      const a = g.asteroids[i]
      a.y += a.speed
      if (a.y > CANVAS + 20) { g.asteroids.splice(i, 1); continue }

      ctx.fillStyle = '#c44'
      ctx.fillText(a.char, a.x - AST_HALF + 4, a.y + AST_HALF - 4)

      // Collision check (AABB)
      if (
        a.x > g.shipX - SHIP_HALF && a.x < g.shipX + SHIP_HALF &&
        a.y > g.shipY - SHIP_HALF && a.y < g.shipY + SHIP_HALF
      ) {
        g.hull--
        g.asteroids.splice(i, 1)
        if (g.hull <= 0) {
          // CRASH
          g.done = true
          cancelAnimationFrame(g.rafId)
          dispatch(applyRecipe(d => {
            d.cooldown['embark'] = 120
            d.currentRoom = 'ship'
          }))
          dispatch(pushNarrative(t('ship.crash')))
          return
        }
      }
    }

    // Draw ship
    ctx.fillStyle = '#0f0'
    ctx.font = '18px monospace'
    ctx.fillText('@', g.shipX - SHIP_HALF + 4, g.shipY + SHIP_HALF - 4)

    // HUD
    ctx.fillStyle = '#fff'
    ctx.font = '14px monospace'
    ctx.fillText(`Hull: ${g.hull}`, 10, 20)
    ctx.fillText(`Alt: ${g.altitude}`, 10, 40)
    ctx.fillText(`Time: ${Math.max(0, WIN_TIME - Math.floor(elapsed))}s`, 10, 60)

    // Win check
    if (elapsed >= WIN_TIME) {
      g.done = true
      cancelAnimationFrame(g.rafId)
      dispatch(savePrestige())
      dispatch(pushNarrative(t('ship.win')))
      // Return to ship after win
      setTimeout(() => {
        dispatch(applyRecipe(d => { d.currentRoom = 'ship' }))
      }, 3000)
      return
    }

    g.rafId = requestAnimationFrame(loop)
  }, [dispatch, t, shipSpeed])

  // ── Keyboard
  useEffect(() => {
    const g = gameRef.current
    const hd = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': e.preventDefault(); g.keys.up = true; break
        case 'ArrowDown': case 's': case 'S': e.preventDefault(); g.keys.down = true; break
        case 'ArrowLeft': case 'a': case 'A': e.preventDefault(); g.keys.left = true; break
        case 'ArrowRight': case 'd': case 'D': e.preventDefault(); g.keys.right = true; break
      }
    }
    const hu = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': g.keys.up = false; break
        case 'ArrowDown': case 's': case 'S': g.keys.down = false; break
        case 'ArrowLeft': case 'a': case 'A': g.keys.left = false; break
        case 'ArrowRight': case 'd': case 'D': g.keys.right = false; break
      }
    }
    window.addEventListener('keydown', hd)
    window.addEventListener('keyup', hu)
    return () => { window.removeEventListener('keydown', hd); window.removeEventListener('keyup', hu) }
  }, [])

  // ── Start
  useEffect(() => {
    const g = gameRef.current
    g.started = Date.now()
    g.rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(g.rafId)
  }, [loop])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: '#000' }}>
      <canvas ref={canvasRef} width={CANVAS} height={CANVAS}
        style={{ border: '1px solid var(--game-border, #444)' }}
      />
    </div>
  )
}
