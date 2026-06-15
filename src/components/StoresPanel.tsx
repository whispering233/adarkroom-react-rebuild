/**
 * StoresPanel — 资源显示面板（右栏）
 *
 * 资源分类后纵向排列，每行类目-数值左右对齐。
 * 已知资源始终显示（即使为 0），动态资源（后期解锁）只在 > 0 时显示。
 * 资源名通过 react-i18next 的 t() 查表。
 */
import { useTranslation } from 'react-i18next'
import { useGameState } from '../state'

/** 资源 key → i18n key 映射（处理含空格的资源名） */
const RESOURCE_I18N: Record<string, string> = {
  'cured meat': 'stores.cured_meat',
  'energy cell': 'stores.energy_cell',
}

/** 获取资源的 i18n key */
function resI18nKey(rawKey: string): string {
  return RESOURCE_I18N[rawKey] ?? `stores.${rawKey}`
}

/** 资源分类（i18n 标签 key + 资源名列表） */
const CATEGORIES: { labelKey: string; keys: string[] }[] = [
  {
    labelKey: 'stores.cat_basic',
    keys: ['wood', 'fur', 'meat', 'scales', 'teeth'],
  },
  {
    labelKey: 'stores.cat_minerals',
    keys: ['iron', 'coal', 'steel', 'sulphur'],
  },
  {
    labelKey: 'stores.cat_crafted',
    keys: ['cloth', 'leather', 'cured meat', 'bullets'],
  },
  {
    labelKey: 'stores.cat_advanced',
    keys: ['energy cell', 'medicine', 'hypo', 'stim'],
  },
]

const KNOWN_KEYS = new Set(CATEGORIES.flatMap(c => c.keys))

export function StoresPanel() {
  const { t } = useTranslation()
  const state = useGameState()
  const stores = state.stores

  const dynamicKeys = Object.keys(stores).filter(
    k => !KNOWN_KEYS.has(k) && (stores[k] ?? 0) > 0,
  )

  const hasData =
    CATEGORIES.some(c => c.keys.some(k => stores[k] !== undefined)) ||
    dynamicKeys.length > 0

  if (!hasData) return null

  return (
    <div className="flex flex-col gap-4 text-sm">
      {CATEGORIES.map(cat => {
        const rows = cat.keys.filter(k => stores[k] !== undefined)
        if (rows.length === 0) return null
        return (
          <div key={cat.labelKey}>
            <div
              className="text-xs uppercase tracking-[0.2em] mb-2 text-(--game-accent)"
            >
              {t(cat.labelKey)}
            </div>
            <div className="flex flex-col gap-1">
              {rows.map(key => (
                <div
                  key={key}
                  className="flex justify-between text-(--game-text-body)"
                >
                  <span className="text-(--game-text-muted)">
                    {t(resI18nKey(key))}
                  </span>
                  <span className="text-(--game-accent)">
                    {stores[key] ?? 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {dynamicKeys.length > 0 && (
        <div>
          <div
            className="text-xs uppercase tracking-[0.2em] mb-2 text-(--game-accent)"
          >
            {t('stores.cat_other')}
          </div>
          <div className="flex flex-col gap-1">
            {dynamicKeys.map(key => (
              <div
                key={key}
                className="flex justify-between text-(--game-text-body)"
              >
                <span className="text-(--game-text-muted)">{key}</span>
                <span className="text-(--game-accent)">
                  {stores[key] ?? 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
