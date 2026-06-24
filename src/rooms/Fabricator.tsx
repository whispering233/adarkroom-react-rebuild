/**
 * Fabricator — 制造工坊
 *
 * 使用外星合金制造 8 种终局物品。
 * 首次发现 executioner 地标后自动解锁。
 */
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameState, useGameDispatch, applyRecipe, modifyResource } from '../state'
import { Button } from '../components/Button'

interface FabricatorItem {
  id: string
  cost: number      // alien alloy cost
  quantity?: number  // default 1
}

const ITEMS: FabricatorItem[] = [
  { id: 'energy blade', cost: 1 },
  { id: 'plasma rifle', cost: 1 },
  { id: 'disruptor', cost: 1 },
  { id: 'fluid recycler', cost: 2 },
  { id: 'cargo drone', cost: 2 },
  { id: 'kinetic armour', cost: 2 },
  { id: 'hypo', cost: 1, quantity: 5 },
  { id: 'stim', cost: 1, quantity: 5 },
]

export function Fabricator() {
  const { t } = useTranslation()
  const state = useGameState()
  const dispatch = useGameDispatch()
  const alloy = state.stores['alien alloy'] ?? 0

  const handleFabricate = useCallback((item: FabricatorItem) => {
    if (alloy < item.cost) return
    const qty = item.quantity ?? 1
    dispatch(applyRecipe(d => {
      modifyResource(d, 'alien alloy', -item.cost, 'cost.fabricator')
      modifyResource(d, item.id, qty, 'reward.fabricator')
    }))
  }, [dispatch, alloy])

  return (
    <div className="flex flex-col items-start justify-start min-h-full text-left px-4 gap-6 py-8">
      <div className="text-xs uppercase tracking-[0.2em] text-(--game-accent)">
        {t('nav.fabricator')}
      </div>
      <p className="text-xs text-(--game-text-muted)">{t('fabricator.intro')}</p>

      <div className="flex flex-col gap-2">
        {ITEMS.map(item => {
          const hasAlloy = alloy >= item.cost
          const label = t(`fabricator.${item.id.replace(/ /g, '_')}`, { defaultValue: item.id })
          const count = item.quantity && item.quantity > 1 ? `×${item.quantity}` : undefined
          return (
            <Button
              key={item.id}
              id={`fab_${item.id.replace(/ /g, '-')}`}
              label={label}
              count={count}
              onClick={() => handleFabricate(item)}
              cost={{ 'alien alloy': item.cost }}
              disabled={!hasAlloy}
            />
          )
        })}
      </div>
    </div>
  )
}
