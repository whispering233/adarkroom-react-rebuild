# World Map & Path 系统 — 设计规格书

**日期**：2025-07-15  
**状态**：待审阅  
**范围**：Path 场景、World 场景、地图生成、行走探索、事件/战斗接入、持久化

---

## 1. 概述

在现有 Room → Outside 场景之上，实现原版 A Dark Room 的路径准备（Path）和世界探索（World）两大系统。同时为 Portal Landmark 地图跳转、多地图等扩展预留数据模型。

### 1.1 核心需求

- **Path 场景**：装备选择（从仓库装进背包）、护甲/水量展示、出发按钮
- **World 场景**：61×61 格地图、四向行走探索、食物/水源消耗、随机遭遇战、地标事件、回村/死亡
- **事件/战斗接入**：复用现有 EventOverlay + CombatOverlay，新增 encounter 和 setpiece 事件
- **持久化**：地图生成后永久缓存，探索遮罩随回村提交，死亡回滚

### 1.2 非需求（明确不做，下阶段再议）

- 多地图选择器（第一版 Path 硬编码 World）
- Portal Landmark 传送功能（数据结构预留 `nextMapId`/`nextPos` + `mapStack`，但第一版所有地标的 `onEnter` 不返回 nextMapId，仅触发事件）
- Space / Fabricator / Ship 场景
- 子地图/地牢（由 Portal Landmark + 地图栈机制覆盖，本阶段不实现具体地图）

---

## 2. 数据模型

### 2.1 地图类型定义

> 新文件：`src/world/types.ts`

```typescript
/** 地形类型 */
export type TerrainType = 'forest' | 'field' | 'barrens' | 'road'

/** 地标类型（可叠加在地形上） */
export type LandmarkType =
  | 'village' | 'ironMine' | 'coalMine' | 'sulphurMine'
  | 'house' | 'cave' | 'town' | 'city' | 'outpost' | 'ship'
  | 'borehole' | 'battlefield' | 'swamp' | 'cache' | 'executioner'

/** 地图上单个格子 */
export interface MapTile {
  terrain: TerrainType
  landmark?: LandmarkType
  visited?: boolean
}

/** 地形定义（纯数据，地图生成和渲染时使用） */
export interface TerrainDef {
  type: TerrainType
  weight: number
  char: string
  cssClass: string
  /** 走入该地形时的效果函数（可选） */
  onEnter?: TileEffectFn
  /** 地形间切换时的叙事文本（可选） */
  narrateOnEnter?: Partial<Record<TerrainType, string>>
}

/** 地标定义 */
export interface LandmarkDef {
  type: LandmarkType
  labelKey: string
  char: string
  count: number
  minRadius: number
  maxRadius: number
  /** 触发的事件场景 ID（非 Portal 地标使用） */
  sceneId: string
  /** 是否自动绘制道路 */
  autoRoad?: boolean
  /**
   * 进入时的效果函数（可选）。
   *
   * Portal Landmark（传送地标）模式：
   *   地标的 onEnter 返回 TileEffectResult.nextMapId 即可触发地图跳转。
   *   例如：走入 Cave → onEnter 返回 { nextMapId: 'cave_interior', nextPos: [3, 3] }
   *   World 组件检测到 nextMapId 后 dispatch(ENTER_MAP)，将当前地图压栈。
   *
   *   不需要在地标上单独定义 subMap 字段——跳转目标、出生点、
   *   解锁条件等全部在 onEnter 函数内部根据 GameState 动态决定。
   *
   *   此设计支持无限深度跳转：新地图内的地标同样可通过 onEnter
   *   返回 nextMapId 继续下钻，LEAVE_MAP 逐层出栈返回。
   */
  onEnter?: TileEffectFn
}

/** 地图定义（一张完整地图的配置） */
export interface MapDef {
  id: string
  size: number
  terrainTypes: TerrainDef[]
  landmarks: LandmarkDef[]
  encounterPool: string[]
  /** Path 中是否可选（解锁条件） */
  isAvailable: (state: GameState) => boolean
}
```

### 2.2 Tile 效果系统

地形和地标各可挂载一个 `TileEffectFn`。World 组件在玩家走入该格时调用 `composeEffects()` 组合两者。效果函数延迟求值——定义时不执行，仅在走入时运行。

```typescript
/** 走入一格时的上下文 */
interface TileContext {
  pos: [number, number]
  dispatch: DispatchFn
  state: GameState
}

/** 效果函数返回值 */
interface TileEffectResult {
  narrations?: string[]
  encounters?: string[]
  modifiers?: Record<string, number>
  /**
   * Portal Landmark 传送目标 — 非空时 World 组件自动触发 ENTER_MAP。
   * 当前地图压入 mapStack，渲染目标地图。
   *
   * 示例：
   *   { nextMapId: 'cave_interior', nextPos: [3, 3] }
   *   → dispatch({ type: 'ENTER_MAP', mapId: 'cave_interior', pos: [3, 3] })
   */
  nextMapId?: string
  nextPos?: [number, number]
}

type TileEffectFn = (ctx: TileContext) => TileEffectResult

/** 组合 terrain 和 landmark 的效果 */
function composeEffects(
  terrainEffect?: TileEffectFn,
  landmarkEffect?: TileEffectFn,
): TileEffectFn {
  return (ctx) => {
    const t = terrainEffect?.(ctx) ?? {}
    const l = landmarkEffect?.(ctx) ?? {}
    return {
      narrations: [...(t.narrations ?? []), ...(l.narrations ?? [])],
      encounters: [...(t.encounters ?? []), ...(l.encounters ?? [])],
      modifiers: { ...t.modifiers, ...l.modifiers },
      nextMapId: l.nextMapId ?? t.nextMapId,
      nextPos: l.nextPos ?? t.nextPos,
    }
  }
}
```

### 2.3 持久化 vs 运行时分离

| 数据 | 存储位置 | 生命周期 |
|------|----------|----------|
| `tiles`（地图格子） | `GameState.game.world.tiles` | 首次生成后永久不变 |
| `mask`（探索遮罩） | `worldRuntime.mask` → goHome 时提交到 `game.world.mask` | 每趟行程 |
| `usedOutposts` | `worldRuntime.usedOutposts` → goHome 时提交 | 每趟行程 |
| `curPos / water / health / foodMove / ...` | `worldRuntime` | 仅当前行程，goHome/die 后丢弃 |

### 2.4 GameState 扩展

> 修改 `src/state/types.ts`

```typescript
// ─── 持久化 ──────────────────────────────────────────

/** 持久化世界数据 */
export interface PersistentWorldData {
  mapId: string
  tiles: MapTile[][]
  mask: boolean[][]
  usedOutposts: Record<string, boolean>
}

// GameData 中修改 world 字段：
interface GameData {
  // ... 现有字段不变
  world?: PersistentWorldData
}

// ─── 运行时 ──────────────────────────────────────────

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
   * 栈顶 = 当前活动地图的运行时状态。
   * - ENTER_MAP：将当前地图的 { mapId, curPos, mask, ... } 压栈，
   *   然后加载目标地图作为新的栈顶。
   * - LEAVE_MAP：弹出栈顶（丢弃），恢复上一层地图的状态。
   * - 栈为空 + LEAVE_MAP → 回到 Path（goHome）。
   *
   * 使用栈而非单一 curMapId 的原因：
   *   Portal Landmark 支持任意深度嵌套跳转（世界 → 洞穴 → 洞穴深处 → ...），
   *   每层的地图 ID、位置、mask 等状态独立保存，
   *   回退只需 pop()，不需要手动记录"我从哪来的"。
   */
  mapStack: WorldMapStackEntry[]
}

interface WorldMapStackEntry {
  mapId: string
  pos: [number, number]
  mask: boolean[][]
  usedOutposts: Record<string, boolean>
}
```

### 2.5 背包/装备扩展

> `GameState.outfit` 已存在，Path 直接使用。在 `src/config.ts` 新增：

```typescript
/** 物品重量表（key = 资源/物品 ID，未列出的默认 = 1） */
export const ITEM_WEIGHT: Record<string, number> = {
  'bone spear': 2, 'iron sword': 3, 'steel sword': 5,
  rifle: 5, 'laser rifle': 5, 'plasma rifle': 5,
  bullets: 0.1, 'energy cell': 0.2, bolas: 0.5,
}

/** 背包基础容量 */
export const BASE_BAG_SPACE = 10

/** 背包升级容量加成 */
export const BAG_UPGRADES: Record<string, number> = {
  rucksack: 10, wagon: 30, convoy: 60, 'cargo drone': 100,
}

/** 回村时保留在背包的物品 ID（不会自动卸下） */
export const KEEP_ON_RETURN: string[] = [
  'cured meat', 'bullets', 'energy cell', 'charm',
  'medicine', 'stim', 'hypo',
]
// 注意：武器（通过 WEAPONS 注册表存在的）也自动保留

/** 判断物品是否应在回村时保留 */
export function shouldKeepOnReturn(itemId: string): boolean {
  return KEEP_ON_RETURN.includes(itemId) || itemId in WEAPONS
}
```

---

## 3. 地图生成

### 3.1 生成流程（纯函数）

> 新文件：`src/world/generator.ts`

```
generateMap(mapDef: MapDef): { tiles: MapTile[][], mask: boolean[][] }
```

步骤：

1. 创建 `(size*2+1) × (size*2+1)` 空数组
2. 中心放 Village（terrain=forest, landmark=village）
3. 从中心螺旋向外，按 `TerrainDef.weight` 加权随机填充地形
   - 邻接粘性（STICKINESS=0.5）：相邻已生成的地形有额外权重加成，使同类地形聚集
4. 遍历 `MapDef.landmarks`，在半径范围内随机放置地标（仅放置在纯 terrain 格上，避免覆盖已有地标）
5. 对 `autoRoad=true` 的地标，从 Village 画 L 型道路（Manhattan 距离最短路径）
6. 生成全 false 的 mask（仅中心 Village 格 + LIGHT_RADIUS 范围可见）

### 3.2 常量

> 新文件：`src/world/constants.ts`

```typescript
export const WORLD_CONSTANTS = {
  RADIUS: 30,
  LIGHT_RADIUS: 2,
  STICKINESS: 0.5,
  FIGHT_CHANCE: 0.20,
  FIGHT_DELAY: 3,
  BASE_WATER: 10,
  MOVES_PER_FOOD: 2,
  MOVES_PER_WATER: 1,
  DEATH_COOLDOWN: 120,
  BASE_HEALTH: 10,
  BASE_HIT_CHANCE: 0.8,
  MEAT_HEAL: 8,
  MEDS_HEAL: 20,
  HYPO_HEAL: 30,
  NORTH: [0, -1] as const,
  SOUTH: [0, 1] as const,
  WEST: [-1, 0] as const,
  EAST: [1, 0] as const,
} as const
```

---

## 4. 组件架构

### 4.1 文件清单

```
src/
  world/                        ← 新增模块
    types.ts                    # MapTile, MapDef, TerrainDef, LandmarkDef, ...
    constants.ts                # WORLD_CONSTANTS, 地形/地标配置表
    generator.ts                # generateMap() 纯函数
    effects.ts                  # TileEffectFn, composeEffects(), 预制 terrain 效果
  rooms/
    Path.tsx                    ← 新增
    Path.module.css             ← 新增
    World.tsx                   ← 新增
    World.module.css            ← 新增
  events/
    world/                      ← 新增
      encounters.ts             # 随机遭遇战事件（对标原版 Encounters）
      setpieces/
        ironmine.ts             # 铁矿
        coalmine.ts             # 煤矿
        sulphurmine.ts          # 硫磺矿
        house.ts                # 老房子
        cave.ts                 # 洞穴
        town.ts                 # 废弃城镇
        city.ts                 # 废墟城市
        outpost.ts              # 前哨站
        ship.ts                 # 坠毁飞船
        borehole.ts             # 钻孔
        battlefield.ts          # 战场
        swamp.ts                # 沼泽
        cache.ts                # 遗物宝箱（需 prestige 数据才生成）
        executioner.ts          # 处决者战舰
  state/
    types.ts                    # 扩展：PersistentWorldData, WorldRuntimeState, GameData.world
    reducer.ts                  # 扩展：EMBARK_WORLD, RETURN_FROM_WORLD, ENTER_MAP, LEAVE_MAP 等
    hooks.ts                    # 扩展：useWorldRuntime hook
  config.ts                     # 扩展：ITEM_WEIGHT, BASE_BAG_SPACE, BAG_UPGRADES, KEEP_ON_RETURN
```

### 4.2 Path.tsx 组件

```
Path.tsx
  ├── OutfittingArea
  │     ├── ArmourRow（当前护甲：无 → 皮革 → 铁 → 钢 → 动能）
  │     ├── WaterRow（水量上限显示，受装备影响）
  │     └── OutfitItem × N（可携带物品行，自动从 RESOURCES + Craftables 筛选）
  │           ├── 物品名称
  │           ├── 数量显示
  │           ├── +1 / -1  按钮（受库存/容量/重量约束）
  │           ├── +10 / -10 按钮
  │           └── hover tooltip（重量 / 伤害 / 描述 / 库存余量）
  ├── BagSpace（已用/总容量，含背包升级加成）
  ├── Perks 展示区（stealthy, slow metabolism, desert rat 等）
  └── EmbarkButton（冷却复用 Button 组件，死亡后 120 秒冷却）
```

**数据流**：

- 读取 `state.outfit`（当前装备）、`state.stores`（仓库库存）、`state.character.perks`
- 可携带物品列表 = `RESOURCES` 中 type='tool'/'weapon' 的项 + `Craftables` 中的武器
- ±1/±10 按钮 → `dispatch(applyRecipe(...))` 直接修改 `draft.outfit`
- EmbarkButton.onClick → `dispatch({ type: 'EMBARK_WORLD' })`

**物品类型筛选规则**：

```typescript
// 可携带物品的条件：
// 1. RESOURCES 中有定义的资源（如 'cured meat', 'bullets', 'medicine'）
// 2. Room.Craftables 中的武器（如 'bone spear', 'iron sword'）
// 3. Fabricator.Craftables 中的高级物品（如 'laser rifle', 'grenade'）
// 4. 在 ITEM_WEIGHT 中有定义的物品（自动包含）
// 5. 仓库库存 > 0（库存为 0 的不显示）
```

### 4.3 World.tsx 组件

```
World.tsx
  ├── WorldHUD
  │     ├── HP 条（health / maxHealth + 治疗按钮）
  │     ├── 水显示（water / maxWater）
  │     ├── 食物显示（curedMeat 数量）
  │     └── 背包空间
  ├── WorldMap（CSS Grid 61×61）
  │     └── MapTile × 3721 格（仅渲染 mask=true 的格子）
  │           ├── 地形背景色（CSS 类：forest/field/barrens/road）
  │           ├── 地标叠加字符（金色粗体）
  │           ├── 当前位置高亮（@ + 边框色）
  │           ├── 已访问标记（! 后缀）
  │           └── hover tooltip（地标名称，i18n 解析）
  ├── WorldControls
  │     ├── 方向键（↑↓←→ 按钮 + 键盘 WASD/箭头监听 + 点击地图格子）
  │     └── 治疗按钮（吃肉干 +MEAT_HEAL / 用药 +MEDS_HEAL / 打 hypo +HYPO_HEAL）
  └── 事件嵌入：EventOverlay + CombatOverlay（复用现有，通过 dispatch startEvent 触发）
```

**移动循环**（每次按方向键，伪代码）：

```typescript
function handleMove(direction: [number, number]) {
  // 1. 边界检查
  const [nx, ny] = [curPos[0] + d[0], curPos[1] + d[1]]
  if (nx < 0 || nx > size*2 || ny < 0 || ny > size*2) return

  // 2. 位置更新
  const prevTile = tiles[curPos[0]][curPos[1]]
  curPos = [nx, ny]
  const newTile = tiles[nx][ny]

  // 3. 地图揭露
  lightMap(curPos, mask, LIGHT_RADIUS)

  // 4. 地形叙事（仅 terrain 切换时推送）
  const msg = getNarration(prevTile.terrain, newTile.terrain)
  if (msg) dispatch(pushNarrative(msg))

  // 5. TileEffect 组合调用
  const terrainEffect = getTerrainEffect(newTile.terrain)
  const landmarkEffect = newTile.landmark ? getLandmarkEffect(newTile.landmark) : undefined
  const composed = composeEffects(terrainEffect, landmarkEffect)
  const result = composed({ pos: [nx, ny], dispatch, state })

  //   处理 narrations / modifiers / encounters
  for (const n of result.narrations ?? []) dispatch(pushNarrative(t(n)))
  for (const [res, delta] of Object.entries(result.modifiers ?? {})) {
    dispatch(applyRecipe(d => modifyResource(d, res, delta)))
  }

  // 6. Portal Landmark 传送检测
  if (result.nextMapId) {
    dispatch({ type: 'ENTER_MAP', mapId: result.nextMapId, pos: result.nextPos })
    return
  }

  // 7. 地标事件触发（非 Portal 地标）
  if (newTile.landmark) {
    if (newTile.landmark === 'village') goHome()
    else dispatch(startEvent(getLandmarkSceneId(newTile.landmark)))
    return
  }

  // 8. 消耗补给 → 可能死亡
  if (!useSupplies()) return

  // 9. 随机遭遇战
  if (shouldFight()) {
    const enc = pickAvailableEncounter()
    if (enc) dispatch(startEvent(enc.id))
  }
}
```

### 4.4 地图渲染：CSS Grid 方案

```css
/* World.module.css — 关键样式 */
.worldMap {
  display: grid;
  grid-template-columns: repeat(61, 1.6ch);
  grid-template-rows: repeat(61, 1.2em);
  font-family: monospace;
  font-size: 0.85rem;
  user-select: none;
  overflow: auto;
}

.tile {
  cursor: pointer;
  position: relative;
  text-align: center;
}

.masked { visibility: hidden; }

.forest   { background: #1a3a1a; color: #4a8; }
.field    { background: #3a3a1a; color: #aa8; }
.barrens  { background: #2a2a2a; color: #888; }
.road     { background: #3a2a1a; color: #a86; }

.current  { outline: 2px solid var(--game-accent); z-index: 1; }
.landmark { color: var(--game-accent); font-weight: bold; }
```

**性能考量**：61×61=3721 个格子。React 虚拟 DOM 足以处理——每格是一个简单的 `<span>` 无子组件，初始渲染约 50ms。不做 Canvas。

- 如果实测卡顿：加 `content-visibility: auto` + `contain: strict` 做 CSS 级别虚拟化
- 滚动条默认不可见，hover 时显示（复用 `index.css` 中的 aside 滚动条模式）

---

## 5. 事件/战斗接入

### 5.1 新增事件目录

```
src/events/world/
  encounters.ts          # 随机遭遇战（对标原版 Encounters，~15 个事件）
  setpieces/
    ironmine.ts          # 铁矿
    coalmine.ts          # 煤矿
    sulphurmine.ts       # 硫磺矿
    house.ts             # 老房子
    cave.ts              # 洞穴
    town.ts             # 废弃城镇
    city.ts             # 废墟城市
    outpost.ts          # 前哨站
    ship.ts             # 坠毁飞船 → 解锁 Space
    borehole.ts         # 钻孔
    battlefield.ts      # 战场
    swamp.ts            # 沼泽
    cache.ts            # 遗物宝箱
    executioner.ts      # 处决者战舰 → 解锁 Fabricator
```

每个文件就是一个标准 `EventDef`，完全复用现有类型和组件：

```typescript
// encounters.ts 中的一条示例
export const snarlingBeast: EventDef = {
  id: 'encounter.snarlingBeast',
  title: 'events.encounter.snarlingBeast.title',
  isAvailable: (state) =>
    getWorldDistance(state) <= 10 && getCurTerrain(state) === 'forest',
  scenes: {
    start: {
      combat: true,
      chara: 'R',
      health: 5,
      damage: 1,
      hit: 0.8,
      attackDelay: 1,
      loot: {
        fur:   { min: 1, max: 3, chance: 1 },
        meat:  { min: 1, max: 3, chance: 1 },
        teeth: { min: 1, max: 3, chance: 0.8 },
      },
      notification: 'events.encounter.snarlingBeast.notif',
      text: ['events.encounter.snarlingBeast.text'],
      buttons: { leave: { text: '继续', nextScene: 'end' } },
    },
  },
}
```

### 5.2 接入方式

**零改动接入**——不需要修改 EventOverlay 或 CombatOverlay。现有机制已完整支持：

- `scene.combat = true` → EventOverlay 自动渲染 CombatOverlay
- `scene.loot` → 战斗结束后自动掉落发放
- `scene.onLoad` → setpiece 进入场景时执行副作用（如解锁矿场 building）
- `scene.buttons` → 事件内的多分支选择

新增事件通过 `registerEvent()` 自动注册（import 时执行）。

### 5.3 战斗选武器问题

当前 CombatOverlay 从 `WEAPONS` 表渲染全部武器网格。**World 中应限制为仅 outfit 中携带的武器**。需在 CombatOverlay 的 Props 中增加可选过滤：

```typescript
interface CombatOverlayProps {
  scene: SceneDef
  onCombatEnd: (won: boolean, loot: Record<string, number>) => void
  /** 可用武器 ID 过滤（World 中仅 outfit 携带的武器可选） */
  availableWeapons?: string[]
}
```

默认（`undefined`）= 全部武器可用（兼容 Room/Outside 事件）。World 传入 `Object.keys(outfit)` 取与 `WEAPONS` 的交集。

---

## 6. Action 扩展

### 6.1 新增 Action 类型

> 修改 `src/state/reducer.ts`

```typescript
// GameAction 联合新增：
| { type: 'EMBARK_WORLD' }
| { type: 'RETURN_FROM_WORLD'; died: boolean }
| { type: 'ENTER_MAP'; mapId: string; pos?: [number, number] }
| { type: 'LEAVE_MAP' }
| { type: 'UPDATE_WORLD_RUNTIME'; patch: Partial<WorldRuntimeState> }
```

### 6.2 EMBARK_WORLD

```typescript
case 'EMBARK_WORLD': {
  // 1. 扣减 outfit 物品
  for (const [key, count] of Object.entries(draft.outfit)) {
    modifyResource(draft, key, -count, 'cost.embark')
  }
  // 2. 首次生成地图（如不存在）
  if (!draft.game.world) {
    const { tiles } = generateMap(MAP_DEFS.world)
    draft.game.world = {
      mapId: 'world', tiles,
      mask: newMask(tiles),
      usedOutposts: {},
    }
  }
  // 3. 初始化运行时状态
  const maxWater = getMaxWater(draft)
  const maxHealth = getMaxHealth(draft)
  draft.game.worldRuntime = {
    curPos: [RADIUS, RADIUS],
    water: maxWater,
    health: maxHealth,
    maxHealth,
    foodMove: 0,
    waterMove: 0,
    fightCounter: 0,
    starvation: false,
    thirst: false,
    mask: deepCopy(draft.game.world.mask),
    usedOutposts: { ...draft.game.world.usedOutposts },
    minesFound: {},
    mapStack: [],
  }
  // 4. 切换场景
  draft.currentRoom = 'world'
  // 5. 揭露初始视野
  lightMap([RADIUS, RADIUS], draft.game.worldRuntime.mask, LIGHT_RADIUS)
  break
}
```

### 6.3 RETURN_FROM_WORLD

```typescript
case 'RETURN_FROM_WORLD': {
  const wr = draft.game.worldRuntime
  if (!wr) break

  if (action.died) {
    // 死亡 — 丢弃临时副本 + embark 冷却 + 清空 outfit
    delete draft.game.worldRuntime
    draft.cooldown['embark'] = DEATH_COOLDOWN
    draft.currentRoom = 'room'
    draft.outfit = {}
  } else {
    // 回村 — 提交 mask + usedOutposts
    if (draft.game.world) {
      draft.game.world.mask = wr.mask
      draft.game.world.usedOutposts = wr.usedOutposts
      // 矿场解锁
      if (wr.minesFound?.iron && !draft.game.buildings['iron mine']) {
        draft.game.buildings['iron mine'] = 1
      }
      if (wr.minesFound?.coal && !draft.game.buildings['coal mine']) {
        draft.game.buildings['coal mine'] = 1
      }
      if (wr.minesFound?.sulphur && !draft.game.buildings['sulphur mine']) {
        draft.game.buildings['sulphur mine'] = 1
      }
      // 飞船发现
      if (wr.shipFound && !draft.features['location.spaceShip']) {
        draft.features['location.spaceShip'] = true
      }
    }
    delete draft.game.worldRuntime
    draft.currentRoom = 'path'
    // 归还保留物品
    for (const [key, count] of Object.entries(draft.outfit)) {
      if (shouldKeepOnReturn(key)) {
        modifyResource(draft, key, count, 'return.embark')
      } else {
        draft.outfit[key] = 0
      }
    }
  }
  break
}
```

### 6.4 ENTER_MAP / LEAVE_MAP

```typescript
case 'ENTER_MAP': {
  const wr = draft.game.worldRuntime
  if (!wr) break
  // 压栈
  wr.mapStack.push({
    mapId: draft.game.world!.mapId,
    pos: [...wr.curPos],
    mask: wr.mask,
    usedOutposts: { ...wr.usedOutposts },
  })
  // 切换到目标地图
  draft.game.world!.mapId = action.mapId
  wr.curPos = action.pos ?? getMapEntryPos(action.mapId)
  wr.mask = newMask(getMapSize(action.mapId))
  wr.usedOutposts = {}
  break
}

case 'LEAVE_MAP': {
  const wr = draft.game.worldRuntime
  if (!wr) break
  if (wr.mapStack.length > 0) {
    const prev = wr.mapStack.pop()!
    draft.game.world!.mapId = prev.mapId
    wr.curPos = prev.pos
    wr.mask = prev.mask
    wr.usedOutposts = prev.usedOutposts
  }
  // 栈空时不在此处理，由 World 组件的 goHome/die 接管
  break
}
```

---

## 7. Path 场景路由

### 7.1 Path 解锁

玩家获得 compass（指南针）后解锁。compass 通过 nomad 事件购买获取（已实现在 `src/events/room/nomad.ts`）。

```typescript
// GameLoop 或其他模块中：
// 当 stores['compass'] >= 1 且 features['location.path'] 不存在时：
// dispatch(unlockFeature('location.path'))
```

### 7.2 场景注册

```typescript
// App.tsx 或 rooms/index.ts
const SCENES: Partial<Record<RoomName, ComponentType>> = {
  [RoomName.Room]: Room,
  [RoomName.Outside]: Outside,
  [RoomName.Path]: Path,    // ← 新增
  [RoomName.World]: World,  // ← 新增
}
```

Path 标签在 Header 中的显隐由 `features['location.path']` 驱动（已有机理）。

---

## 8. 数据流总览

```
                  nomad 事件购买 compass
                      │
              features['location.path'] = true
                      │
              Header 显示 [Path] 标签
                      │
              点击 Path → 渲染 Path.tsx
                      │
        ┌─────────────┤
        │             │
   装备选择          出发按钮
   (outfit)       EMBARK_WORLD
        │             │
        │      ┌──────┘
        │      │
        │  扣库存 + 初始化 WorldRuntime
        │  首次 → generateMap() + newMask()
        │      │
        │   currentRoom = 'world'
        │      │
        │   World.tsx 渲染
        │      │
        │   ┌──────┼──────┐
        │   │      │      │
        │  行走  地标    遭遇
        │   │      │      │
        │   │  setpiece  encounter
        │   │  EventDef  EventDef
        │   │      │      │
        │   │  EventOverlay (已有) → 按钮/分支
        │   │      │
        │   │  combat:true → CombatOverlay (已有)
        │   │
        │   ├── goHome → RETURN_FROM_WORLD (died=false)
        │   │              提交 mask + 归还 outfit → currentRoom='path'
        │   │
        │   ├── die   → RETURN_FROM_WORLD (died=true)
        │   │              丢弃 mask + 清空 outfit → currentRoom='room' + 120s 冷却
        │   │
        │   └── Portal Landmark → ENTER_MAP (mapStack.push + load new map)
        │                          LEAVE_MAP (mapStack.pop → restore)
```

---

## 9. 约定与扩展点

### 9.1 本项目约定

- **函数式风格**：`generateMap()`、`composeEffects()`、`narrateTerrainChange()` 等为纯函数
- **数据驱动**：`TerrainDef[]` 和 `LandmarkDef[]` 配置表，新增地形/地标加一行
- **事件复用**：World 的 encounter/setpiece 使用现有 `EventDef` 类型，零新机制
- **战斗复用**：CombatOverlay 通过 `scene.combat = true` 自动接入
- **verbatimModuleSyntax**：显式 `type` 导入
- **const object 枚举**：不新增 enum，使用 `as const` + type 别名

### 9.2 扩展点

- **新地图**：在 `MAP_REGISTRY` 中新增 `MapDef`，设置 `isAvailable` 解锁条件
- **Portal Landmark 激活**：给任意地标的 `onEnter` 返回 `{ nextMapId: 'cave_deep', nextPos: [3,3] }`，并在 `MAP_REGISTRY` 中注册目标地图。`ENTER_MAP`/`LEAVE_MAP` + `mapStack` 已在 reducer 中实现
- **新地形效果**：在 `effects.ts` 中新增 `TileEffectFn` 工厂函数
- **Path 多地图选择器**：将 EmbarkButton 替换为 MapCard 列表，每张卡对应一个 `MapDef`
- **武器过滤**：CombatOverlay 已支持 `availableWeapons` prop，World 传入 outfit 武器列表即可

---

## 10. 风险与注意事项

- **地图生成性能**：61×61 螺旋生成约 3700 次 `chooseTile()` 调用，纯计算 < 5ms，非瓶颈
- **CSS Grid 3721 格子渲染**：React 初始渲染约 50-100ms，可接受。如需优化加 `content-visibility: auto`
- **死亡回滚正确性**：`worldRuntime.mask` 必须与 `game.world.mask` 完全解耦（deepCopy），否则 goHome 后再次 embark 的初始 mask 状态错误
- **deepCopy 性能**：mask 是 `boolean[61][61]` ≈ 3.7KB，deepCopy < 0.1ms，忽略不计
- **兼容现有 combat 系统**：World 中 playerAttack 应从 outfit 中选武器，而非全部 WEAPONS。已在 CombatOverlay 增加 `availableWeapons` prop 解决
- **存量测试**：新增 action 后 state.test.ts 中 10 条失败的测试（因 RUN_MODE debug 导致）需同步修复或标记为已知
