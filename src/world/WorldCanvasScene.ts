/**
 * WorldCanvasScene — 纯 Canvas 渲染场景
 *
 * 与游戏状态完全解耦，只接收数据和样式。
 * 每帧 clearRect 清空后重新绘制。
 * 通过 rAF 驱动连续帧循环。
 *
 * 内部采用 SceneState 对象模式：所有运行时状态集中在 st 参数中显式传递，
 * 所有异步回调入口通过 state !== st 自检门禁防止陈旧回调泄漏。
 */

import { WORLD } from './constants'

// ─── 类型 ──────────────────────────────────────────────

export interface WorldCanvasSceneDrawFn {
  (ctx: CanvasRenderingContext2D, cellSize: number): void
}

export interface WorldCanvasSceneOptions {
  /** 每帧调用的绘制函数（通过工厂模式避免过期闭包） */
  draw: () => WorldCanvasSceneDrawFn
  /** 容器元素（用于 ResizeObserver，默认取 canvas.parentElement） */
  container?: HTMLElement
}

interface SceneState {
  canvas: HTMLCanvasElement
  cellSize: number
  canvasReady: boolean
  rafId: number
  resizeObserver: ResizeObserver | null
  mutationObserver: MutationObserver | null
}

// ─── 常量 ──────────────────────────────────────────────

const VIEWPORT_TOTAL = WORLD.VIEWPORT_RADIUS * 2 + 1

// ─── 内部纯函数 ────────────────────────────────────────

function calcCellSize(w: number, h: number): number {
  return Math.max(6, Math.floor(Math.min(w, h) / VIEWPORT_TOTAL))
}

function applySize(st: SceneState, container: HTMLElement): boolean {
  const { width: w, height: h } = container.getBoundingClientRect()
  const next = calcCellSize(w, h)
  if (next === st.cellSize && st.canvasReady) return false

  st.cellSize = next
  const dpr = window.devicePixelRatio || 1
  const logicalSize = next * VIEWPORT_TOTAL

  st.canvas.width = Math.round(logicalSize * dpr)
  st.canvas.height = Math.round(logicalSize * dpr)
  st.canvas.style.width = `${logicalSize}px`
  st.canvas.style.height = `${logicalSize}px`

  st.canvasReady = true
  return true
}

function drawFrame(st: SceneState, options: WorldCanvasSceneOptions): void {
  if (!st.canvasReady) return
  const ctx = st.canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, st.canvas.width, st.canvas.height)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const drawFn = options.draw()
  drawFn(ctx, st.cellSize)
}

// ─── 工厂 ──────────────────────────────────────────────

export function createWorldCanvasScene(options: WorldCanvasSceneOptions) {
  let state: SceneState | null = null

  // --- 帧循环 ---

  function loop(st: SceneState): void {
    if (state !== st) return         // 已被卸载，立即停止
    drawFrame(st, options)
    st.rafId = requestAnimationFrame(() => loop(st))
  }

  // --- Observers ---

  function setupResizeObserver(st: SceneState, cont: HTMLElement): ResizeObserver {
    const ob = new ResizeObserver(() => {
      if (state !== st) return       // 已被卸载
      if (applySize(st, cont)) drawFrame(st, options)
    })
    ob.observe(cont)
    return ob
  }

  function setupThemeObserver(st: SceneState): MutationObserver {
    const ob = new MutationObserver(() => {
      if (state !== st) return       // 已被卸载
      drawFrame(st, options)
    })
    ob.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    return ob
  }

  // --- 生命周期 ---

  function mount(canvas: HTMLCanvasElement): () => void {
    unmount()

    const cont = options.container ?? canvas.parentElement ?? canvas

    const st: SceneState = {
      canvas,
      cellSize: 0,
      canvasReady: false,
      rafId: 0,
      resizeObserver: null,
      mutationObserver: null,
    }
    state = st

    applySize(st, cont)
    st.resizeObserver = setupResizeObserver(st, cont)
    st.mutationObserver = setupThemeObserver(st)
    st.rafId = requestAnimationFrame(() => loop(st))

    return () => unmount()
  }

  function unmount(): void {
    if (!state) return
    cancelAnimationFrame(state.rafId)
    state.resizeObserver?.disconnect()
    state.mutationObserver?.disconnect()
    state = null
  }

  function requestDraw(): void {
    if (!state) return
    drawFrame(state, options)
  }

  return { mount, requestDraw }
}
