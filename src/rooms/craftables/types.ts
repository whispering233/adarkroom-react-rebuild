/**
 * Craftables 类型定义
 *
 * 声明式数据模型：每个制造物是一条纯数据配置，
 * 解锁条件、成本、副作用全部可组合，无需修改组件代码。
 */
import type { GameState } from '../../state'

// ─── 制造物分类 ──────────────────────────────────────────

export type CraftableType = 'building' | 'tool' | 'weapon' | 'upgrade' | 'good'

// ─── 解锁条件 ────────────────────────────────────────────

/** 全部条件满足时按钮才可见/可点击 */
export interface UnlockCondition {
  /** 建造者最低等级（默认 4） */
  builderLevel?: number
  /** 必须已拥有的建筑 id */
  building?: string
  /** 资源下限（如木材 ≥ 消耗量 × 0.5） */
  minResources?: Record<string, number>
  /** 必须"见过"的所有资源（当前持有 > 0 即视为见过） */
  seenAllOf?: string[]
}

// ─── 制造物定义 ──────────────────────────────────────────

export interface CraftableDef {
  /** 唯一标识 */
  id: string
  /** 分类（决定 UI 分区和存储位置） */
  type: CraftableType
  /** 最大拥有数量 */
  max: number
  /** 解锁条件（全部满足才可用） */
  unlock: UnlockCondition
  /** 动态成本函数（可根据当前拥有数量调整） */
  cost: (state: GameState) => Record<string, number>
  /** 建造/制造完成后触发的副作用（注册收入、解锁功能等） */
  onBuild?: (draft: GameState) => void
}
