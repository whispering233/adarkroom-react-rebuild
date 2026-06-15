/**
 * Outside — 野外场景（最小存根）
 *
 * 阶段 4：初版仅含伐木按钮 + 场景描述。
 * 后续将逐步添加村庄、工人、陷阱等系统。
 */
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameDispatch, applyRecipe } from '../state'
import { Button } from '../components/Button'

export function Outside() {
  const { t } = useTranslation()
  const dispatch = useGameDispatch()

  const handleGatherWood = useCallback(() => {
    dispatch(applyRecipe(draft => { draft.stores.wood += 1 }))
  }, [dispatch])

  return (
    <div className="flex flex-col items-center justify-center min-h-full text-center px-4 gap-6">
      {/* 场景描述 */}
      <p className="font-mono text-sm text-gray-500 max-w-md">
        {t('outside.desc')}
      </p>

      {/* 伐木按钮 */}
      <Button
        id="gatherOutside"
        text={t('outside.gather_wood')}
        onClick={handleGatherWood}
      />
    </div>
  )
}
