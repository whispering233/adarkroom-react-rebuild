/**
 * Events — 事件系统类型定义
 *
 * 事件系统架构：
 *   EventDef (剧本) → scenes (场景图) → SceneDef (单幕)
 *     → buttons (出口) → nextScene / nextEvent (跳转)
 *
 * 约束：
 *   - type 导入使用 import type，兼容 erasableSyntaxOnly
 *   - 回调签名中 dispatch 接收 unknown 避免循环导入
 *   - 场景图是 DAG（有向无环图），'end' 是唯一终端节点
 */

// ─── 常量 ────────────────────────────────────────────────

/** 事件结果（持久化到 narrative.eventsCompleted） */
export type EventResult = 'seen' | 'completed' | 'refused' | 'failed'

/** 场景标识符 */
export type SceneId = string

// ─── 概率映射 ────────────────────────────────────────────

/**
 * 权重格式：{ scene_a: 3, scene_b: 7 }
 * 运行时按权重比例归一化，更直观。
 */
export type WeightMap = Record<SceneId, number>

/**
 * 累积概率格式（兼容原版）：
 *   { 0.3: 'scene_a', 1: 'scene_b' }
 * key 为累积概率阈值（0.0~1.0），value 为目标 sceneId。
 * 调度器内部统一转换为 WeightMap 处理。
 */
export type CumulativeMap = Record<string, SceneId>

/** 概率跳转映射（权重 / 累积概率二选一） */
export type ProbabilityMap = WeightMap | CumulativeMap

// ─── 场景按钮 ────────────────────────────────────────────

export interface SceneButtonDef {
  /** 按钮显示文本（i18n key，渲染时用 t() 解析） */
  text: string

  /** 资源消耗（key = resourceId, value = 数量） */
  cost?: Record<string, number>

  /** 即时奖励（dispatch 在 reducer 中处理） */
  reward?: Record<string, number>

  /** 场景跳转：'end' / 单一 sceneId / 概率映射 */
  nextScene?: SceneId | ProbabilityMap

  /** 跳转到另一个事件（事件嵌套，如 setpiece 接入） */
  nextEvent?: string

  /** 按钮冷却（秒），缺省无冷却 */
  cooldown?: number

  /** 点击回调（在 dispatch EVENT_BUTTON_CLICK 后由 reducer 调用） */
  onChoose?: (dispatch: (action: unknown) => void) => void

  /** 可用条件（缺省始终可用） */
  available?: (state: import('../state/types').GameState) => boolean

  /** 额外单击钩子（不影响场景跳转） */
  onClick?: () => void

  /** 外部链接（点击后结束事件并打开链接） */
  link?: string

  /** 点击后推送的通知文本 */
  notification?: string
}

// ─── 场景定义 ────────────────────────────────────────────

export interface SceneDef {
  /** 叙事文本行数组（每行渲染为一个分段） */
  text: string[]

  /** 按钮配置（key = buttonId, value = 按钮定义） */
  buttons: Record<string, SceneButtonDef>

  /** 是否进入战斗模式 */
  combat?: boolean

  /** 进入场景时的即时资源奖励 */
  reward?: Record<string, number>

  /** 场景加载回调（如设置 world state、触发副作用） */
  onLoad?: (dispatch: (action: unknown) => void) => void

  /** 进入场景时推送的通知文本（写进 narrativeLog） */
  notification?: string

  /** 是否闪烁浏览器标签标题 */
  blink?: boolean

  // ── combat 相关（仅当 combat: true 时生效） ──────────

  /** 敌人显示字符（用于战斗 UI 标签） */
  chara?: string
  /** 敌人血量 */
  health?: number
  /** 敌人伤害 */
  damage?: number
  /** 敌人命中率 (0~1) */
  hit?: number
  /** 敌人攻击间隔（秒） */
  attackDelay?: number
  /** 战斗掉落表 */
  loot?: Record<string, { min: number; max: number; chance: number }>
  /** 敌人特殊技能（间隔秒 + 动作回调） */
  specials?: Array<{ delay: number; action: (dispatch: (action: unknown) => void) => string | undefined }>

  // ── 文本框 ──────────────────────────────────────────

  /** 文本框内容（原版用于命名/输入） */
  textarea?: string
  /** 文本框是否只读 */
  readonly?: boolean
}

// ─── 事件定义 ────────────────────────────────────────────

export interface EventDef {
  /** 唯一标识（用于 eventsCompleted 记录） */
  id: string

  /** 标题显示文本（i18n key） */
  title: string

  /** 场景映射（key = sceneId, value = 场景定义） */
  scenes: Record<SceneId, SceneDef>

  /** 可用条件（缺省不可用） */
  isAvailable: (state: import('../state/types').GameState) => boolean

  /** 事件专属音频标识 */
  audio?: string

  /** 调度冷却范围（分钟），缺省使用调度器默认值 [3, 6] */
  cooldownMinutes?: [number, number]
}
