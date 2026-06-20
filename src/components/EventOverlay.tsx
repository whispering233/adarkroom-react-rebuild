/**
 * EventOverlay — 事件弹窗覆盖层
 *
 * 当 state.game.activeEvent 不为 null 时渲染，读取事件定义
 * 并展示当前场景的文本与操作按钮。
 *
 * 职责：
 *   1. 从 registry 查找 EventDef
 *   2. 展示当前 scene 的文本
 *   3. 渲染场景按钮（cost/reward/nextScene）
 *   4. scene 切换时自动执行 onLoad/reward/notification
 */
import { useEffect, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useGameState,
  useGameDispatch,
  endEvent,
  goToScene,
  pushNarrative,
  applyRecipe,
  modifyResource,
} from '../state'
import { getEventById } from '../events/registry'
import { resolveNextScene } from '../events/utils'
import type { SceneButtonDef } from '../events/types'
import { CombatOverlay } from '../combat/CombatOverlay'
import { WEAPONS } from '../combat/weapons'
import styles from './EventOverlay.module.css'

export function EventOverlay() {
  const { t } = useTranslation()
  const state = useGameState()
  const dispatch = useGameDispatch()

  const active = state.game.activeEvent
  const eventDef = active ? getEventById(active.eventId) : undefined
  const scene = (eventDef && active) ? eventDef.scenes[active.currentScene] : undefined

  // ── 战斗模式状态 ──
  const [combatResult, setCombatResult] = useState<{
    sceneId: string
    won: boolean
    loot: Record<string, number>
  } | null>(null)
  // 仅当战斗结果属于当前场景时才有效（跨 scene 自动过期，无需 effect 重置）
  const validResult = combatResult?.sceneId === active?.currentScene ? combatResult : null
  // 派生：战斗场景 + 无有效结果 → 战斗中
  const inCombat = !!(scene?.combat && !validResult)

  // ── Scene 生命周期：onLoad / reward / notification ──
  // 当 active.sceneId 变化时执行该场景的进入副作用
  useEffect(() => {
    if (!scene || !active) return

    scene.onLoad?.(dispatch)

    if (scene.reward) {
      dispatch(applyRecipe(d => {
        for (const [res, amount] of Object.entries(scene.reward!)) {
          modifyResource(d, res, amount)
        }
      }))
    }

    if (scene.notification) {
      dispatch(pushNarrative(t(scene.notification)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.currentScene])

  // ── 按钮点击处理 ──
  const handleButtonClick = useCallback(
    (button: SceneButtonDef) => {
      // ① 资源变化（cost + reward 合并为一次 dispatch）
      if (button.cost || button.reward) {
        dispatch(applyRecipe(d => {
          if (button.cost) {
            for (const [res, amount] of Object.entries(button.cost)) {
              modifyResource(d, res, -amount)
            }
          }
          if (button.reward) {
            for (const [res, amount] of Object.entries(button.reward)) {
              modifyResource(d, res, amount)
            }
          }
        }))
      }

      // ② 通知
      if (button.notification) {
        dispatch(pushNarrative(t(button.notification)))
      }

      // ③ onChoose 回调
      button.onChoose?.(dispatch)

      // ④ 外部链接
      if (button.link) {
        dispatch(endEvent())
        window.open(button.link)
        return
      }

      // ⑤ 场景跳转
      if (button.nextScene) {
        const target = resolveNextScene(button.nextScene)
        if (target === 'end') {
          dispatch(endEvent())
        } else {
          dispatch(goToScene(target))
        }
      } else if (button.nextEvent) {
        // 事件嵌套 — 结束时由 EventScheduler 接管后续
        dispatch(endEvent())
      }
    },
    [dispatch, t],
  )

  // ── 战斗结束回调 ──
  const handleCombatEnd = useCallback(
    (won: boolean, loot: Record<string, number>) => {
      setCombatResult({ sceneId: active!.currentScene, won, loot })
    },
    [],
  )

  // 无活动事件或事件未找到 → 不渲染
  if (!eventDef || !scene) return null

  // ── 战斗模式 ──
  if (inCombat && scene.combat) {
    return (
      <div className="absolute inset-0 z-50 flex items-start justify-center bg-[rgba(0,0,0,0.4)] overflow-y-auto"
        style={{ top: 'var(--game-header-h)' }}>
        <div className={styles.panel}>
          <div className={styles.title}>{t(eventDef.title)}</div>
          <div className={styles.description}>
            {scene.text.map((line, i) => (
              <p key={i}>{t(line)}</p>
            ))}
            <CombatOverlay
              scene={scene}
              onCombatEnd={handleCombatEnd}
              availableWeapons={
                state.currentRoom === 'world'
                  ? Object.keys(state.outfit ?? {}).filter(k => k in WEAPONS)
                  : undefined
              }
            />
          </div>
        </div>
      </div>
    )
  }

  // ── 战斗结果展示 ──
  if (validResult && scene.combat) {
    const victoryScene = scene.buttons['leave'] ?? Object.values(scene.buttons)[0]
    return (
      <div className="absolute inset-0 z-50 flex items-start justify-center bg-[rgba(0,0,0,0.4)] overflow-y-auto"
        style={{ top: 'var(--game-header-h)' }}>
        <div className={styles.panel}>
          <div className={styles.title}>{t(eventDef.title)}</div>
          <div className={styles.description}>
            {validResult.won ? (
              <>
                <p>{t('combat.victory')}</p>
                {Object.entries(validResult.loot).map(([res, qty]) => (
                  <p key={res} className="text-(--game-accent)">
                    {t(res)} +{qty}
                  </p>
                ))}
              </>
            ) : (
              <p>{t('combat.fled')}</p>
            )}
          </div>
          <div className={styles.buttons}>
            <button
              onClick={() => {
                if (victoryScene) {
                  handleButtonClick(victoryScene)
                } else {
                  dispatch(endEvent())
                }
              }}
              className="w-full text-left px-3 py-2 text-sm border border-(--game-btn-border) rounded cursor-pointer
                bg-(--game-btn-bg) text-(--game-btn-text) hover:bg-(--game-btn-hover-bg)
                transition-colors duration-150"
            >
              {t('combat.continue')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 z-50 flex items-start justify-center bg-[rgba(0,0,0,0.4)] overflow-y-auto"
      style={{ top: 'var(--game-header-h)' }}>
      <div className={styles.panel}>
        {/* 标题 */}
        <div className={styles.title}>{t(eventDef.title)}</div>

        {/* 文本 */}
        <div className={styles.description}>
          {scene.text.map((line, i) => (
            <p key={i}>{t(line)}</p>
          ))}
        </div>

        {/* 按钮 */}
        <div className={styles.buttons}>
          {Object.entries(scene.buttons).map(([id, btn]) => {
            const disabled = btn.available ? !btn.available(state) : false
            return (
              <button
                key={id}
                disabled={disabled}
                onClick={() => handleButtonClick(btn)}
                className="w-full text-left px-3 py-2 text-sm border border-(--game-btn-border) rounded cursor-pointer
                  bg-(--game-btn-bg) text-(--game-btn-text)
                  hover:bg-(--game-btn-hover-bg)
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition-colors duration-150"
              >
                {t(btn.text)}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
