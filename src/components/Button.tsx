/**
 * Button — 通用游戏操作按钮
 *
 * 冷却由 GameState.cooldown 驱动（INCOME_TICK 每秒递减），
 * 不再使用本地 setInterval，与游戏主循环、加速系统同步。
 *
 * 支持：
 *   - 倒空式平滑进度条（100%→0%，CSS transition）
 *   - 资源消耗检查（自动禁用）
 *   - 延迟奖励（冷却结束后由 reducer 自动发放）
 */
import { useCallback } from 'react'
import { useGameState } from '../state'
import styles from './Button.module.css'

export interface ButtonProps {
  /** 按钮唯一标识（用于冷却状态追踪，对应 cooldown[id]） */
  id: string
  /** 按钮文字 */
  text: string
  /** 点击回调（注意：延迟奖励模式下，此回调应只做资源消耗，奖励走 startCooldown reward） */
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
  const state = useGameState()
  const stores = state.stores

  // 冷却剩余（由 reducer INCOME_TICK 驱动）
  const cooldownLeft = state.cooldown[id] ?? 0

  // 资源是否足够
  const hasEnoughResources =
    !cost || Object.entries(cost).every(
      ([resource, needed]) => (stores[resource] ?? 0) >= needed,
    )

  const insufficientResources = !hasEnoughResources

  // 真正禁用
  const isDisabled = disabled || insufficientResources || cooldownLeft > 0

  const handleClick = useCallback(() => {
    if (isDisabled) return
    onClick()
  }, [isDisabled, onClick])

  // 显示文字：冷却时附加秒数
  const displayText =
    cooldownLeft > 0 ? `${text} (${cooldownLeft}s)` : text

  // 倒空进度条：剩余百分比
  const remainingPct =
    cooldown > 0 ? (cooldownLeft / cooldown) * 100 : 0

  return (
    <div className="relative" title={tooltip}>
      <button
        type="button"
        id={`btn-${id}`}
        onClick={handleClick}
        disabled={isDisabled}
        className={`${BASE_STYLE} ${styles.base} ${className}`}
      >
        {/* 冷却进度条（倒空式 100%→0%，transition: width 1s linear） */}
        {cooldownLeft > 0 && (
          <span
            className={`absolute inset-y-0 left-0 ${styles.progress}`}
            style={{ width: `${remainingPct}%` }}
          />
        )}

        {/* 按钮文字 */}
        <span className="relative z-10">{displayText}</span>
      </button>
    </div>
  )
}
