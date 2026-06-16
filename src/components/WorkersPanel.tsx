/**
 * WorkersPanel — 工人分配面板（Outside 场景中显示）
 *
 * grid-cols-2 扁平布局：左列职业名+人数，右列操作按钮。
 * hover 职业行时弹出实际资源产出/消耗提示。
 */
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useGameState,
  useGameDispatch,
  assignWorker,
  unassignWorker,
  getNumGatherers,
} from '../state'
import { WORKER_INCOME } from '../config'
import styles from './WorkersPanel.module.css'

/** 将 worker key（如 'iron miner'）转为 i18n key（如 'worker.iron_miner'） */
function workerI18nKey(role: string): string {
  return `worker.${role.replace(/ /g, '_')}`
}

/** 格式化实际产量文字（per-worker 速率 × 工人数），如 "+2.5 / 10s"、"-10 / 10s" */
function formatRate(value: number, delay: number, count: number): string {
  const total = value * count
  const sign = total > 0 ? '+' : ''
  return `${sign}${total} / ${delay}s`
}

export function WorkersPanel() {
  const { t } = useTranslation()
  const state = useGameState()
  const dispatch = useGameDispatch()

  const { population, workers } = state.game
  const gatherers = getNumGatherers(state)
  const workerEntries = Object.entries(workers)
  const hasGatherers = gatherers > 0

  const handleAssign = useCallback((role: string, count: number) => {
    dispatch(assignWorker(role, count))
  }, [dispatch])

  const handleUnassign = useCallback((role: string, count: number) => {
    dispatch(unassignWorker(role, count))
  }, [dispatch])

  // 无人口 → 不渲染
  if (population <= 0) return null

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>{t('outside.workers_title')}</h3>

      <div className={styles.grid}>
        {/* ── 采集者行（只读） ── */}
        <div className={styles.cell}>
          <span>{t('worker.gatherer')}</span>
          <span className={styles.count}>{gatherers}</span>
        </div>
        <div className={styles.cell} />

        {/* ── 其他职业行 ── */}
        {workerEntries.map(([role, count]) => {
          const canAssign = hasGatherers
          const canUnassign = count > 0
          const label = t(workerI18nKey(role), { defaultValue: role })
          const incomeDef = WORKER_INCOME[role]

          return (
            <div key={role} className={styles.rowGroup}>
              {/* 左列：职业名 + 人数 */}
              <div className={styles.cell}>
                <span>{label}</span>
                <span className={styles.count}>{count}</span>
              </div>

              {/* 右列：操作按钮（均匀分布，不换行） */}
              <div className={`${styles.cell} ${styles.actions}`}>
                <button
                  className={styles.btn}
                  disabled={!canUnassign}
                  onClick={() => handleUnassign(role, 1)}
                  title={t('outside.worker_unassign', { count: 1 })}
                >-1</button>
                <button
                  className={styles.btn}
                  disabled={!canUnassign}
                  onClick={() => handleUnassign(role, 10)}
                  title={t('outside.worker_unassign', { count: 10 })}
                >-10</button>
                <button
                  className={styles.btn}
                  disabled={!canAssign}
                  onClick={() => handleAssign(role, 1)}
                  title={t('outside.worker_assign', { count: 1 })}
                >+1</button>
                <button
                  className={styles.btn}
                  disabled={!canAssign}
                  onClick={() => handleAssign(role, 10)}
                  title={t('outside.worker_assign', { count: 10 })}
                >+10</button>
              </div>

              {/* hover tooltip */}
              {incomeDef && (
                <div className={styles.tooltip}>
                  {Object.entries(incomeDef.stores).map(([res, rate]) => (
                    <div key={res} className={styles.ttRow}>
                      <span className={styles.ttKey}>
                        {t(`stores.${res.replace(/ /g, '_')}`, { defaultValue: res })}
                      </span>
                      <span className={styles.ttVal}>
                        {formatRate(rate, incomeDef.delay, count)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
