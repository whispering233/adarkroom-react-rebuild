import { useTranslation } from 'react-i18next'
import styles from './WorldInfo.module.css'

interface WorldInfoProps {
  mapName: string
}

export function WorldInfo({ mapName }: WorldInfoProps) {
  const { t } = useTranslation()

  return (
    <div className={styles.bar}>
      <span className={styles.label}>{t('world.info.map')}</span>
      <span className={styles.value}>{mapName}</span>
      <span className={styles.separator} />
      <span className={styles.label}>{t('world.info.weather')}</span>
      <span className={styles.value}>{t('world.info.weather_clear')}</span>
    </div>
  )
}
