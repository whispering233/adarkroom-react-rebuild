/**
 * World — 地图系统类型定义
 *
 * 设计要点：
 *   - 地块=地形+可选地标，非字符编码
 *   - 效果系统通过 TileEffectFn 延迟求值 + composeEffects 组合
 *   - Portal Landmark 通过 nextMapId + mapStack 支持无限深度跳转（预留）
 *   - 实体层 (PlacedEntity) 与地形层 (TerrainType[][]) 分离
 */

import type { GameState } from '../state/types'
import type { GameAction } from '../state/reducer'
import { TERRAINS } from './constants'

// ─── Dispatch 类型别名（避免循环 import）───────────────

type DispatchFn = (action: GameAction) => void

// ─── 地形 / 地标 ──────────────────────────────────────

export type TerrainType = 'forest' | 'field' | 'barrens' | 'road' | 'void'

export type LandmarkType =
  | 'village' | 'ironMine' | 'coalMine' | 'sulphurMine'
  | 'house' | 'cave' | 'town' | 'city' | 'outpost' | 'ship'
  | 'borehole' | 'battlefield' | 'swamp' | 'cache' | 'executioner'

/**
 * @deprecated 将在后续 wave 中删除。新代码使用 WorldMap + PlacedEntity 替代。
 * MapTile 目前仍被 generator.ts / renderViewport.ts / World.tsx 使用，
 * 待 Wave 2-5 逐步迁移后再移除。
 */
export interface MapTile {
  terrain: TerrainType
  landmark?: LandmarkType
  blocked?: boolean
}

// ─── 实体层类型 ───────────────────────────────────────

/** 放置在地图上的实体实例 */
export interface PlacedEntity {
  /** 实体类型 ID（关联到 WorldEntity.type） */
  entityId: string
  /** footprint 左上角锚点 X（地图网格坐标） */
  anchorX: number
  /** footprint 左上角锚点 Y（地图网格坐标） */
  anchorY: number
  /** 是否阻挡移动（默认 false） */
  blocked?: boolean
}

/** entityCellMap 中单个格子的值 */
export interface PlacedCell {
  entityId: string
  anchorX: number
  anchorY: number
  /** 相对于 anchor 的 X 偏移（0-based） */
  dx: number
  /** 相对于 anchor 的 Y 偏移（0-based） */
  dy: number
}

/** 地图运行时数据结构 — 地形层 + 实体层 */
export interface WorldMap {
  /** 地图边长（terrainMap 是 size × size） */
  size: number
  /** 地形层二维数组（字符串枚举，不含实体信息） */
  terrainMap: TerrainType[][]
  /** 实体层 — 所有已放置实体的列表 */
  entityLayer: PlacedEntity[]
  /** 实体格查找表 — key = "${x},${y}"，value = PlacedCell */
  entityCellMap: Map<string, PlacedCell>
}

// ─── 实体触发上下文 ───────────────────────────────────

export interface EntityTriggerContext {
  pos: [number, number]
  state: GameState
  dispatch: (action: GameAction) => void
  t: (key: string) => string
  _globalTick: number
}

export interface EntityTriggerResult {
  eventId?: string
  narrations?: string[]
  encounters?: string[]
  modifiers?: Record<string, number>
  nextMapId?: string
  nextPos?: [number, number]
  returnHome?: boolean
  skipSupplies?: boolean
  /** 若为 true，World 组件会将该实体从 entityLayer 移除，并绘制道路回村庄 */
  clearOutpost?: boolean
  /** 若为 true，表示玩家发现了飞船（WorldRuntimeState.shipFound 同步更新） */
  shipFound?: boolean
  /** 若为 true，表示玩家发现了刽子手（WorldRuntimeState.executionerFound 同步更新） */
  executionerFound?: boolean
}

// ─── 实体渲染接口 ─────────────────────────────────────

export interface EntityRenderInput {
  isDimmed: boolean
}

export interface EntityCellOutput {
  char: string
  prominent: boolean
  bold: boolean
}

// ─── 效果系统（旧，保留兼容）──────────────────────────

/**
 * @deprecated 将逐步被 EntityTriggerContext / EntityTriggerResult 替代。
 * 目前仍在 LandmarkDef.onEnter / TerrainDef.onEnter 中使用。
 */
export interface TileContext {
  pos: [number, number]
  dispatch: DispatchFn
  state: GameState
}

/**
 * @deprecated 将逐步被 EntityTriggerResult 替代。
 */
export interface TileEffectResult {
  narrations?: string[]
  encounters?: string[]
  modifiers?: Record<string, number>
  /** Portal Landmark 传送目标 — 非空时 World 组件触发 ENTER_MAP */
  nextMapId?: string
  nextPos?: [number, number]
}

/**
 * @deprecated 将逐步被 WorldEntity.onEnter 替代。
 */
export type TileEffectFn = (ctx: TileContext) => TileEffectResult

// ─── 地图配置 ─────────────────────────────────────────

export interface TerrainDef {
  type: TerrainType
  weight: number
  char: string
  cssClass: string
  passable: boolean
  onEnter?: TileEffectFn
  narrateOnEnter?: Partial<Record<TerrainType, string>>
}

export interface LandmarkDef {
  type: LandmarkType
  labelKey: string
  char: string
  count: number
  minRadius: number
  maxRadius: number
  /** 触发的事件场景 ID */
  sceneId: string
  /** 是否自动绘制 L 型道路连接 village */
  autoRoad?: boolean
  /**
   * Portal Landmark（传送地标）模式：
   *   地标的 onEnter 返回 TileEffectResult.nextMapId 即可触发地图跳转。
   *   例如：走入 Cave → onEnter 返回 { nextMapId: 'cave_interior', nextPos: [3, 3] }
   *   World 组件检测到 nextMapId 后 dispatch(ENTER_MAP)，当前地图压栈。
   *
   *   不需要 subMap 字段——跳转目标在 onEnter 内部动态决定（取决于 GameState）。
   *   此设计支持无限深度：新地图内地标同样可返回 nextMapId 继续下钻，
   *   LEAVE_MAP 逐层出栈返回。
   */
  /** 多格 footprint 尺寸（默认 {w:1,h:1} 表示单格） */
  footprint?: { w: number; h: number }
  onEnter?: TileEffectFn
}

export interface MapDef {
  id: string
  size: number
  terrainTypes: TerrainDef[]
  landmarks: LandmarkDef[]
  encounterPool: string[]
  /** Path 中是否可选（解锁条件） */
  isAvailable: (state: GameState) => boolean
  /** 可选的玩家出生点坐标（地图网格坐标，默认地图中心 [size, size]） */
  spawnPos?: [number, number]
}

// ─── 持久化数据 ───────────────────────────────────────

export interface PersistentWorldData {
  mapId: string
  /** @deprecated 使用 worldMap 替代。保留以供 v1.3→v1.4 迁移使用。 */
  tiles?: MapTile[][]
  worldMap: WorldMap
  mask: boolean[][]
  explored: boolean[][]
  traveled: boolean[][]
  usedOutposts: Record<string, boolean>
}

// ─── 运行时状态 ───────────────────────────────────────

export interface WorldMapStackEntry {
  mapId: string
  pos: [number, number]
  terrainMap: TerrainType[][]
  entityLayer: PlacedEntity[]
  mask: boolean[][]
  explored: boolean[][]
  traveled: boolean[][]
  usedOutposts: Record<string, boolean>
}

export interface WorldRuntimeState {
  curPos: [number, number]
  water: number
  health: number
  maxHealth: number
  foodMove: number
  waterMove: number
  fightCounter: number
  starvation: boolean
  thirst: boolean
  /** 临时 mask 副本（goHome 提交，die 丢弃） */
  mask: boolean[][]
  /** 临时 explored 副本（goHome 提交，die 丢弃） */
  explored: boolean[][]
  /** 临时 traveled 副本（goHome 提交，die 丢弃） */
  traveled: boolean[][]
  /** 临时 usedOutposts 副本 */
  usedOutposts: Record<string, boolean>
  /** 本次行程发现的矿场（setpiece 事件设置，goHome 时提交解锁） */
  minesFound: Partial<Record<'iron' | 'coal' | 'sulphur', boolean>>
  /** 本次行程是否发现了飞船 */
  shipFound?: boolean
  /** 本次行程是否发现了刽子手 */
  executionerFound?: boolean
  /**
   * 地图栈（Portal Landmark 跳转用）。
   *
   * 栈顶 = 当前活动地图。ENTER_MAP 压栈 + 加载新地图，LEAVE_MAP 弹栈恢复。
   * 本阶段预留：所有地标 onEnter 不返回 nextMapId，仅触发事件。
   */
  mapStack: WorldMapStackEntry[]
}

// ─── 通行判断 ─────────────────────────────────────────

/** @deprecated 将逐步替换为实体层 + 地形层联合判断 */
export function isTilePassable(tile: MapTile): boolean {
  if (tile.blocked) return false
  const def = TERRAINS.find(t => t.type === tile.terrain)
  return def?.passable ?? true
}
