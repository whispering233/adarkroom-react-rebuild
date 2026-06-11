# A Dark Room — 原始架构分析

> 基于 [doublespeakgames/adarkroom](https://github.com/doublespeakgames/adarkroom) 源码阅读，为 React 重构提供参考。

## 概览

原始项目是一个 **纯 jQuery + 全局变量** 的单页文字生存游戏（~6000 行 JavaScript），灵感来源于 Candy Box。核心由多个松散耦合的模块组成，通过自定义 `$.Dispatch` 发布/订阅系统通信。

## 技术栈（原始）

| 技术 | 用途 |
|------|------|
| jQuery 1.10 | DOM 操作 / 动画 / 事件 |
| jQuery Color | 颜色动画 |
| jQuery Event Move/Swipe | 滑屏手势 |
| Base64 | 存档导出编码 |
| localStorage | 游戏存档持久化 |
| `<script>` 标签 | 模块加载（顺序依赖） |

## 启动流程

```
index.html (加载所有 <script>)
└── $(function() { Engine.init(); })
    ├── browserValid() / isMobile()     ← 环境检测
    ├── Engine.loadGame()               ← 从 localStorage 恢复 State
    ├── 创建 UI 骨架 (menu, slider)
    ├── $SM.init()                      ← 状态管理器初始化
    ├── AudioEngine.init()              ← 音频引擎
    ├── Notifications.init()            ← 通知系统
    ├── Events.init()                   ← 随机事件调度
    ├── Room.init()                     ← 暗室模块（入口场景）
    ├── Outside.init()                  ← 村庄（条件加载）
    ├── Path.init()                     ← 路径探索（条件加载）
    ├── Ship.init() / Space.init()      ← 飞船/太空（条件加载）
    └── Fabricator.init()               ← 制造工坊（条件加载）
```

## 核心模块详解

### 1. StateManager (`$SM`) — 全局状态中心

全局可变对象 `State`，通过 `eval()` 动态路径读写。

```
State (全局)
├── features.{location}.{room|outside|world|spaceShip|fabricator}
├── stores.{wood|fur|meat|scales|teeth|iron|coal|steel|...}
├── character.{perks|punches|health|...}
├── income.{builder|hunter|trapper|...}  ← 自动收入
├── timers.*                            ← 定时器残留
├── game.{fire|temperature|builder.level|buildings|population|...}
├── playStats.*                         ← 统计
├── previous.*                          ← prestige 数据
├── outfit.*                            ← 出征装备
├── config.{soundOn|lightsOff|hyperMode}
├── wait.*                              ← 延迟事件队列
└── cooldown.*                          ← 按钮冷却残留
```

**核心 API：**

| 方法 | 功能 |
|------|------|
| `$SM.set(path, value)` | 设值，触发 `stateUpdate` 事件 + 自动存档 |
| `$SM.get(path)` | 取值，支持 `requestZero` 返回 0 而非 undefined |
| `$SM.add(path, delta)` | 数值增减 |
| `$SM.setM(parent, {k:v})` | 批量设置 |
| `$SM.addM(parent, {k:v})` | 批量增减 |
| `$SM.createState(path, val)` | 自动创建缺失的中间路径 |
| `$SM.remove(path)` | 删除状态 |
| `$SM.fireUpdate(stateName)` | 发布 `stateUpdate` 事件 |
| `$SM.collectIncome()` | 每秒执行一次的收入结算 |
| `$SM.updateOldState()` | 存档版本迁移（v1.0→v1.3） |

**关键问题**：`eval('('+fullPath+') = value')` 无类型安全，路径拼写错误只在运行时暴露。

### 2. Engine — 中央调度器

- **模块切换**：`Engine.travelTo(module)` 通过 jQuery 动画滑动 `#locationSlider` 实现场景切换
- **时间系统**：`Engine.setTimeout/setInterval` 封装，支持双倍速（hyper mode）
- **存档**：`localStorage.gameState = JSON.stringify(State)` 全量序列化
- **UI 菜单**：创建音量、语言、灯光、分享、导入导出等按钮
- **键盘导航**：方向键 / WASD 切换模块

### 3. Room — 暗室模块（游戏起点）

**火堆机制**：5 级状态枚举 `FireEnum`：
```
Dead(0) → Smoldering(1) → Flickering(2) → Burning(3) → Roaring(4)
```
- 自然冷却定时器（5 分钟冷却一级）
- 添柴消耗木材，提升火堆等级
- 建造者 NPC 在 Lv≥3 时会自动添柴

**温度机制**：5 级 `TempEnum`，随火堆等级缓慢趋近：
```
Freezing(0) → Cold(1) → Mild(2) → Warm(3) → Hot(4)
```

**建造者 NPC**：阶段 0→4
| 阶段 | 表现 |
|------|------|
| 0 | 陌生人靠近 |
| 1 | 在角落倒下 |
| 2 | 颤抖，含糊其辞 |
| 3 | 停止颤抖，呼吸平稳 |
| 4 | **提供建造能力** + 自动收入木材 |

**建造系统**：`Craftables` 包含 25+ 物品：
- **建筑**：trap, cart, hut, lodge, trading post, tannery, smokehouse, workshop, steelworks, armoury
- **工具/武器**：torch, bone spear, iron sword, steel sword, rifle
- **升级**：waterskin, cask, water tank, rucksack, wagon, convoy, l/i/s armour

**交易系统**：`TradeGoods` 包括 scales, teeth, iron, coal, steel, medicine, bullets, compass 等

### 4. Button — 按钮工厂

jQuery 插件式按钮工厂函数 `Button.Button(options)`：
- **冷却系统**：进度条动画 + 定时器，冷却状态持久化到 `$SM('cooldown.*')`
- **消耗提示**：tooltip 显示所需资源
- **禁用状态**：`.disabled` class + `data('disabled')`
- **双倍速支持**：hyper mode 下冷却时间减半

### 5. Events — 事件引擎

**事件池**：合并 `Global + Room + Outside + Marketing` 事件列表，按权重随机调度。

**场景系统**：声明式分支叙事，核心数据结构：
```js
{
  title: "事件标题",
  scenes: {
    start: {
      text: ["描述文本"],
      notification: "可选通知",
      reward: { wood: 10 },        // 场景奖励
      buttons: {
        '选项1': {
          text: '按钮文字',
          nextScene: {1: '分支A'},  // 条件跳转
          onChoose: callback,
          cost: { wood: 5 }
        }
      }
    }
  }
}
```

**战斗系统**：回合制动画战斗
- 攻击/治疗按钮动态生成（基于 `Path.outfit` 装备）
- 伤害公式：基础伤害 × Perks 加成 × 命中率
- 武器类型：unarmed / melee / ranged（不同动画）
- 状态效果：stun / enrage / meditation / boost / shield / venomous
- 敌人 AI：定时自动攻击

**延迟机制**：`Events.saveDelay(action, stateName, delay)` — 状态变化后延迟触发

### 6. Header — 标签导航

极简模块：`Header.addLocation(text, id, module)` 动态生成 `.headerButton`，点击触发 `Engine.travelTo()`。

## 通信模式

```
┌──────────┐  stateUpdate事件   ┌───────────┐
│  $SM     │ ─────────────────→ │  Room     │ → updateButton()
│  (状态变更)│                   │           │ → updateStoresView()
└──────────┘                   │           │ → updateIncomeView()
                               └───────────┘
                               ┌───────────┐
                               │  Events   │ → handleStateUpdates()
                               │           │ → 触发延迟事件
                               └───────────┘
                               ┌───────────┐
                               │  Outside  │ → updateVillage()
                               └───────────┘
```

`$.Dispatch(topic)` 基于 jQuery Callbacks，是简化的 pub-sub：
- `$.Dispatch('stateUpdate').publish(e)` 通知所有订阅者
- `$.Dispatch('stateUpdate').subscribe(handler)` 订阅

## 技术债务清单

| 问题 | 严重程度 | 说明 |
|------|----------|------|
| `eval()` 动态路径 | 🔴 高 | 无类型检查，拼写错误运行时暴露 |
| 全局可变状态 | 🔴 高 | `State` 对象任意位置读写，追踪困难 |
| jQuery DOM 操作 | 🟡 中 | 命令式 UI 更新，状态与视图不同步风险 |
| `<script>` 顺序依赖 | 🟡 中 | 模块加载依赖 HTML 标签顺序 |
| 无模块作用域 | 🟡 中 | 所有变量挂在 `window`，污染全局 |
| 单文件过长 | 🟡 中 | `room.js` ~1200 行，职责混杂 |
| 语言系统硬编码 | 🟢 低 | `_()` 函数依赖全局注入 |
| 存档迁移链 | 🟢 低 | `updateOldState()` 线性版本链，可维护但脆弱 |

## 重构关键决策点

1. **状态管理方案**：React Context + useReducer（轻量）vs Zustand（灵活）vs Redux Toolkit（完整）
2. **场景路由**：React Router（URL 驱动）vs 状态驱动条件渲染（更贴近原作）
3. **事件引擎**：声明式配置 + 递归渲染组件 vs 命令式调度器
4. **战斗系统**：React 动画库（framer-motion）vs CSS transitions
5. **音效**：Web Audio API vs Howler.js
