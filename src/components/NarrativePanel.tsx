/**
 * NarrativePanel — 左栏剧情文本区
 *
 * 根据当前游戏状态渲染叙事文本：场景标题、火堆状态、建造者剧情。
 * 文本通过 react-i18next 的 t() 查表，支持中/英文切换。
 */
import { useTranslation } from 'react-i18next'
import { useGameState, FireLevel } from '../state'

/** 火堆等级 → i18n key */
const FIRE_KEYS = [
  'fire.dead',
  'fire.smoldering',
  'fire.flickering',
  'fire.burning',
  'fire.roaring',
] as const

/** 温度等级 → i18n key */
const TEMP_KEYS = [
  'temp.freezing',
  'temp.cold',
  'temp.mild',
  'temp.warm',
  'temp.hot',
] as const

export function NarrativePanel() {
  const { t } = useTranslation()
  const state = useGameState()
  const fireLevel = state.game.fire
  const tempLevel = state.game.temperature
  const builderLevel = state.game.builder.level
  const isFireDead = fireLevel === FireLevel.Dead

  const fireText = t(FIRE_KEYS[fireLevel])
  const tempText = t(TEMP_KEYS[tempLevel])

  return (
    <div className="flex flex-col gap-6">
      {/* 场景标题 */}
      <h1
        className="text-2xl tracking-[var(--game-tracking-wide)]"
        style={{
          color: 'var(--game-text-primary)',
          textShadow: 'var(--game-text-glow)',
          animation: 'roomFlicker 3s infinite alternate',
        }}
      >
        {fireLevel >= FireLevel.Flickering
          ? t('room.title_firelit')
          : t('room.title_dark')}
      </h1>

      {/* 火堆状态 */}
      <p
        className="text-sm"
        style={{
          color: 'var(--game-text-body)',
          letterSpacing: 'var(--game-tracking)',
        }}
      >
        {t('room.fire_is')}{' '}
        {isFireDead ? t('room.dead_icon') : `🔥 ${fireText}`}
      </p>

      {/* 温度描述 */}
      <p
        className="text-xs"
        style={{
          color: 'var(--game-text-body)',
          letterSpacing: 'var(--game-tracking-tight)',
          opacity: 0.6,
        }}
      >
        {t('room.room_is')} {tempText}
      </p>

      {/* 建造者叙事文本 */}
      {builderLevel >= 1 && builderLevel < 4 && (
        <p
          className="text-xs italic"
          style={{ color: 'var(--game-text-body)', opacity: 0.5 }}
        >
          {builderLevel === 1 && t('builder.huddles')}
          {builderLevel === 2 && t('builder.shivers_by_fire')}
          {builderLevel === 3 && t('builder.warms_by_fire')}
        </p>
      )}

      {builderLevel >= 4 && (
        <p className="text-xs" style={{ color: 'var(--game-accent-positive)' }}>
          {t('builder.income')}
        </p>
      )}
    </div>
  )
}
