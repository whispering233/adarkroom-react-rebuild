/**
 * Button — 通用游戏操作按钮
 *
 * 冷却由 GameState.cooldown 驱动（INCOME_TICK 每秒递减）。
 *
 * 支持：
 *   - label + count 左右对齐布局（用于建造按钮）
 *   - cost 自动生成结构化 hover tooltip（资源名│数量，一行一项）
 *   - 倒空式平滑进度条（CSS transition）
 *   - 复杂样式提取到 Button.module.css
 */
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameState } from '../state'
import styles from './Button.module.css'

export interface ButtonProps {
  id: string
  /** 按钮名称（左对齐，优先于 text） */
  label?: string
  /** 数量显示（右对齐，如 "2/10"） */
  count?: string
  /** 按钮文字（无 label 时的备选，居中） */
  text?: string
  onClick: () => void
  cooldown?: number
  cost?: Record<string, number>
  disabled?: boolean
  tooltip?: string
  className?: string
}

export function Button({
  id,
  label,
  count,
  text,
  onClick,
  cooldown = 0,
  cost,
  disabled = false,
  tooltip,
  className = '',
}: ButtonProps) {
  const { t } = useTranslation()
  const state = useGameState()
  const stores = state.stores

  const cooldownLeft = state.cooldown[id] ?? 0
  const cooldownActive = id in state.cooldown && cooldown > 0

  const hasEnoughResources =
    !cost || Object.entries(cost).every(
      ([resource, needed]) => (stores[resource] ?? 0) >= needed,
    )

  const isDisabled = disabled || !hasEnoughResources || cooldownLeft > 0

  const handleClick = useCallback(() => {
    if (isDisabled) return
    onClick()
  }, [isDisabled, onClick])

  const remainingPct = cooldown > 0 ? (cooldownLeft / cooldown) * 100 : 0

  // tooltip 显示逻辑：显式 tooltip > cost 结构化列表
  const hasTextTooltip = !!tooltip
  const hasCostTooltip = !hasTextTooltip && cost && Object.keys(cost).length > 0

  const alignClass = label != null ? 'text-left' : 'text-center'

  return (
    <div className={`${styles.wrapper} relative inline-block`}>
      <button
        type="button"
        id={`btn-${id}`}
        onClick={handleClick}
        disabled={isDisabled}
        className={`${styles.button} ${alignClass} ${className}`}
      >
        {/* 冷却进度条 */}
        {cooldownActive && (
          <span
            className={`absolute inset-y-0 left-0 ${styles.progress}`}
            style={{ width: `${remainingPct}%` }}
          />
        )}

        {/* 按钮文字 */}
        {label != null ? (
          <span className={styles.labelRow}>
            <span className={styles.labelName}>{label}</span>
            {count != null && (
              <span className={styles.labelCount}>{count}</span>
            )}
          </span>
        ) : (
          <span className={styles.centerText}>{text}</span>
        )}
      </button>

      {/* cost 结构化 tooltip */}
      {hasCostTooltip && (
        <div className={styles.tooltip}>
          {Object.entries(cost!).map(([key, amount]) => {
            const nameKey = `stores.${key.replace(/ /g, '_')}`
            const name = t(nameKey)
            return (
              <div key={key} className={styles.tooltipRow}>
                <span className={styles.tooltipName}>{name}</span>
                <span className={styles.tooltipAmount}>{amount}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* 纯文本 tooltip（非 cost 场景） */}
      {hasTextTooltip && (
        <div className={styles.tooltip}>
          <span>{tooltip}</span>
        </div>
      )}
    </div>
  )
}
