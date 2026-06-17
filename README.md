# A Dark Room — React 重构练习

基于 [doublespeakgames/adarkroom](https://github.com/doublespeakgames/adarkroom) 的 React + TypeScript 重构项目，用于练习现代前端工程化技术栈。

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
│   ├── config.ts             # 游戏数值集中配置 + RESOURCES(18项) + WORKER_INCOME + TRAP_DROPS
│   ├── state/                # 全局状态管理（Immer + Context）
│   │   ├── types.ts          # 类型定义 + 枚举 + INITIAL_STATE
│   │   ├── reducer.ts        # Immer reducer（modifyResource + 语义 action）
│   │   ├── GameContext.tsx    # React Context + GameProvider
│   │   ├── hooks.ts          # useGameState / useGameDispatch
│   │   ├── index.ts          # barrel export
│   │   └── state.test.ts     # Vitest 单元测试
│   ├── system/               # 全局系统模块
│   │   ├── GameLoop.tsx       # 单主循环（100ms 驱动火堆/建造者/收入）
│   │   └── gameSpeed.ts       # 倍速模块（1×/2×/3×，localStorage 持久化）
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
│   │   └── WorkersPanel.module.css
│   ├── rooms/                # 场景组件
│   │   ├── Room.tsx           # 暗室（火堆操作 + 建造分栏）
│   │   ├── Outside.tsx        # 野外（伐木 + 检查陷阱 + WorkersPanel，grid-cols-2 布局）
│   │   └── craftables/        # 制造系统（纯数据配置）
│   │       ├── index.ts        # 合并导出 + buildCraftable action
│   │       ├── types.ts        # CraftableDef / UnlockCondition 接口
│   │       ├── buildings.ts    # 10 栋建筑配置
│   │       ├── effects.ts      # 副作用模板（income / unlockFeature / chain）
│   │       ├── unlock.ts       # evaluateUnlock 解锁评估器
│   │       ├── buttonState.ts  # computeButtonState 统一可访问性
│   │       └── __tests__/      # 11 项单元测试
│   ├── events/               # 随机事件系统
│   │   ├── types.ts           # EventDef/SceneDef/场景按钮 类型
│   │   ├── scheduler.ts       # 调度器（GameLoop 驱动）
│   │   ├── registry.ts        # 事件注册表
│   │   ├── utils.ts           # 概率解析（权重/累积双格式）
│   │   ├── room/              # 9 个 Room 事件
│   │   └── outside/           # 6 个 Outside 事件
│   ├── combat/               # 战斗系统
│   │   ├── types.ts           # CombatState
│   │   ├── weapons.ts         # 武器配置（8 把）
│   │   ├── CombatManager.ts   # 纯函数战斗逻辑
│   │   ├── CombatOverlay.tsx  # 战斗 UI
│   │   └── CombatOverlay.module.css
│   ├── i18n/                 # 国际化
│   │   ├── zh.json            # 中文翻译
│   │   └── en.json            # 英文翻译
│   └── styles/
│       └── tokens.css        # CSS 设计 Token（浅色/暗色主题）
├── doc/                      # 文档
│   └── 原始ADarkRoom架构分析.md    # 原始项目源码分析
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
- 📊 **趋势面板**：资源分类 + 趋势箭头 + 滑动窗口
- 🎛️ **右栏面板**：人口独立行 + 三块折叠区（建筑/库存/武器）
- 🎲 **随机事件**：Room（商人/乞丐/流浪者...）+ Outside（陷阱被毁/火灾/瘟疫/袭击...），纯数据配置，isAvailable 条件 + DAG 场景图
- ⚔️ **战斗系统**：CombatOverlay 自包含（HP 条/武器网格/敌攻定时器/治疗/掉落），事件场景声明 `combat: true` 即可触发
- 🎨 **主题切换**：浅色/暗色，localStorage 持久化
- 🔤 **字体缩放**：12–24px，localStorage 持久化
- 🌐 **国际化**：中/英，自动匹配浏览器语言
- 🛡️ **ErrorBoundary**：顶层错误捕获，防白屏

## 重构目标

原始项目是一个纯 JavaScript 文字冒险游戏。本重构练习逐步将其改造为：

- 组件化的 React 架构
- 类型安全的 TypeScript
- 函数式状态管理（Immer + useReducer）
- **声明式数据驱动**（RESOURCES / Craftables / WORKER_INCOME / TRAP_DROPS 配置表，新增资源/建筑/工人职业只需加一行）
- 可静态部署的 SPA
- 响应式 UI（Tailwind + CSS Modules）

详见 [`doc/`](doc/) 目录下的架构分析、阶段方案和 TODO 清单。

## License

原始项目 (c) Michael Townsend / doublespeakgames — [MPL-2.0](https://github.com/doublespeakgames/adarkroom/blob/master/LICENSE)
