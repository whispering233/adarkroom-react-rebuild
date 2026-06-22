import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameDispatch, applyRecipe } from '../state'
import { WORLD } from '../world/constants'
import styles from './WorldHUD.module.css'

interface WorldHUDProps {
  health: number
  maxHealth: number
  water: number
  outfit: Record<string, number>
}

export function WorldHUD({ health, maxHealth, water, outfit }: WorldHUDProps) {
  const { t } = useTranslation()
  const dispatch = useGameDispatch()

  const heal = useCallback((type: 'meat' | 'meds' | 'hypo', amount: number) => {
    dispatch(applyRecipe(d => {
      const w = d.game.worldRuntime
      if (!w) return
      const key = type === 'meat' ? 'cured meat' : type === 'meds' ? 'medicine' : 'hypo'
      if ((d.outfit[key] ?? 0) <= 0) return
      d.outfit[key] = (d.outfit[key] ?? 0) - 1
      w.health = Math.min(w.maxHealth, w.health + amount)
    }))
  }, [dispatch])

  const curedMeat = outfit['cured meat'] ?? 0
  const medicine = outfit.medicine ?? 0
  const hypo = outfit.hypo ?? 0

  return (
    <div className={styles.panel}>
      {/* 状态区 */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>{t('world.hud.status')}</div>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>{t('world.hp')}</span>
          <span className={styles.statValue}>{health}/{maxHealth}</span>
        </div>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>{t('world.water')}</span>
          <span className={styles.statValue}>{water}</span>
        </div>
      </div>

      {/* 装备区 */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>{t('world.hud.equipment')}</div>
        {Object.entries(outfit).map(([key, count]) => {
          if (count <= 0) return null
          return (
            <div key={key} className={styles.statRow}>
              <span className={styles.statLabel}>{t(`stores.${key.replace(/ /g, '_')}`)}</span>
              <span className={styles.statValue}>x{count}</span>
            </div>
          )
        })}
      </div>

      {/* 操作区 */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>{t('world.hud.actions')}</div>
        <button
          className={styles.btn}
          onClick={() => heal('meat', WORLD.MEAT_HEAL)}
          disabled={curedMeat <= 0}
        >
          {t('world.eat_meat')} (+{WORLD.MEAT_HEAL})
        </button>
        <button
          className={styles.btn}
          onClick={() => heal('meds', WORLD.MEDS_HEAL)}
          disabled={medicine <= 0}
        >
          {t('world.use_meds')} (+{WORLD.MEDS_HEAL})
        </button>
        <button
          className={styles.btn}
          onClick={() => heal('hypo', WORLD.HYPO_HEAL)}
          disabled={hypo <= 0}
        >
          {t('world.use_hypo')} (+{WORLD.HYPO_HEAL})
        </button>
      </div>
    </div>
  )
}
