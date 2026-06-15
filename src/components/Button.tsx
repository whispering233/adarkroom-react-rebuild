/**
 * Button — 通用游戏操作按钮
 *
 * 支持：
 *   - 冷却倒计时 + 进度条动画
 *   - 资源消耗检查（自动禁用）
 *   - 自定义禁用状态 / 工具提示
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useGameState } from '../state'
import styles from './Button.module.css'

export interface ButtonProps {
  /** 按钮唯一标识（用于冷却状态追踪） */
  id: string
  /** 按钮文字 */
  text: string
  /** 点击回调 */
  onClick: () => void
  /** 冷却秒数（默认 0 = 无冷却） */
  cooldown?: number
  /** 消耗资源表（如 { wood: 5 }），不足时按钮自动禁用 */
  cost?: Record<string, number>
  /** 强制禁用 */
  disabled?: boolean
  /** 悬停提示文字 */
  tooltip?: string
  /** 额外 CSS class */
  className?: string
}

/** 基础按钮样式（CSS Token 引用，自动适配浅色/暗色主题） */
const BASE_STYLE =
  'relative cursor-pointer rounded border px-5 py-2 font-mono text-sm transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 overflow-hidden hover:bg-(--game-btn-hover-bg) hover:shadow-(--game-accent-glow)'

export function Button({
  id,
  text,
  onClick,
  cooldown = 0,
  cost,
  disabled = false,
  tooltip,
  className = '',
}: ButtonProps) {
  // 冷却计时
  const [cooldownLeft, setCooldownLeft] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 读取当前资源（用于消耗检查）
  const state = useGameState()
  const stores = state.stores

  // 资源是否足够
  const hasEnoughResources = useCallback(() => {
    if (!cost) return true
    return Object.entries(cost).every(
      ([resource, needed]) => (stores[resource] ?? 0) >= needed,
    )
  }, [cost, stores])

  const insufficientResources = !hasEnoughResources()

  // 真正禁用
  const isDisabled = disabled || insufficientResources || cooldownLeft > 0

  // 消耗不足的资源列表（用于显示）
  const missingResources = cost
    ? Object.entries(cost)
        .filter(([r, n]) => (stores[r] ?? 0) < n)
        .map(([r, n]) => `${r}(${(stores[r] ?? 0)}/${n})`)
    : []

  const handleClick = useCallback(() => {
    if (isDisabled) return

    onClick()

    // 启动冷却
    if (cooldown > 0) {
      setCooldownLeft(cooldown)
    }
  }, [isDisabled, onClick, cooldown])

  // 每秒递减冷却
  useEffect(() => {
    if (cooldownLeft <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    timerRef.current = setInterval(() => {
      setCooldownLeft((prev) => {
        const next = prev - 1
        if (next <= 0) {
          if (timerRef.current) clearInterval(timerRef.current)
          timerRef.current = null
          return 0
        }
        return next
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [cooldownLeft > 0]) // eslint-disable-line react-hooks/exhaustive-deps

  // 显示文字：冷却时附加秒数
  const displayText =
    cooldownLeft > 0 ? `${text} (${cooldownLeft}s)` : text

  // 进度条百分比
  const progressPct =
    cooldown > 0 ? ((cooldown - cooldownLeft) / cooldown) * 100 : 0

  return (
    <div className="relative" title={tooltip}>
      <button
        type="button"
        id={`btn-${id}`}
        onClick={handleClick}
        disabled={isDisabled}
        className={`${BASE_STYLE} ${styles.base} ${className}`}
      >
        {/* 冷却进度条背景 */}
        {cooldownLeft > 0 && (
          <span
            className={`absolute inset-0 transition-none ${styles.progress}`}
            style={{ '--progress': `${progressPct}%` } as React.CSSProperties}
          />
        )}

        {/* 按钮文字 */}
        <span className="relative z-10">{displayText}</span>
      </button>

      {/* 资源不足提示 */}
      {insufficientResources && missingResources.length > 0 && (
        <div className="absolute left-0 top-full mt-1 whitespace-nowrap rounded bg-red-900/80 px-2 py-0.5 font-mono text-xs text-red-300">
          need {missingResources.join(', ')}
        </div>
      )}
    </div>
  )
}
