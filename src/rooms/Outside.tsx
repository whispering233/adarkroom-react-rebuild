/**
 * Outside — 野外场景
 *
 * 伐木：点击后启动冷却，冷却结束由 reducer 自动发放木头。
 * 检查陷阱：即时随机掉落，消耗诱饵。
 * 工人分配：WorkersPanel 从采集者池调配专业工人。
 */
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useGameState,
  useGameDispatch,
  startCooldown,
  applyRecipe,
  modifyResource,
  pushNarrative,
} from '../state'
import { CONFIG, TRAP_DROPS } from '../config'
import { Button } from '../components/Button'
import { WorkersPanel } from '../components/WorkersPanel'

export function Outside() {
  const { t } = useTranslation()
  const state = useGameState()
  const dispatch = useGameDispatch()

  const traps = state.game.buildings['trap'] ?? 0

  // 伐木：启动冷却 + 延迟奖励（冷却结束 reducer 自动发放木头）
  const handleGatherWood = useCallback(() => {
    dispatch(startCooldown(
      'gatherOutside',
      CONFIG.GATHER_WOOD_COOLDOWN,
      { stores: { wood: CONFIG.GATHER_WOOD_YIELD }, source: 'reward.gather_wood' },
    ))
  }, [dispatch])

  // 检查陷阱：即时随机掉落 + 消耗诱饵
  const handleCheckTraps = useCallback(() => {
    const bait = state.stores['bait'] ?? 0
    const baitedCount = Math.min(traps, bait)
    const numDrops = traps + baitedCount

    const drops: Record<string, number> = {}
    const msgs: string[] = []

    for (let i = 0; i < numDrops; i++) {
      const roll = Math.random()
      for (const drop of TRAP_DROPS) {
        if (roll < drop.rollUnder) {
          drops[drop.name] = (drops[drop.name] ?? 0) + 1
          if (!msgs.includes(drop.messageKey)) {
            msgs.push(drop.messageKey)
          }
          break
        }
      }
    }

    // 消耗诱饵
    if (baitedCount > 0) {
      drops['bait'] = (drops['bait'] ?? 0) - baitedCount
    }

    // 发放掉落 + 消耗诱饵
    dispatch(applyRecipe(d => {
      for (const [res, delta] of Object.entries(drops)) {
        if (delta !== 0) {
          modifyResource(d, res, delta, 'reward.check_traps')
        }
      }
    }))

    // 启动冷却
    dispatch(startCooldown('checkTraps', CONFIG.TRAP_COOLDOWN))

    // 推送叙事
    if (msgs.length > 0) {
      const items = msgs.map(k => t(k)).join('、')
      dispatch(pushNarrative(t('outside.traps_contain') + items))
    }
  }, [dispatch, state, traps, t])

  return (
    <div className="flex flex-col items-start justify-start text-left px-4 gap-6 py-8">
      {/* 场景描述 */}
      <p className="font-mono text-sm text-gray-500 max-w-md">
        {t('outside.desc')}
      </p>

      <div className="flex gap-3 flex-wrap">
        {/* 伐木按钮 */}
        <Button
          id="gatherOutside"
          text={t('outside.gather_wood')}
          onClick={handleGatherWood}
          cooldown={CONFIG.GATHER_WOOD_COOLDOWN}
        />

        {/* 检查陷阱按钮（有陷阱才显示） */}
        {traps > 0 && (
          <Button
            id="checkTraps"
            text={t('outside.check_traps')}
            onClick={handleCheckTraps}
            cooldown={CONFIG.TRAP_COOLDOWN}
          />
        )}
      </div>

      {/* 工人分配 */}
      <WorkersPanel />
    </div>
  )
}
