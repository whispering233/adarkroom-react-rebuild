/**
 * 副作用模板 — 预制的 onBuild 回调工厂
 *
 * 大多数建造/制造的效果是重复模式（注册收入、解锁功能），
 * 通过组合这些模板，配置文件中无需手写重复的回调函数。
 */
import type { GameState } from '../../state'

// ─── 单副作用模板 ────────────────────────────────────────

/** 注册一个周期性收入源 */
function income(
  key: string,
  delay: number,
  stores: Record<string, number>,
): (draft: GameState) => void {
  return (draft) => {
    draft.income[key] = { delay, stores, timeLeft: delay }
  }
}

/** 解锁功能标记 */
function unlockFeature(feature: string): (draft: GameState) => void {
  return (draft) => {
    draft.features[feature] = true
  }
}

/** 初始化工人槽位（幂等：已存在则跳过） */
function initWorkers(...roles: string[]): (draft: GameState) => void {
  return (draft) => {
    for (const role of roles) {
      if (!(role in draft.game.workers)) {
        draft.game.workers[role] = 0
      }
    }
  }
}

// ─── 组合器 ──────────────────────────────────────────────

/** 串联多个副作用为一个 */
function chain(
  ...fns: Array<(draft: GameState) => void>
): (draft: GameState) => void {
  return (draft) => {
    for (const fn of fns) {
      fn(draft)
    }
  }
}

// ─── 导出 ────────────────────────────────────────────────

export const Effects = {
  income,
  unlockFeature,
  initWorkers,
  chain,
}
