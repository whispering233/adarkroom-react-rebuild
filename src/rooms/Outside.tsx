/**
 * Outside — 野外场景
 *
 * 伐木（带冷却）是野外最基础的操作。
 * 后续将逐步添加村庄、工人、陷阱等系统。
 */
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameDispatch, applyRecipe } from '../state'
import { CONFIG } from '../config'
import { Button } from '../components/Button'

export function Outside() {
  const { t } = useTranslation()
  const dispatch = useGameDispatch()

  const handleGatherWood = useCallback(() => {
    dispatch(applyRecipe(draft => {
      draft.stores.wood += CONFIG.GATHER_WOOD_YIELD
    }))
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
        cooldown={CONFIG.GATHER_WOOD_COOLDOWN}
      />
    </div>
  )
}
