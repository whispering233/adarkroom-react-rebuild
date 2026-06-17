/**
 * gameSpeed — 游戏速度共享模块
 *
 * 管理倍速设定（1× / 2× / 3×），持久化到 localStorage。
 * 通过订阅模式让 GameLoop 和 Toolbar 共享同一 speed 值。
 */
import { useState, useEffect, useCallback } from 'react'

// ─── 常量 ─────────────────────────────────────────────────

const SPEED_KEY = 'adr-speed'
const SPEED_OPTIONS = [1, 2, 3, 5] as const
export type SpeedMultiplier = (typeof SPEED_OPTIONS)[number]

const DEFAULT: SpeedMultiplier = 1

// ─── 内部状态 + 订阅 ──────────────────────────────────────

let current: SpeedMultiplier = DEFAULT
const listeners = new Set<() => void>()

function load(): SpeedMultiplier {
  if (typeof window === 'undefined') return DEFAULT
  const stored = localStorage.getItem(SPEED_KEY)
  if (stored) {
    const n = parseInt(stored, 10)
    if (SPEED_OPTIONS.includes(n as SpeedMultiplier)) return n as SpeedMultiplier
  }
  return DEFAULT
}

function notify() {
  listeners.forEach(fn => fn())
}

// 模块加载时初始化
current = load()
syncCooldownStep()

// ─── 内部辅助 ────────────────────────────────────────────

/** 同步 CSS 变量 --game-cooldown-step（进度条 transition 时长） */
function syncCooldownStep() {
  if (typeof document !== 'undefined') {
    const ms = Math.round(1000 / current)
    document.documentElement.style.setProperty('--game-cooldown-step', `${ms}ms`)
  }
}

// ─── 强制倍速（如战斗时强制 1×） ───────────────────────

let _forcedSpeed: SpeedMultiplier | null = null

/**
 * 强制设置倍速，忽略用户选择。
 * 已强制时再次调用不生效（防止重复强制）。
 * 不会修改 localStorage 中的用户设定值。
 */
export function forceSpeed(speed: SpeedMultiplier) {
  if (_forcedSpeed !== null) return
  _forcedSpeed = speed
  syncCooldownStep()
  notify()
}

/** 释放强制倍速，恢复用户设定的值 */
export function releaseSpeed() {
  if (_forcedSpeed === null) return
  _forcedSpeed = null
  syncCooldownStep()
  notify()
}

// ─── 公开 API ────────────────────────────────────────────

/** 获取当前倍速（优先返回强制倍速，否则返回用户设定） */
export function getSpeed(): SpeedMultiplier {
  return _forcedSpeed ?? current
}

/** 设置倍速，持久化并通知订阅者 */
export function setSpeed(speed: SpeedMultiplier) {
  if (speed === current) return
  current = speed
  localStorage.setItem(SPEED_KEY, String(speed))
  syncCooldownStep()
  notify()
}

/** React Hook：订阅 speed 变化，返回 [speed, setSpeed] */
export function useSpeed(): [SpeedMultiplier, (s: SpeedMultiplier) => void] {
  const [speed, setLocal] = useState<SpeedMultiplier>(current)

  useEffect(() => {
    const sync = () => setLocal(current)
    listeners.add(sync)
    return () => { listeners.delete(sync) }
  }, [])

  const set = useCallback((s: SpeedMultiplier) => {
    setSpeed(s)
  }, [])

  return [speed, set]
}
