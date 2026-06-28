# A Dark Room — React 重构扩展

基于 [doublespeakgames/adarkroom](https://github.com/doublespeakgames/adarkroom) 的 React + TypeScript 重构扩展项目。

## 技术栈

| 工具 | 用途 |
|------|------|
| [pnpm](https://pnpm.io/) | 高效的包管理器 |
| [React 19](https://react.dev/) | UI 框架 |
| [TypeScript](https://www.typescriptlang.org/) | 类型安全 |
| [Vite](https://vite.dev/) | 构建工具 & 开发服务器 |
| [Tailwind CSS v4](https://tailwindcss.com/) | 原子化 CSS 框架 |
| [CSS Modules](https://github.com/css-modules/css-modules) | 组件级样式隔离 |
| [Immer](https://immerjs.github.io/immer/) | 不可变状态（draft 模式） |
| [i18next](https://www.i18next.com/) | 国际化（中/英） |
| [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) | 音频引擎（BGM/SFX） |
| [Vitest](https://vitest.dev/) | 单元测试 |

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建静态站点
pnpm build

# 预览构建产物
pnpm preview

# 运行测试
pnpm test
```

## 项目结构

```
.
├── index.html                # 入口 HTML
├── public/                   # 静态资源（不经过构建处理）
├── src/
│   ├── main.tsx              # React 挂载入口
│   ├── index.css             # 全局样式 & Tailwind 指令 & 动画关键帧
│   ├── App.tsx               # 根组件（三栏布局 + GameLoop + Toolbar）
│   ├── config.ts             # 游戏数值集中配置 + RESOURCES(18项) + WORKER_INCOME + TRAP_DROPS + 背包常量
│   ├── state/                # 全局状态管理（Immer + Context）
│   │   ├── types.ts          # 类型定义 + 枚举 + INITIAL_STATE + PersistentWorldData
│   │   ├── reducer.ts        # Immer reducer（modifyResource + 语义 action + World action）
│   │   ├── GameContext.tsx    # React Context + GameProvider
│   │   ├── hooks.ts          # useGameState / useGameDispatch
│   │   ├── index.ts          # barrel export
│   │   └── state.test.ts     # Vitest 单元测试
│   ├── system/               # 全局系统模块
│   │   ├── GameLoop.tsx       # 单主循环（100ms 驱动火堆/建造者/收入）
│   │   └── gameSpeed.ts       # 倍速模块（1×/2×/3×/5×，localStorage 持久化）
│   ├── components/           # 通用 UI 组件
│   │   ├── Button.tsx         # 操作按钮（冷却驱动 + hover 成本浮层）
│   │   ├── Button.module.css
│   │   ├── CollapsibleSection.tsx # 可折叠区块
│   │   ├── ErrorBoundary.tsx   # 顶层错误边界
│   │   ├── EventOverlay.tsx    # 事件弹窗覆盖层（Header下方/中栏内）
│   │   ├── EventOverlay.module.css
│   │   ├── Header.tsx         # 场景导航标签
│   │   ├── NarrativePanel.tsx # 左栏双区叙事
│   │   ├── NarrativePanel.module.css
│   │   ├── StoresPanel.tsx    # 右栏折叠面板（建筑/库存/武器 + 趋势 + 人口）
│   │   ├── Toolbar.tsx        # 右下角工具栏（1×–5×速度/字体/主题）
│   │   ├── WorkersPanel.tsx   # 工人分配面板（grid-cols-2 + hover tooltip）
│   │   ├── WorkersPanel.module.css
│   │   ├── WorldHUD.tsx       # World 右栏面板（状态/装备/治疗）
│   │   ├── WorldHUD.module.css
│   │   ├── WorldInfo.tsx      # World 顶部信息栏（地图名称/天气）
│   │   └── WorldInfo.module.css
│   ├── rooms/                # 场景组件
│   │   ├── Room.tsx           # 暗室（火堆操作 + 建造分栏）
│   │   ├── Outside.tsx        # 野外（伐木 + 检查陷阱 + WorkersPanel）
│   │   ├── Path.tsx           # 小径（出发装备选择 + 背包容量管理）
│   │   ├── World.tsx          # 世界（Canvas 渲染 + 行走探索）
│   │   └── craftables/        # 制造系统（纯数据配置）
│   │       ├── index.ts        # 合并导出 + buildCraftable action
│   │       ├── types.ts        # CraftableDef / UnlockCondition 接口
│   │       ├── buildings.ts    # 10 栋建筑配置
│   │       ├── effects.ts      # 副作用模板（income / unlockFeature / chain）
│   │       ├── unlock.ts       # evaluateUnlock 解锁评估器
│   │       ├── buttonState.ts  # computeButtonState 统一可访问性
│   │       └── __tests__/      # 11 项单元测试
│   ├── events/               # 事件系统（EventRegistry 统一注册 34 事件）
│   │   ├── EventRegistry.ts   # 统一注册入口
│   │   ├── types.ts           # EventDef + EventId 联合类型
│   │   ├── scheduler.ts       # 事件调度器
│   │   ├── registry.ts        # 兼容重导出层
│   │   ├── utils.ts           # 概率解析
│   │   ├── room/              # 10 个 Room 事件
│   │   ├── outside/           # 6 个 Outside 事件
│   │   └── world/             # World 事件（3 遭遇战 + 1 刽子手 + 14 setpiece）
│   ├── triggers/             # 触发系统（空间触发 + 效果分发 + 配置表）
│   │   ├── TriggerManager.ts  # Enter/Stay/Exit 三阶段触发
│   │   ├── EffectDispatcher.ts # 声明式效果分发
│   │   └── triggerConfig.ts   # entityType→effect 映射
│   ├── combat/               # 战斗系统
│   │   ├── types.ts           # CombatState
│   │   ├── weapons.ts         # 武器配置（8 把）
│   │   ├── CombatManager.ts   # 纯函数战斗逻辑
│   │   ├── CombatOverlay.tsx  # 战斗 UI
│   │   └── CombatOverlay.module.css
│   ├── world/                # 世界地图生成 + 实体系统 + Canvas 渲染管道
│   │   ├── constants.ts       # 世界常量 + 地形/地标配置表
│   │   ├── types.ts           # MapTile/WorldGen/TerrainDef/LandmarkDef
│   │   ├── WorldCanvasScene.ts # 独立 Canvas 渲染场景（rAF + SceneState）
│   │   ├── renderViewport.ts  # 纯函数视口渲染
│   │   ├── renderViewport.test.ts
│   │   ├── entity/            # entity definitions: landmarks.ts (14 factory landmarks), village.ts (custom 3×3 box), factory.ts, types.ts, catalog.ts, testHelpers.ts; parametrized tests
│   │   ├── styleResolver.ts  # 全局样式映射（EntityCellOutput → fillStyle + font）
│   │   ├── WorldGen.ts        # 世界地图生成器
│   │   ├── WorldGen.test.ts
│   │   └── index.ts           # barrel export
│   ├── i18n/                 # 国际化
│   │   ├── zh.json            # 中文翻译
│   │   └── en.json            # 英文翻译
│   └── styles/
│       └── tokens.css        # CSS 设计 Token（浅色/暗色主题）
├── doc/                      # 文档
│   ├── 原始ADarkRoom架构分析.md    # 原始项目源码分析
│   └── specs/                # 设计规格书
├── origin-adarkroom/         # 原始项目参考（只读，git 忽略）
├── vite.config.ts            # Vite 配置
├── tsconfig.json             # TypeScript 配置
├── package.json              # 依赖 & 脚本
└── README.md
```

## 当前功能

- 🏠 **暗室**：点火/添柴，火堆冷却 + 温度调节
- 🌲 **野外**：伐木 + 检查陷阱（随机掉落 + 诱饵消耗），grid-cols-2 布局
- 👥 **人口系统**：hut 提供容纳上限，定时器自动增长，多级叙事通知
- 👷 **工人分配**：从采集者池调配猎人/陷阱师/制革工等工种，hover 显示实际产出
- 🏗️ **建造系统**：10 栋建筑，per-worker 收入，动态解锁 + 成本递增，纯数据驱动
- 👤 **建造者 NPC**：5 阶段状态机，自动添柴，解锁野外和建造能力
- ⏱ **游戏加速**：1×/2×/3×/5× 倍速，进度条动画自适应
- 📜 **叙事日志**：双区固定布局（手动叙事 + 资源变化），新旧渐隐
- 📊 **趋势面板**：资源分类 + 纯箭头（↑/↓）趋势 + 固定占位防跳变
- 🎛️ **右栏面板**：人口独立行 + 三块折叠区（建筑/库存/武器）
- 🚶 **小径（Path）**：出发准备场景，从仓库选择装备装入背包（受容量/重量/库存约束），护甲/水量展示
- 🗺️ **世界（World）**：通过小径出发进入，Canvas 渲染地图（WorldCanvasScene 独立模块 + renderViewport / renderFullMap 纯函数 + renderGrid 统一循环 + StyleResolver + drawComposed 批量绘制，21×21 视口 / 61×61 全图双模式，EntityCell 抽象接口 + createUniformEntity 工厂 + deriveEntity 派生）。右栏切换为 WorldHUD（状态/装备/治疗），顶部 WorldInfo 栏显示地图名称和天气。四向行走（WASD/方向键/点击），食物/水源消耗，随机遭遇战，TriggerManager 空间触发（15 地标）。导航栏隐藏 World 标签，只能通过小径→出发进入
- 🎲 **随机事件**：Room（商人/乞丐/流浪者...）+ Outside（陷阱被毁/火灾/瘟疫/袭击...）+ World（野兽/枯瘦男/异鸟遭遇战），纯数据配置，isAvailable 条件 + DAG 场景图
- ⚔️ **战斗系统**：CombatOverlay 自包含（HP 条/武器网格/敌攻定时器/治疗/掉落），事件场景声明 `combat: true` 即可触发
- 🎨 **主题切换**：浅色/暗色，localStorage 持久化
- 🔤 **字体缩放**：12–24px，localStorage 持久化
- 🌐 **国际化**：中/英，自动匹配浏览器语言
- 🛡️ **制造品扩展**：14 件新制造品——三种护甲、三种水容器、三种背包升级、四种武器、火把
- 🏪 **交易系统**：建造 trading post 后解锁 13 种资源兑换
- ⚔️ **战斗增强**：12 把武器 + 命中率 0.8 + Stun 眩晕机制
- ⚠️ **World Danger**：距离+护甲动态危险警告
- 🛤️ **动态道路**：清除 outpost 后自动画路回村
- 🏷️ **15 地标事件**：TriggerManager Enter/Stay/Exit 生命周期 + TRIGGER_CONFIG 声明式映射
- 💀 **Executioner Boss**：多场景 + 战斗 + fleet beacon 掉落
- 🍖 **生存系统**：Starvation/Dehydration 累积 + 死亡冷却 120s
- 🧭 **指南针**：持有 compass 时显示飞船方向
- 🚀 **Ship 飞船**：hull/thrusters 升级 + alien alloy + lift-off
- 🌌 **Space 太空**：Canvas 实时飞船躲避 mini-game（60s 计时）
- 🔧 **Fabricator 工坊**：alien alloy 制造 8 件终局装备
- ⭐ **Perk 系统**：11 项可获取特性（战斗/世界/事件多维度生效）
- 🏆 **Prestige/Scoring**：声望继承 + 计分 + Cache 地标条件生成
- 🔊 **音频系统**：Web Audio API + Toolbar 静音开关
- 🎨 **UI 优化**：建造/贸易两栏布局 + 按钮等宽修复
- 🛡️ **ErrorBoundary**：顶层错误捕获，防白屏
- 🔲 **全图 / 视口切换**：Toolbar 按钮一键切换玩家居中 21×21 视口与完整 61×61 全图，地图容器有可见边框，Canvas 自适应容器尺寸

## 可参考
rot.js、libtcod、Brogue、Cogmind

## License

原始项目 (c) Michael Townsend / doublespeakgames — [MPL-2.0](https://github.com/doublespeakgames/adarkroom/blob/master/LICENSE)
