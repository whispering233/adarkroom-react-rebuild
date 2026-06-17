# A Dark Room — React Rebuild

基于 [doublespeakgames/adarkroom](https://github.com/doublespeakgames/adarkroom) 的 React + TypeScript 渐进式重构 **练习学习项目**。

## Project

- 技术栈：pnpm / React 19 / TypeScript ~6.0 / Vite 8 / Tailwind CSS v4 / CSS Modules / Vitest / Immer / i18next
- 入口：`index.html` → `src/main.tsx` → i18n init → `<ErrorBoundary><GameProvider><App /></GameProvider></ErrorBoundary>`
- 项目文档在 `doc/`（`原始ADarkRoom架构分析.md`）
- 原始项目参考在 `origin-adarkroom/`（只读，git-ignored）

## Commands

| 命令 | 作用 |
|------|------|
| `pnpm install` | 安装依赖 |
| `pnpm dev` | Vite 开发服务器 |
| `pnpm build` | `tsc -b && vite build`（类型检查 + 生产构建） |
| `pnpm preview` | 预览构建产物 |
| `pnpm test` | `vitest run` |
| `pnpm test:watch` | `vitest` watch 模式 |
| `pnpm lint` | `eslint .` |

## Architecture

当前已实现：

- **`src/state/`** — 全局状态管理层，替代原项目 `$SM` + `State`
  - `types.ts` — 类型定义 + const-object 枚举（`FireLevel`/`TempLevel`/`RoomName`）+ `INITIAL_STATE`；`Stores` 接口从 `RESOURCES` 配置派生（`extends Record<ResourceId, number>`，新增资源只需在 config.ts 加一行）；`ResourceTickLog`（per-tick 聚合日志）、`NarrativeEntry`（叙事日志条目）、`PendingReward`（延迟奖励）、`IncomeConfig`、`CharacterState`、`GameData`（含 population/workers 字段）
  - `reducer.ts` — Immer draft-recipe reducer。`modifyResource()` 统一资源变更入口 → `_pendingDeltas` 累加 → `INCOME_TICK` 时 flush。语义 action（火堆/建造者/叙事/冷却等）+ 通用 `APPLY_RECIPE` + 人口/工人 action（`INCREASE_POPULATION`/`KILL_VILLAGERS`/`ASSIGN_WORKER`/`UNASSIGN_WORKER`）+ `getNumGatherers()` 辅助函数
  - `GameContext.tsx` — React Context + `<GameProvider>`（接受可选 `initialState`）
  - `hooks.ts` — `useGameContext` / `useGameState` / `useGameDispatch` 三个 hook
  - `index.ts` — barrel export
  - `state.test.ts` — Vitest 单元测试（33 条，含叙事/人口/工人/收入验证）
- **`src/config.ts`** — 游戏数值统一配置 + `RESOURCES` 资源注册表（18 项，4 分类，含 bait）+ `WORKER_INCOME`（10 职业 per-worker 速率）+ `BUILDING_WORKERS`（建筑→职业映射）+ `TRAP_DROPS`（6 档累积概率掉落表）+ `HUT_ROOM`/`POP_INCREASE_INTERVAL` 人口参数 + `NARRATIVE_LOG_MAX`/`RESOURCE_LOG_MAX` 裁剪窗口
- **`src/system/`** — 全局系统模块
  - `GameLoop.tsx` — 单主循环（100ms），通过时间累加器驱动火堆冷却、建造者状态机、收入系统、人口增长定时器。`dt = 100ms × speed`，倍速加速
  - `gameSpeed.ts` — 游戏倍速模块（1×/2×/3×/5×），`localStorage` 持久化，`getSpeed()`/`setSpeed()`/`useSpeed()`，订阅通知。同步 CSS 变量 `--game-cooldown-step` 供进度条动画
- **`src/i18n/`** — i18next 国际化（`zh.json`/`en.json`），默认中文，`LanguageDetector` 自动匹配浏览器语言；`index.ts` 初始化 i18next + react-i18next
- **`src/components/`** — 通用 UI 组件
  - `Button.tsx` — 通用操作按钮：冷却由 `state.cooldown[id]` 驱动，倒空式进度条（CSS transition），hover 时弹出成本浮层（资源│数量）。样式提取到 `Button.module.css`
  - `CollapsibleSection.tsx` — 可折叠区块（▶/▼ 箭头，默认折叠）
  - `ErrorBoundary.tsx` — 顶层错误边界类组件，捕获渲染异常显示错误信息+重载按钮
  - `Header.tsx` — 场景标签导航（features 驱动显隐 + currentRoom 高亮，对象映射路由）
  - `NarrativePanel.tsx` — 左栏叙事区：顶部状态条 + 双区固定 grid（手动叙事 / 资源变化），各区独立滚动 + 旧条目渐隐。delta 由 `formatDelta()` 用 i18n 模板渲染，样式提纯到 `NarrativePanel.module.css`
  - `NarrativeSection.tsx` — 叙事区块通用组件，消除手动/资源变化叙事之间的重复代码，支持标题+条目列表+占位符
  - `StoresPanel.tsx` — 右栏人口独立行 + 三块 CollapsibleSection（建筑物/库存/武器），库存二级分类折叠，趋势显示滑动窗口标注 `/ 10t`，分类从 `RESOURCES` 自动生成
  - `Toolbar.tsx` — 右下角工具栏：1×/2×/3×/5× 速度切换、A⁻/A⁺ 字体缩放、🌙/☀️ 主题切换，均 `localStorage` 持久化
  - `WorkersPanel.tsx` — 工人分配面板：grid-cols-2 扁平布局（左列职业名+人数，右列 -1/-10/+1/+10 文字按钮均匀分布）；hover 时 tooltip 显示该职业实际资源产出/消耗（rate × 工人数）；gatherer 行只读无按钮。样式提取到 `WorkersPanel.module.css`
- **`src/rooms/`** — 场景组件
  - `Room.tsx` — 暗室场景（火堆操作单独一行 + 建造 flex-col 分栏，`computeButtonState()` 统一可访问性，cost 由 Button 自动渲染）
  - `Outside.tsx` — 野外场景（grid-cols-2 布局：左列伐木+检查陷阱按钮竖排，右列 WorkersPanel；检查陷阱根据 traps+baitedCount 计算掉落次数，按 `TRAP_DROPS` 累积概率表随机掉落+消耗诱饵+冷却+叙事推送）
  - `craftables/` — 制造系统（纯数据配置，零组件改动可扩展）
    - `types.ts` — `CraftableDef` 接口 + `UnlockCondition`（可组合条件：builderLevel / building / minResources / seenAllOf）
    - `effects.ts` — 预制副作用模板：`Effects.income()` / `Effects.unlockFeature()` / `Effects.initWorkers()` / `Effects.chain()`
    - `buildings.ts` — 10 栋建筑（trap→armoury）。trap 无收入（检查按钮产出），lodge 注册 hunter+trapper 双收入并初始化工人槽位，其余建筑 per-worker 收入 + chain initWorkers
    - `unlock.ts` — `evaluateUnlock()` 纯函数，`'hidden' | 'locked' | 'available'` 三态，已建造过不再隐藏
    - `buttonState.ts` — `computeButtonState()` 统一 hidden/disabled 判断
    - `index.ts` — 合并导出 + `buildCraftable(id)` action creator（扣资源 + 增建筑 + 跑 onBuild）
    - `__tests__/craftables.test.ts` — 解锁评估 + 建造 action 单元测试（11 条）
- **`src/App.tsx`** — 根组件，三栏布局 `grid-cols-[1fr_2fr_1fr]`（NarrativePanel | SCENES 场景路由 | StoresPanel）+ `<ErrorBoundary>` + `<GameLoop/>` + `<Toolbar/>`
- **`src/index.css`** — `@import "tailwindcss"` + `@import "./styles/tokens.css"` + 动画关键帧（`roomFlicker`/`notifFadeIn`/`narrSlideIn`）+ 滚动条隐藏（aside 默认无滚动条，hover 时显示）+ `html { font-size: var(--game-font-size) }`
- **`src/styles/tokens.css`** — CSS 设计 Token（`var(--game-*)`），浅色/暗色主题通过 `[data-theme="dark"]` 切换，含 `--game-font-size`/`--game-cooldown-step`

## Conventions

- **枚举风格**：`const X = { ... } as const` + `type X = (typeof X)[keyof typeof X]`（兼容 `erasableSyntaxOnly`）
- **状态更新**：Immer draft-recipe 模式 — reducer 内直接修改 draft，`useImmerReducer` 自动生成不可变副本；仅 `LOAD_SAVE` 用 `return` 替换整个 state
- **资源变更**：统一走 `modifyResource(draft, key, delta)` → 累加到 `_pendingDeltas` → `INCOME_TICK` 时 flush。带 source 的变更归并到 `_pendingSources`（同 source 合并），flush 为 delta 叙事条目
- **per-worker 收入**：`INCOME_TICK` 中 income stores 为 per-worker 速率，实际 delta = baseRate × workerCount（gatherer=剩余人口，其他=`workers[key]`，非 worker 收入固定 ×1）
- **人口增长**：GameLoop 中 popTimer 随机 30~180 秒调度，hut > 0 时触发 `INCREASE_POPULATION`（增量基于剩余空间随机），分级推送叙事。人口上限 = huts × HUT_ROOM
- **冷却模式**：`START_COOLDOWN(id, seconds, reward?)` action → `draft.cooldown[id]` + `draft.pendingRewards[id]`；`INCOME_TICK` 每股 tick 递减 cooldown，归零时自动发放 reward → `modifyResource`。Button 组件纯读 `state.cooldown[id]`，无本地定时器
- **叙事**：手动叙事通过 `dispatch(pushNarrative(t('key')))` → `draft.narrativeLog`。资源变化叙事通过 `modifyResource(..., source)` → `_pendingSources` → `INCOME_TICK` flush → `draft.deltaLog`。两数组独立裁剪（上限 `CONFIG.NARRATIVE_LOG_MAX`），最新在上，CSS 渐进淡出
- **场景路由**：`const SCENES: Partial<Record<RoomName, ComponentType>>` 对象映射，条件表达式 `{Scene && <Scene />}`
- **函数式风格**：纯函数 + discriminated union action；`APPLY_RECIPE` 草稿回调用于一次性操作
- **CSS**：Tailwind 原子化 + `tokens.css` 设计 Token（`var(--game-*)`）+ CSS Modules 组件级样式 + `index.css` 动画关键帧。`html { font-size: var(--game-font-size) }` 作为 rem 基准
- **主题**：浅色默认，`[data-theme="dark"]` 暗色，偏好存 `localStorage` key `adr-theme`
- **速度**：`localStorage` key `adr-speed`，`--game-cooldown-step` CSS 变量同步更新
- **字体**：`localStorage` key `adr-font-size`，`--game-font-size` CSS 变量驱动，步长 1px，范围 12-24px
- **错误边界**：`ErrorBoundary` 类组件包裹 GameProvider，捕获渲染异常显示错误信息+重载，防白屏
- **数据驱动**：资源和制造物均走纯数据配置 — `RESOURCES` 注册表（新增资源加一行 → 类型/初始值/UI 分类自动生效）、`WORKER_INCOME`（新增职业收入加一条）、`CRAFTABLES` 配置表（新增建筑/武器加一条 → Room UI 自动渲染）。`evaluateUnlock()` 声明式解锁条件评估
- **导入**：`verbatimModuleSyntax`，显式 `type` 导入
- **严格模式**：`noUnusedLocals` / `noUnusedParameters` / `noFallthroughCasesInSwitch` / `erasableSyntaxOnly`（tsconfig 全部开启）
- **测试**：Vitest（`globals: true`，`include: ['src/**/*.test.ts']`，配置在 `vite.config.ts`），共 44 条（state 33 + craftables 11）
- **Lint**：ESLint flat config（`eslint.config.js`），插件 `typescript-eslint` + `react-hooks` + `react-refresh`

## Notes

- `.reasonix/` — agent 本地状态，git-ignored，可再生
- `.codegraph/` — Codegraph 缓存索引，git-ignored，可再生
- `public/` — 静态资源（`favicon.svg`、`icons.svg`），不经构建处理直接复制
- Vite `base: './'` — 构建产物使用相对路径，支持任意目录静态部署
- `pnpm-workspace.yaml` — `allowBuilds: { esbuild: true }`，允许为 esbuild 原生依赖启用构建
- `src/assets/` — 资产预留目录（当前为空）
