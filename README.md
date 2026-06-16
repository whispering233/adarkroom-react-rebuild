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
│   ├── config.ts             # 游戏数值集中配置 + RESOURCES 资源注册表
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
│   │   ├── Button.tsx         # 操作按钮（冷却驱动 + hover 成本浮层 + label/count 左右对齐）
│   │   ├── CollapsibleSection.tsx # 可折叠区块（▶/▼）
│   │   ├── Header.tsx         # 场景导航标签
│   │   ├── NarrativePanel.tsx # 左栏双区叙事（手动 + 资源变化，grid 固定分栏）
│   │   ├── StoresPanel.tsx    # 右栏三块折叠面板（建筑物/库存/武器 + 趋势）
│   │   └── Toolbar.tsx        # 右下角工具栏（速度/字体/主题）
│   ├── rooms/                # 场景组件
│   │   ├── Room.tsx           # 暗室（火堆操作 + 建造 grid flex-col 分栏）
│   │   ├── Outside.tsx        # 野外（伐木 + 延迟奖励）
│   │   └── craftables/        # 制造系统（纯数据配置）
│   │       ├── index.ts        # 合并导出 + buildCraftable action
│   │       ├── types.ts        # CraftableDef / UnlockCondition 接口
│   │       ├── buildings.ts    # 10 栋建筑配置
│   │       ├── effects.ts      # 副作用模板（income / unlockFeature / chain）
│   │       ├── unlock.ts       # evaluateUnlock 解锁评估器
│   │       ├── buttonState.ts  # computeButtonState 统一可访问性
│   │       └── __tests__/      # 11 项单元测试
│   ├── i18n/                 # 国际化
│   │   ├── zh.json            # 中文翻译
│   │   └── en.json            # 英文翻译
│   └── styles/
│       └── tokens.css        # CSS 设计 Token（浅色/暗色主题）
├── doc/                      # 文档
│   ├── 原始ADarkRoom架构分析.md    # 原始项目源码分析
│   ├── 重构各阶段方案.md          # 分阶段重构计划
│   └── 重构todo checklist.md     # 详细任务清单
├── origin-adarkroom/         # 原始项目参考（只读，git 忽略）
├── vite.config.ts            # Vite 配置
├── tsconfig.json             # TypeScript 配置
├── package.json              # 依赖 & 脚本
└── README.md
```

## 当前功能

- 🏠 **暗室**：点火/添柴，火堆冷却 + 温度调节
- 🌲 **野外**：伐木（冷却 + 延迟奖励，倍速加速）
- 🏗️ **建造系统**：10 栋建筑（trap → armoury），动态解锁 + 成本递增 + 收入注册，纯数据驱动可扩展
- 👤 **建造者 NPC**：5 阶段状态机，自动添柴，解锁野外和建造能力
- ⏱ **游戏加速**：1×/2×/3× 倍速，冷却进度条动画自适应
- 📜 **叙事日志**：双区固定布局（手动叙事 + 资源变化），新条目在上渐隐，独立滚动不挤占
- 📊 **趋势面板**：资源分类显示 + 趋势箭头 + 滑动窗口标注（/ Nt）
- 🎛️ **右栏面板**：三块可折叠数据区（建筑物 + 库存 + 武器），默认全展开
- 🎨 **主题切换**：浅色/暗色，`localStorage` 持久化
- 🔤 **字体缩放**：12-24px，`localStorage` 持久化
- 🌐 **国际化**：中文/英文，自动匹配浏览器语言

## 重构目标

原始项目是一个纯 JavaScript 文字冒险游戏。本重构练习逐步将其改造为：

- 组件化的 React 架构
- 类型安全的 TypeScript
- 函数式状态管理（Immer + useReducer）
- **声明式数据驱动**（RESOURCES / Craftables 配置表，新增资源/建筑只需加一行）
- 可静态部署的 SPA
- 响应式 UI（Tailwind + CSS Modules）

详见 [`doc/`](doc/) 目录下的架构分析、阶段方案和 TODO 清单。

## License

原始项目 (c) Michael Townsend / doublespeakgames — [MPL-2.0](https://github.com/doublespeakgames/adarkroom/blob/master/LICENSE)
