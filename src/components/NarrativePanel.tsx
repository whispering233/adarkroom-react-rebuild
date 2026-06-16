/**
 * NarrativePanel — 左栏叙事区
 *
 * 双区布局：
 *   1. 顶部状态栏 — 紧凑显示火堆 + 温度
 *   2. 叙事日志 — 新条目在上，旧条目渐隐，可滚动回溯
 *
 * 支持两种叙事条目：
 *   - 纯文本（entry.text 非空）→ 直接渲染
 *   - 资源变更（entry.delta）→ 根据 source + deltas 用 i18n 模板格式化
 */
import { useTranslation } from 'react-i18next'
import { useGameState, FireLevel } from '../state'
import type { NarrativeEntry, DeltaSource } from '../state'

// ─── i18n 查表 ────────────────────────────────────────────

const FIRE_KEYS = [
  'fire.dead',
  'fire.smoldering',
  'fire.flickering',
  'fire.burning',
  'fire.roaring',
] as const

const TEMP_KEYS = [
  'temp.freezing',
  'temp.cold',
  'temp.mild',
  'temp.warm',
  'temp.hot',
] as const

/** 单条叙事衰减：最新条目 opacity=1，每条递减 0.08，最低 0.15 */
function fadeOpacity(index: number): number {
  return Math.max(1 - index * 0.08, 0.15)
}

// ─── 资源 i18n key 映射 ───────────────────────────────────

const RESOURCE_I18N: Record<string, string> = {
  'cured meat': 'stores.cured_meat',
  'energy cell': 'stores.energy_cell',
}

function resourceName(key: string): string {
  return RESOURCE_I18N[key] ?? `stores.${key.replace(/ /g, '_')}`
}

// ─── 格式化 delta 叙事 ────────────────────────────────────

/**
 * 将 DeltaSource 转换为可读叙事文本。
 * 例：`{ source: 'income.builder', stores: { wood: 2 } }`
 *   → "建造者：+2 木头"
 */
function formatDelta(
  delta: DeltaSource,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  // 查找 source 显示名，未注册则跳过整条不渲染
  const sourceKey = `narrative.source.${delta.source}`
  const sourceName = t(sourceKey, { defaultValue: '' })
  if (!sourceName) return ''

  // 格式化每项资源变更
  const parts = Object.entries(delta.stores)
    .filter(([, v]) => v !== 0)
    .map(([key, value]) => {
      const name = t(resourceName(key))
      if (value > 0) {
        return t('narrative.delta_plus', { value, name })
      }
      return t('narrative.delta_minus', { value: Math.abs(value), name })
    })

  if (parts.length === 0) return ''
  const deltas = parts.join(', ')

  return t('narrative.delta_format', { source: sourceName, deltas })
}

// ─── 组件 ─────────────────────────────────────────────────

export function NarrativePanel() {
  const { t } = useTranslation()
  const state = useGameState()
  const fireLevel = state.game.fire
  const tempLevel = state.game.temperature
  const narrativeLog = state.narrativeLog

  const fireText = t(FIRE_KEYS[fireLevel])
  const tempText = t(TEMP_KEYS[tempLevel])
  const isFireDead = fireLevel === FireLevel.Dead

  /** 获取条目显示文本 */
  function entryText(entry: NarrativeEntry): string {
    if (entry.delta) {
      return formatDelta(entry.delta, t)
    }
    return entry.text
  }

  return (
    <div className="flex flex-col h-full gap-0">
      {/* ── 状态条（flex-col，左对齐） ── */}
      <div className="shrink-0 mb-2 px-1 flex flex-col gap-0.5 text-xs text-(--game-text-body)">
        <span>{t('room.fire_is')} {isFireDead ? t('room.dead_icon') : `🔥 ${fireText}`}</span>
        <span>{t('room.room_is')} {tempText}</span>
        <span>tick {state._globalTick}</span>
      </div>

      {/* ── 叙事日志（可滚动） ── */}
      {narrativeLog.length > 0 ? (
        <div className="flex-1 overflow-y-auto min-h-0 pr-1">
          <div className="flex flex-col gap-1.5">
            {narrativeLog.map((entry, i) => (
              <p
                key={entry.id}
                className="text-xs text-(--game-text-body) leading-relaxed transition-opacity duration-1000"
                style={{
                  opacity: fadeOpacity(i),
                  animation: i === 0
                    ? 'narrSlideIn 0.4s ease-out'
                    : undefined,
                }}
              >
                {entryText(entry)}
              </p>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-(--game-text-muted) italic px-1">
          {t('room.title_dark')}
        </p>
      )}
    </div>
  )
}
