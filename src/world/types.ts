/**
 * World — 地图系统类型定义
 *
 * 设计要点：
 *   - 地块=地形+可选地标，非字符编码
 *   - 效果系统通过 TileEffectFn 延迟求值 + composeEffects 组合
 *   - Portal Landmark 通过 nextMapId + mapStack 支持无限深度跳转（预留）
 */

import type { GameState } from '../state/types'
import type { GameAction } from '../state/reducer'

// ─── Dispatch 类型别名（避免循环 import）───────────────

type DispatchFn = (action: GameAction) => void

// ─── 地形 / 地标 ──────────────────────────────────────

export type TerrainType = 'forest' | 'field' | 'barrens' | 'road'

export type LandmarkType =
  | 'village' | 'ironMine' | 'coalMine' | 'sulphurMine'
  | 'house' | 'cave' | 'town' | 'city' | 'outpost' | 'ship'
  | 'borehole' | 'battlefield' | 'swamp' | 'cache' | 'executioner'

export interface MapTile {
  terrain: TerrainType
  landmark?: LandmarkType
  visited?: boolean
}

// ─── 效果系统 ─────────────────────────────────────────

export interface TileContext {
  pos: [number, number]
  dispatch: DispatchFn
  state: GameState
}

export interface TileEffectResult {
  narrations?: string[]
  encounters?: string[]
  modifiers?: Record<string, number>
  /** Portal Landmark 传送目标 — 非空时 World 组件触发 ENTER_MAP */
  nextMapId?: string
  nextPos?: [number, number]
}

export type TileEffectFn = (ctx: TileContext) => TileEffectResult

// ─── 地图配置 ─────────────────────────────────────────

export interface TerrainDef {
  type: TerrainType
  weight: number
  char: string
  cssClass: string
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
}

// ─── 持久化数据 ───────────────────────────────────────

export interface PersistentWorldData {
  mapId: string
  tiles: MapTile[][]
  mask: boolean[][]
  usedOutposts: Record<string, boolean>
}

// ─── 运行时状态 ───────────────────────────────────────

export interface WorldMapStackEntry {
  mapId: string
  pos: [number, number]
  mask: boolean[][]
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
  /** 临时 usedOutposts 副本 */
  usedOutposts: Record<string, boolean>
  /** 本次行程发现的矿场（setpiece 事件设置，goHome 时提交解锁） */
  minesFound: Partial<Record<'iron' | 'coal' | 'sulphur', boolean>>
  /** 本次行程是否发现了飞船 */
  shipFound?: boolean
  /**
   * 地图栈（Portal Landmark 跳转用）。
   *
   * 栈顶 = 当前活动地图。ENTER_MAP 压栈 + 加载新地图，LEAVE_MAP 弹栈恢复。
   * 本阶段预留：所有地标 onEnter 不返回 nextMapId，仅触发事件。
   */
  mapStack: WorldMapStackEntry[]
}
