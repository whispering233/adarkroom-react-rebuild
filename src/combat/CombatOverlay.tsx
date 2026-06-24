/**
 * CombatOverlay — 战斗 UI
 *
 * 渲染在 EventOverlay 面板内部（替换文本区 + 按钮区）。
 * 使用本地 state 管理战斗过程，战斗结束回调 EventOverlay。
 */
import { useState, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameState, useGameDispatch, applyRecipe, modifyResource, pushNarrative } from '../state'
import type { CombatState } from './types'
import type { SceneDef } from '../events/types'
import { playerAttack, enemyAttack, healPlayer, isPlayerDead } from './CombatManager'
import { WEAPONS } from './weapons'
import styles from './CombatOverlay.module.css'

// ─── 治疗量 ──────────────────────────────────────────────

const MEAT_HEAL = 10
const MEDS_HEAL = 20

// ─── Props ───────────────────────────────────────────────

interface CombatOverlayProps {
  scene: SceneDef
  onCombatEnd: (won: boolean, loot: Record<string, number>) => void
  /** 可用武器 ID 过滤（World 中仅 outfit 武器可选），undefined = 全部 */
  availableWeapons?: string[]
}

// ─── 组件 ────────────────────────────────────────────────

export function CombatOverlay({ scene, onCombatEnd, availableWeapons }: CombatOverlayProps) {
  const { t } = useTranslation()
  const dispatch = useGameDispatch()
  const gameState = useGameState()

  const [combat, setCombat] = useState<CombatState>({
    active: true,
    enemyId: scene.chara ?? 'enemy',
    enemyHp: scene.health ?? 10,
    enemyMaxHp: scene.health ?? 10,
    playerHp: 100,
    playerMaxHp: 100,
    attackDelay: scene.attackDelay ?? 2,
    enemyDamage: scene.damage ?? 4,
    enemyHit: scene.hit ?? 0.8,
    enemyStunned: false,
  })

  const [floatText, setFloatText] = useState<{ text: string; key: number } | null>(null)

  // ── 敌人攻击计时器 ──
  const combatRef = useRef(combat)
  combatRef.current = combat
  const perksRef = useRef(gameState.character.perks)
  perksRef.current = gameState.character.perks

  useEffect(() => {
    if (combat.won || isPlayerDead(combat)) return
    const delay = (combat.attackDelay ?? 2) * 1000
    const id = setInterval(() => {
      const curr = combatRef.current
      if (curr.won || isPlayerDead(curr)) {
        clearInterval(id)
        return
      }
      const checkPerk = (p: string) => perksRef.current[p] === true
      const result = enemyAttack(curr, checkPerk)
      setCombat(result.combat)
      if (result.hit) {
        showFloat(`-${result.damage}`)
      }
      if (isPlayerDead(result.combat)) {
        clearInterval(id)
        dispatch(pushNarrative(t('combat.defeat')))
        onCombatEnd(false, {})
      }
    }, delay)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combat.attackDelay, combat.won])

  // ── 浮动文字 ──
  const showFloat = useCallback((text: string) => {
    const key = Date.now()
    setFloatText({ text, key })
    setTimeout(() => setFloatText(null), 700)
  }, [])

  // ── 玩家攻击 ──
  const handleAttack = useCallback(
    (weaponId: string) => {
      const weapon = WEAPONS[weaponId]
      if (!weapon) return

      // 检查弹药
      if (weapon.cost) {
        dispatch(applyRecipe(d => {
          for (const [res, qty] of Object.entries(weapon.cost!)) {
            if (qty != null) {
              modifyResource(d, res, -qty, 'combat.attack')
            }
          }
        }))
      }

      const hasPerk = (p: string) => gameState.character.perks[p] === true
      const result = playerAttack(combat, weapon, hasPerk)
      setCombat(result.combat)

      if (result.hit) {
        if (result.damage > 0) {
          showFloat(`-${result.damage}`)
        } else {
          showFloat(t('combat.stun', { defaultValue: 'STUN' }))
        }
      }

      // Unarmed punch tracking for perk progression
      if (weapon.type === 'unarmed') {
        dispatch(applyRecipe(d => {
          d.character.punches = (d.character.punches ?? 0) + 1
          const p = d.character.punches
          if (p >= 300 && !d.character.perks['unarmed master']) d.character.perks['unarmed master'] = true
          if (p >= 150 && !d.character.perks['martial artist']) d.character.perks['martial artist'] = true
          if (p >= 50 && !d.character.perks['boxer']) d.character.perks['boxer'] = true
        }))
      }

      // 敌人死亡 → 结算
      if (result.combat.won) {
        const loot = generateLoot(scene.loot ?? {})
        // 发放掉落
        if (Object.keys(loot).length > 0) {
          dispatch(applyRecipe(d => {
            for (const [res, qty] of Object.entries(loot)) {
              modifyResource(d, res, qty, 'combat.loot')
            }
          }))
        }
        dispatch(pushNarrative(t('combat.victory')))
        onCombatEnd(true, loot)
      }
    },
    [combat, dispatch, scene, showFloat, onCombatEnd, t],
  )

  // ── 敌人自动攻击（通过定时器简化版，Phase 6.5 改为 GameLoop tick） ──
  // 当前使用按钮触发敌人反击模拟。

  // ── 治疗 ──
  const handleHeal = useCallback(
    (healType: 'meat' | 'meds' | 'hypo', amount: number) => {
      const storeKey = healType === 'meat' ? 'cured meat' : healType === 'meds' ? 'medicine' : 'hypo'
      dispatch(applyRecipe(d => {
        modifyResource(d, storeKey, -1, 'combat.heal')
      }))
      setCombat(prev => healPlayer(prev, amount))
      showFloat(`+${amount}`)
    },
    [dispatch, showFloat],
  )

  // ── 渲染 ──
  const enemyHpPct = Math.round((combat.enemyHp / combat.enemyMaxHp) * 100)
  const playerHpPct = Math.round((combat.playerHp / combat.playerMaxHp) * 100)

  const weaponsGrid = Object.values(WEAPONS).filter(w => {
    if (availableWeapons && !availableWeapons.includes(w.id)) return false
    if (!w.cost) return true
    return true // TODO: check if player has enough resources
  })

  return (
    <>
      {/* 战斗状态 */}
      <div className={styles.fightBox}>
        <div className={styles.fighter}>
          <div className={styles.fighterLabel}>{t('combat.you')}</div>
          <div className={styles.fighterName}>@</div>
          <div className={styles.hpBar}>
            <div className={styles.hpFill} style={{ width: `${playerHpPct}%` }} />
          </div>
          <div className={styles.hpText}>
            {combat.playerHp}/{combat.playerMaxHp}
          </div>
        </div>

        <div className={styles.fighter}>
          <div className={styles.fighterLabel}>{t('combat.enemy')}</div>
          <div className={styles.fighterName}>X</div>
          <div className={styles.hpBar}>
            <div className={styles.hpFill} style={{ width: `${enemyHpPct}%` }} />
          </div>
          <div className={styles.hpText}>
            {combat.enemyHp}/{combat.enemyMaxHp}
          </div>
          {floatText && (
            <div className={styles.damageFloat} key={floatText.key}>
              {floatText.text}
            </div>
          )}
        </div>
      </div>

      {/* 武器 */}
      <div className={styles.weaponsGrid}>
        {weaponsGrid.map(w => (
          <button
            key={w.id}
            onClick={() => handleAttack(w.id)}
            className="px-2 py-1.5 text-xs border border-(--game-btn-border) rounded cursor-pointer
              bg-(--game-btn-bg) text-(--game-btn-text)
              hover:bg-(--game-btn-hover-bg)
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors duration-150"
          >
            {t(w.verb)}
          </button>
        ))}
      </div>

      {/* 治疗 */}
      <div className={styles.healRow}>
        <button
          onClick={() => handleHeal('meat', MEAT_HEAL)}
          disabled={combat.playerHp >= combat.playerMaxHp}
          className="flex-1 px-2 py-1.5 text-xs border border-(--game-btn-border) rounded cursor-pointer
            bg-(--game-btn-bg) text-(--game-btn-text) hover:bg-(--game-btn-hover-bg)
            disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
        >
          {t('combat.eat_meat')}
        </button>
        <button
          onClick={() => handleHeal('meds', MEDS_HEAL)}
          disabled={combat.playerHp >= combat.playerMaxHp}
          className="flex-1 px-2 py-1.5 text-xs border border-(--game-btn-border) rounded cursor-pointer
            bg-(--game-btn-bg) text-(--game-btn-text) hover:bg-(--game-btn-hover-bg)
            disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
        >
          {t('combat.use_meds')}
        </button>
      </div>

      {/* 逃跑 */}
      <button
        onClick={() => onCombatEnd(false, {})}
        className="mt-1 w-full px-2 py-1.5 text-xs border border-(--game-btn-border) rounded cursor-pointer
          bg-(--game-btn-bg) text-(--game-text-muted) hover:bg-(--game-btn-hover-bg)
          transition-colors duration-150"
      >
        {t('combat.flee')}
      </button>
    </>
  )
}

// ─── 掉落生成 ────────────────────────────────────────────

function generateLoot(
  table: Record<string, { min: number; max: number; chance: number }>,
): Record<string, number> {
  const loot: Record<string, number> = {}
  for (const [res, cfg] of Object.entries(table)) {
    if (Math.random() <= cfg.chance) {
      loot[res] = Math.floor(Math.random() * (cfg.max - cfg.min + 1)) + cfg.min
    }
  }
  return loot
}
