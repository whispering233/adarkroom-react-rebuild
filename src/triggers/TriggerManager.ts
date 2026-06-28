/**
 * TriggerManager — 空间触发生命周期纯函数
 *
 * 管理 Enter / Stay / Exit 三阶段判定。
 * 零外部依赖，零 React，零 DOM。
 */

// ─── 类型 ──────────────────────────────────────────────

/** 触发判定结果 */
export interface TriggerResult {
  phase: 'enter' | 'stay' | 'exit'
  entityType: string
}

/** 触发配置 */
export interface TriggerConfig {
  /** 是否允许 Stay/Exit 重复触发。false 时仅 Enter 产生结果 */
  repeatable?: boolean
}

/** 触发状态（由消费者持久化并在 tick 间传入） */
export interface TriggerState {
  prevPos: readonly [number, number] | null
}

/** entityCellMap 中单格的最小接口 */
interface TriggerCell {
  entityId: string
}

// ─── 工厂 ──────────────────────────────────────────────

export function createTriggerState(): TriggerState {
  return { prevPos: null }
}

// ─── 核心判定 ──────────────────────────────────────────

/**
 * 判定当前帧的触发阶段。
 *
 * @param pos        - 当前坐标
 * @param prevPos    - 上一帧坐标（由 TriggerState.prevPos 传入）
 * @param entityCellMap - "x,y" → entity 的查找表（不透明的 Record）
 * @param config     - 触发配置
 * @returns 触发结果或 null（无触发）
 */
export function check(
  pos: readonly [number, number],
  prevPos: readonly [number, number] | null,
  entityCellMap: Readonly<Record<string, TriggerCell>>,
  config: TriggerConfig,
): TriggerResult | null {
  const posKey = `${pos[0]},${pos[1]}`
  const inCell = entityCellMap[posKey]

  const wasInCell = prevPos !== null && (`${prevPos[0]},${prevPos[1]}` in entityCellMap)

  if (inCell) {
    if (!wasInCell) {
      return { phase: 'enter', entityType: inCell.entityId }
    }
    if (config.repeatable) {
      return { phase: 'stay', entityType: inCell.entityId }
    }
    return null
  }

  if (wasInCell && config.repeatable) {
    const prevKey = `${prevPos![0]},${prevPos![1]}`
    return { phase: 'exit', entityType: entityCellMap[prevKey]!.entityId }
  }

  return null
}
