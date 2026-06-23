/**
 * World — Entity 系统类型定义
 *
 * WorldEntity 是地标实体的统一运行时接口：
 *   - getDrawCommand() 描述渲染意图（char + prominent/bold），不碰 CSS 变量
 *   - onEnter() 可选触发逻辑（事件、返回家园等）
 *   - EntityCatalog 为运行时注册表，buildEntityCellMap 展开 footprint 到网格
 *
 * 此文件仅包含类型 + 纯工具函数，不含具体实体实现。
 */

import type { PlacedEntity, PlacedCell, EntityTriggerContext, EntityTriggerResult } from '../types'
import type { RenderCell } from '../renderViewport'

// ─── Entity 接口 ──────────────────────────────────────

export interface WorldEntity {
  /** 唯一类型标识（对应 PlacedEntity.entityId） */
  readonly type: string
  /** 占格尺寸（w=宽=列数, h=高=行数） */
  readonly footprint: { w: number; h: number }
  /**
   * 获取绘制命令。
   * @param anchorX - entity 的 anchor X（地图网格坐标）
   * @param anchorY - entity 的 anchor Y（地图网格坐标）
   * @param viewportOriginX - 视口左上角 X（地图网格坐标）
   * @param viewportOriginY - 视口左上角 Y（地图网格坐标）
   * @param isDimmed - 是否处于暗光状态（已探索但不可见）
   * @param mask - 可见性掩码
   * @param explored - 探索掩码
   */
  getDrawCommand(
    anchorX: number,
    anchorY: number,
    viewportOriginX: number,
    viewportOriginY: number,
    isDimmed: boolean,
    mask: boolean[][],
    explored: boolean[][],
  ): EntityDrawCommand
  /** 可选：玩家走入实体格时的触发逻辑 */
  onEnter?(ctx: EntityTriggerContext): EntityTriggerResult | null
}

// ─── 绘制命令 ─────────────────────────────────────────

export interface EntityDrawCommand {
  /** 视口坐标系下的边界 */
  bounds: { vx: number; vy: number; vw: number; vh: number }
  /** 已解析的渲染单元列表 */
  cells: RenderCell[]
}

// ─── 目录类型 ─────────────────────────────────────────

/** 实体类型 ID → WorldEntity 的映射 */
export type EntityCatalog = Record<string, WorldEntity>

// ─── 工具函数 ─────────────────────────────────────────

/**
 * 将 entityLayer 中所有实体的 footprint 展开为 "x,y" → PlacedCell 的查找表。
 *
 * @param entityLayer - 已放置的实体列表
 * @param catalog - 实体目录（用于查询 footprint）
 * @returns entityCellMap — key 格式为 "${x},${y}"（逗号分隔，无空格），
 *          后注册的实体覆盖先注册的同键值（最新 wins）。
 */
export function buildEntityCellMap(
  entityLayer: PlacedEntity[],
  catalog: EntityCatalog,
): Map<string, PlacedCell> {
  const map = new Map<string, PlacedCell>()

  for (const placed of entityLayer) {
    const entity = catalog[placed.entityId]
    if (!entity) continue // 无法识别的实体跳过

    const { w, h } = entity.footprint
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const gx = placed.anchorX + dx
        const gy = placed.anchorY + dy
        const key = `${gx},${gy}`
        map.set(key, {
          entityId: placed.entityId,
          anchorX: placed.anchorX,
          anchorY: placed.anchorY,
          dx,
          dy,
        })
      }
    }
  }

  return map
}
