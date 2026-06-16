/**
 * WorkersPanel — 工人分配面板（Outside 场景中显示）
 *
 * 显示已解锁职业的工人分配，通过 +/- 按钮从采集者池调配。
 * 仅当 population > 0 且存在工人槽位时渲染。
 */
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameState, useGameDispatch, assignWorker, unassignWorker, getNumGatherers } from '../state'
import styles from './WorkersPanel.module.css'

/** 将 worker key（如 'iron miner'）转为 i18n key（如 'worker.iron_miner'） */
function workerI18nKey(role: string): string {
  return `worker.${role.replace(/ /g, '_')}`
}

export function WorkersPanel() {
  const { t } = useTranslation()
  const state = useGameState()
  const dispatch = useGameDispatch()

  const { population, workers } = state.game
  const gatherers = getNumGatherers(state)
  const workerEntries = Object.entries(workers)

  // 无人口 → 不渲染（采集者行也无需显示）
  if (population <= 0) return null

  const hasGatherers = gatherers > 0

  const handleAssign = useCallback((role: string, count: number) => {
    dispatch(assignWorker(role, count))
  }, [dispatch])

  const handleUnassign = useCallback((role: string, count: number) => {
    dispatch(unassignWorker(role, count))
  }, [dispatch])

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>{t('outside.workers_title')}</h3>

      <div className={styles.rows}>
        {/* 采集者行（只读） */}
        <div className={styles.row}>
          <span className={styles.label}>{t('worker.gatherer')}</span>
          <span className={styles.count}>{gatherers}</span>
          <span className={styles.actions} />
        </div>

        {/* 其他职业行 */}
        {workerEntries.map(([role, count]) => {
          const canAssign = hasGatherers
          const canUnassign = count > 0
          const label = t(workerI18nKey(role), { defaultValue: role })

          return (
            <div key={role} className={styles.row}>
              <span className={styles.label}>{label}</span>
              <span className={styles.count}>{count}</span>
              <span className={styles.actions}>
                <button
                  className={styles.btn}
                  disabled={!canAssign}
                  onClick={() => handleAssign(role, 1)}
                  title={t('outside.worker_assign', { count: 1 })}
                >+</button>
                <button
                  className={styles.btn}
                  disabled={!canAssign}
                  onClick={() => handleAssign(role, 10)}
                  title={t('outside.worker_assign', { count: 10 })}
                >++</button>
                <button
                  className={styles.btn}
                  disabled={!canUnassign}
                  onClick={() => handleUnassign(role, 1)}
                  title={t('outside.worker_unassign', { count: 1 })}
                >−</button>
                <button
                  className={styles.btn}
                  disabled={!canUnassign}
                  onClick={() => handleUnassign(role, 10)}
                  title={t('outside.worker_unassign', { count: 10 })}
                >−−</button>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
