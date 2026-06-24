/**
 * Scoring — 积分计算（纯函数）
 *
 * 遵循原版 scoring.js 的积分公式：
 *   24 种资源 × 权重系数 + alienAlloy×10 + fleetBeacon×500 + shipHull×50
 *
 * 使用说明：
 *   - calculateScore(state) — 当前局积分（不包含历史 prestige）
 *   - getTotalScore(state)  — 累积总积分（含历史 prestige）
 *   - savePrestige()         — Action creator，将当前资源快照 × 随机 0~0.3 写入 previous
 *   - collectPrestigeStores() — Action creator，从 previous.stores 读取并累加到当前库存
 */

import type { GameState } from '../state/types'

/** 参与积分计算的 24 种资源（顺序与原版一致） */
export const STORES_MAP: string[] = [
  'wood', 'fur', 'meat', 'iron', 'coal', 'sulphur', 'steel', 'cured meat',
  'scales', 'teeth', 'leather', 'bait', 'torch', 'cloth',
  'bone spear', 'iron sword', 'steel sword', 'bayonet', 'rifle', 'laser rifle',
  'bullets', 'energy cell', 'grenade', 'bolas',
]

/** 每种资源的积分权重系数（与 STORES_MAP 一一对应） */
const FACTORS: number[] = [
  1, 1.5, 1, 2, 2, 3, 3, 2, 2, 2, 2, 1.5, 1, 1,
  10, 30, 50, 100, 150, 150, 3, 3, 5, 4,
]

/**
 * 计算当前游戏的即时积分（不含历史 prestige 分数）。
 * 公式：∑(stores[resource] × factor) + alienAlloy×10 + fleetBeacon×500 + shipHull×50
 */
export function calculateScore(state: GameState): number {
  let score = 0
  for (let i = 0; i < STORES_MAP.length; i++) {
    score += (state.stores[STORES_MAP[i]] ?? 0) * FACTORS[i]
  }
  score += (state.stores['alien alloy'] ?? 0) * 10
  score += (state.stores['fleet beacon'] ?? 0) * 500
  score += (state.game.spaceShip?.hull ?? 0) * 50
  return Math.floor(score)
}

/**
 * 计算累积总积分（含历史 prestige 分数）。
 */
export function getTotalScore(state: GameState): number {
  const prevScore = ((state.previous as Record<string, unknown>)?.score as number) ?? 0
  return prevScore + calculateScore(state)
}

/**
 * 将当前资源快照 × 随机系数（0~0.3）以及总积分保存到 previous 存档。
 * 用于游戏结束（飞船起飞）时触发。
 */
export function savePrestigeToState(draft: GameState): void {
  const stores = STORES_MAP.map(
    k => Math.max(0, Math.floor((draft.stores[k] ?? 0) * Math.random() * 0.3)),
  )
  const score = getTotalScore(draft)
  ;(draft.previous as Record<string, unknown>).stores = stores
  ;(draft.previous as Record<string, unknown>).score = score
}

/**
 * 从 previous.stores 中取出上局资源并累加到当前库存。
 * 在 Cache 地标发现时调用。
 */
export function collectPrestigeStoresToState(draft: GameState): void {
  const prev = draft.previous as Record<string, unknown>
  const stores = prev.stores as number[] | undefined
  if (!stores || !Array.isArray(stores)) return

  for (let i = 0; i < Math.min(stores.length, STORES_MAP.length); i++) {
    if (stores[i] > 0) {
      draft.stores[STORES_MAP[i]] = (draft.stores[STORES_MAP[i]] ?? 0) + stores[i]
    }
  }
  // 清空已收集的 stores（避免重复收集）
  prev.stores = []
}

/**
 * 检查是否存在未收集的 prestige stores（用于 Cache 地标是否生成的判断）。
 */
export function hasPrestigeStores(state: GameState): boolean {
  const prev = state.previous as Record<string, unknown>
  return Array.isArray(prev?.stores) && (prev.stores as number[]).length > 0
}
