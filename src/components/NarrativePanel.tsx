/**
 * NarrativePanel — 左栏叙事区
 *
 * 三区布局：
 *   1. 顶部状态栏 — 火堆 + 温度
 *   2. 手动叙事 — 脚本推送的叙事文本（entry.text）
 *   3. 资源变化 — 自动生成的资源变更（entry.delta）
 *
 * 各区独立可滚动，新条目在上，旧条目渐隐。
 */
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameState, FireLevel } from '../state'
import type { NarrativeEntry, DeltaSource } from '../state'
import styles from './NarrativePanel.module.css'

// ─── i18n 查表 ────────────────────────────────────────────

const FIRE_KEYS = [
  'fire.dead', 'fire.smoldering', 'fire.flickering',
  'fire.burning', 'fire.roaring',
] as const

const TEMP_KEYS = [
  'temp.freezing', 'temp.cold', 'temp.mild',
  'temp.warm', 'temp.hot',
] as const

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

function formatDelta(
  delta: DeltaSource,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  const sourceKey = `narrative.source.${delta.source}`
  const sourceName = t(sourceKey, { defaultValue: '' })
  if (!sourceName) return ''

  const parts = Object.entries(delta.stores)
    .filter(([, v]) => v !== 0)
    .map(([key, value]) => {
      const name = t(resourceName(key))
      if (value > 0) return t('narrative.delta_plus', { value, name })
      return t('narrative.delta_minus', { value: Math.abs(value), name })
    })

  if (parts.length === 0) return ''
  return t('narrative.delta_format', { source: sourceName, deltas: parts.join(', ') })
}

// ─── 叙事条目行 ────────────────────────────────────────────

function EntryRow({ entry, text, index }: {
  entry: NarrativeEntry
  text: string
  index: number
}) {
  if (!text) return null
  return (
    <p
      key={entry.id}
      className={styles.entry}
      style={{
        opacity: fadeOpacity(index),
        animation: index === 0 ? 'narrSlideIn 0.4s ease-out' : undefined,
      }}
    >
      {text}
    </p>
  )
}

// ─── 组件 ─────────────────────────────────────────────────

export function NarrativePanel() {
  const { t } = useTranslation()
  const state = useGameState()
  const fireLevel = state.game.fire
  const tempLevel = state.game.temperature
  const narrativeLog = state.narrativeLog
  const deltaLog = state.deltaLog

  const fireText = t(FIRE_KEYS[fireLevel])
  const tempText = t(TEMP_KEYS[tempLevel])
  const isFireDead = fireLevel === FireLevel.Dead

  // 预处理手动叙事
  const manualEntries = useMemo(
    () => narrativeLog.map(entry => ({ entry, text: entry.text })),
    [narrativeLog],
  )

  // 预处理 delta 叙事
  const deltaEntries = useMemo(
    () => deltaLog
      .map(entry => {
        const txt = entry.delta ? formatDelta(entry.delta, t) : ''
        return { entry, text: txt }
      })
      .filter(e => e.text),
    [deltaLog, t],
  )

  const isEmpty = manualEntries.length === 0 && deltaEntries.length === 0

  return (
    <div className="flex flex-col h-full gap-0">
      {/* ── 状态条 ── */}
      <div className="shrink-0 mb-2 px-1 flex flex-col gap-0.5 text-xs text-(--game-text-body)">
        <span>{t('room.fire_is')} {isFireDead ? t('room.dead_icon') : `🔥 ${fireText}`}</span>
        <span>{t('room.room_is')} {tempText}</span>
        <span>tick {state._globalTick}</span>
      </div>

      {isEmpty ? (
        <p className="text-xs text-(--game-text-muted) italic px-1">
          {t('room.title_dark')}
        </p>
      ) : (
        <div className="grid grid-rows-2 flex-1 min-h-0 gap-2">
          {/* ── 手动叙事 — 始终占位 ── */}
          <div className="overflow-y-auto min-h-0 pr-1">
            {manualEntries.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {manualEntries.map(({ entry, text }, i) => (
                  <EntryRow key={entry.id} entry={entry} text={text} index={i} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-(--game-text-muted) italic px-1">
                —
              </p>
            )}
          </div>

          {/* ── 资源变化 — 始终占位 ── */}
          <div className="overflow-y-auto min-h-0 pr-1">
            {deltaEntries.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {deltaEntries.map(({ entry, text }, i) => (
                  <EntryRow key={entry.id} entry={entry} text={text} index={i} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-(--game-text-muted) italic px-1">
                —
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
