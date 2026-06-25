# A Dark Room — React Rebuild

基于 [doublespeakgames/adarkroom](https://github.com/doublespeakgames/adarkroom) 的 React + TypeScript 渐进式重构练习项目。

## Commands

| 命令 | 作用 |
|------|------|
| `pnpm install` | 安装依赖（需要 pnpm） |
| `pnpm dev` | Vite 开发服务器 |
| `pnpm build` | `tsc -b && vite build`（必须通过类型检查才能构建） |
| `pnpm preview` | 预览构建产物 |
| `pnpm test` | `vitest run` |
| `pnpm test:watch` | `vitest` watch 模式 |
| `pnpm lint` | `eslint .` |

运行单文件测试：`npx vitest run path/to/file.test.ts`

## Architecture

- 入口链：`index.html` → `src/main.tsx` → i18n init → `<ErrorBoundary><GameProvider><App /></GameProvider></ErrorBoundary>`
- **GameProvider 初始化优先级**：`initialState` prop > localStorage 存档 > `INITIAL_STATE`，存档加载时做 shape merge 填充新增字段
- **状态管理**：`useImmerReducer`（来自 `use-immer` 包，非原生 `useReducer`）。Reducer 内直接修改 draft，Immer 自动生成不可变副本。唯一例外：`LOAD_SAVE` 用 `return` 替换整个 state
- **资源变更**：**绝对不要**直接修改 `draft.stores[key]`。必须走 `modifyResource(draft, key, delta)`，它在内部累加到 `_pendingDeltas`，由 `INCOME_TICK` 统一 flush
- **场景路由**：`App.tsx` 中的 `SCENES` 对象映射（`Partial<Record<RoomName, ComponentType>>`），新增场景在此注册即可。World 不在导航标签中，仅通过小径→出发进入；进入 World 时 Header 隐藏，替换为 WorldInfo 栏
- **数据驱动**：新增资源/建筑/职业只需在 `config.ts` 加一行配置，UI 自动渲染。`evaluateUnlock()` 声明式解锁条件评估
- **冷却系统**：所有按钮冷却由 `state.cooldown[id]` 驱动，无组件级定时器。`START_COOLDOWN` → `INCOME_TICK` 递减 → 归零时自动发放 reward
- **CSS 三层架构**：Tailwind v4（`@import "tailwindcss"` 指令，非旧版 `@tailwind` 指令）+ `tokens.css`（设计 Token `var(--game-*)`）+ CSS Modules（`.module.css` 组件级隔离）
- **DESIGN.md**: 项目根目录 DESIGN.md 文件记录了完整的 UI 设计规范，所有 UI 开发前应先阅读
- **Tailwind v4 插件**：使用 `@tailwindcss/vite` Vite 插件，无需 PostCSS 配置
- **原始项目参考**：`origin-adarkroom/`（只读，git-ignored）；架构分析在 `doc/原始ADarkRoom架构分析.md`
- **世界地图渲染**：WorldCanvasScene 作为独立模块（零 React 依赖，rAF 循环）。renderViewport 为纯函数（注入 StyleResolver，零 DOM 访问），返回 { entityCommands, terrainCells, boundaryCells, playerCell, occupiedSet }。drawComposed 按 (font, fillStyle) 分组批量绘制。Entity 通过 getDrawCommand() 统一返回多格图案数据。
- **世界实体系统**：14 个 factory-based 实体已合并为 `landmarks.ts`，village.ts 保持独立 3×3 自定义实现。WorldEntity 实现 getDrawCommand() 纯函数 + 可选 onEnter() 触发。Entity 仅表达视觉意图（prominent / bold），不碰 CSS 变量——映射由 StyleResolver 全局处理。地图数据为 terrainMap（TerrainType[][]）+ entityLayer（PlacedEntity[]）分离存储。entityCellMap（"x,y" 键）提供 O(1) 空间查询。
- **右栏条件切换**：当 `currentRoom === 'world'` 时，右栏渲染 WorldHUD（状态/装备/治疗）代替 StoresPanel

## Key module map

| 目录 | 职责 |
|------|------|
| `src/state/` | 全局状态：types + Immer reducer + Context + hooks |
| `src/config.ts` | 游戏数值配置：RESOURCES、WORKER_INCOME、TRAP_DROPS、背包常量 |
| `src/system/` | GameLoop（100ms 主循环）+ gameSpeed（倍速控制） |
| `src/system/audioEngine.ts` | Web Audio API 音频引擎 |
| `src/system/scoring.ts` | 计分 + Prestige 声望系统 |
| `src/components/` | 通用 UI 组件（Button、Header、NarrativePanel、StoresPanel 等） |
| `src/rooms/` | 场景组件 + `craftables/` 制造系统（纯数据配置） |
| `src/rooms/Ship.tsx` | Ship 场景（hull/thrusters 升级、lift-off 进入 Space） |
| `src/rooms/Space.tsx` | Space 场景（Canvas 太空飞行 mini-game） |
| `src/rooms/Fabricator.tsx` | Fabricator 场景（alien alloy 制造高级装备） |
| `src/rooms/craftables/trades.ts` | 交易品配置（13 种资源兑换） |
| `src/events/` | 随机事件系统（调度器 + 注册表 + 场景数据） |
| `src/combat/` | 战斗系统（事件驱动，CombatOverlay 自包含） |
| `src/components/WorldHUD.tsx` | World HUD 面板（状态/装备/治疗，World 场景右栏） |
| `src/components/WorldInfo.tsx` | World 信息栏（地图名称、天气，World 场景顶部） |
| `src/i18n/` | i18next 国际化（`zh.json`/`en.json`，默认中文） |
| `src/world/` | 世界地图生成 + 实体系统 + Canvas 渲染管道（generator / entity/ / renderViewport / StyleResolver） |
| `src/world/entity/` | entity definitions: landmarks.ts (14 factory-based), village.ts (custom 3×3 box), factory.ts + types.ts + catalog.ts + testHelpers.ts; parametrized test coverage |
| `src/world/styleResolver.ts` | 全局样式映射（EntityCellOutput → fillStyle + font） |

## Critical gotchas

### `RUN_MODE` — 资源初始化陷阱

`src/config.ts` 中 `CONFIG.RUN_MODE` 默认为 `'normal'`。若切换为 `'debug'`，`getInitialStores()` 会返回所有资源为 `MAX_STORE`（而非 `def.initial`）。这意味着：

- **debug 模式下 `expect(state.stores.wood).toBe(0)` 会失败**（得到 `MAX_STORE`）
- 如需正常模式测试但 project 当前为 debug，改为 `'normal'` 或测试中显式覆盖 stores

### `verbatimModuleSyntax` — 必须用 `import type`

所有仅作类型使用的导入必须显式写 `import type { ... }`。`import { type Foo }` 内联语法也可工作。忘记写 `type` 会导致编译错误。

### `erasableSyntaxOnly` — 禁止 `enum`/`namespace`

不能用 TypeScript `enum` 关键字。枚举模式为：
```ts
const X = { A: 'a', B: 'b' } as const
type X = (typeof X)[keyof typeof X]
```

### `noUnusedLocals` / `noUnusedParameters` — 未使用导入/参数导致构建失败

`tsconfig.app.json` 中 `noUnusedLocals` 和 `noUnusedParameters` 均为 `true`。任何未使用的 import 或未使用的函数参数都会导致 `tsc -b` 失败，进而阻断整个 `pnpm build`（构建链为 `tsc -b && vite build`）。本地热更新（`pnpm dev`）不受影响，**但 CI 必炸**。

### `_globalTick` — 游戏规范时钟

`state._globalTick` 是游戏逻辑时钟，由 `INCOME_TICK` 每次递增。**不要**用 `Date.now()` 替代。App.tsx 的 auto-save `useEffect` 依赖它触发，StoresPanel 的趋势计算和 NarrativePanel/World 的叙事时间戳也以它为锚点。

### 状态更新必须通过 dispatch

组件中使用 `useGameDispatch()` 获取 dispatch，通过 action creator（`modifyResource`、`pushNarrative`、`assignWorker` 等从 `src/state` 导出）创建 action 再 dispatch。**不要在组件中直接操作 state 对象**。

### `index.css` 中的 Tailwind 导入语法

使用 `@import "tailwindcss"`（Tailwind v4 语法），**不是** `@tailwind base/components/utilities`。

### 战斗时强制 1× 速度

`gameSpeed.ts` 中 `forceSpeed(1)` 在战斗开始/结束时自动调用，组件不需要手动处理。

### Vite `base: './'`

构建产物使用相对路径，可直接部署到任意子目录。`public/` 中的资源引用也使用相对路径。

### World 场景访问

World 场景只能通过小径（Path）→ 出发（embark）进入，导航栏无 World 标签。从 World 返回通过村庄（village）地标实现，无直接返回按钮。

## Conventions

- **函数式风格**：纯函数 + discriminated union action；`APPLY_RECIPE` 用于一次性 draft 回调
- **叙事双日志**：手动叙事 (`narrativeLog`) + 资源变化叙事 (`deltaLog`)，两者独立裁剪（上限 `CONFIG.NARRATIVE_LOG_MAX`），最新条目在前
- **per-worker 收入**：`INCOME_TICK` 中 income stores 的 delta = `baseRate × workerCount`（gatherer 计为剩余人口，其他职业读取 `workers[key]`）
- **人口增长**：GameLoop 中 popTimer 随机 30~180s，上限 = `huts × HUT_ROOM`
- **localStorage key 前缀**：`adr-theme`（主题）、`adr-speed`（倍速）、`adr-font-size`（字体，范围 12-24px）
- **存档版本**：`INITIAL_STATE.version = 1.3`，跨版本迁移兼容性判断
- **测试**：Vitest `globals: true`，文件匹配 `src/**/*.test.{ts,tsx}`，配置在 `vite.config.ts` 的 `test` 字段，环境 `jsdom`
- **Lint**：ESLint flat config（`eslint.config.js`），插件 `typescript-eslint` + `react-hooks` + `react-refresh`

## ESM & Package

- `package.json` 中 `"type": "module"` — 项目为 ESM
- `pnpm-workspace.yaml` 中 `allowBuilds: { esbuild: true }` 是 esbuild 原生依赖构建所需
- 包管理器固定为 pnpm（通过 `pnpm-lock.yaml` 锁定）

## CI / Deploy

- **GitHub Pages**：push 到 `main` 分支时，`.github/workflows/deploy.yml` 自动 `pnpm build` 并部署到 GitHub Pages（`base: './'` 确保子路径可用）
- **Release**：推送 `v*` tag 时，`.github/workflows/release.yml` 从 `CHANGELOG.md` 解析对应版本段落创建 GitHub Release

## Release workflow

### Release steps (for AI agents)

1. Edit `CHANGELOG.md`: move content from `## [Unreleased]` to a new `## [vX.Y.Z] - YYYY-MM-DD` section
2. Update `version` in `package.json`
3. Stage, commit, tag, push:

```bash
git add CHANGELOG.md package.json
git commit -m "chore(release): bump version to vX.Y.Z"
git tag vX.Y.Z
git push origin main
git push origin vX.Y.Z
```

- Tag format: `v<semver>` (e.g. `v0.2.0`). Only `v*` tags trigger the release workflow.
- The release workflow runs on `ubuntu-latest`, requires `permissions: contents: write`.
- If CHANGELOG.md has no entry matching the tag, the action errors (safe fail, no empty release).
- GitHub auto-links `#NNN` references to issues/PRs in the Release body.

<!-- CODEGRAPH_START -->
## CodeGraph

In repositories indexed by CodeGraph (a `.codegraph/` directory exists at the repo root), reach for it BEFORE grep/find or reading files when you need to understand or locate code:

- **MCP tools** (when available): `codegraph_explore` answers most code questions in one call — the relevant symbols' verbatim source plus the call paths between them. `codegraph_node` returns one symbol's source + callers, or reads a whole file with line numbers. If the tools are listed but deferred, load them by name via tool search.
- **Shell** (always works): `codegraph explore "<symbol names or question>"` and `codegraph node <symbol-or-file>` print the same output.

If there is no `.codegraph/` directory, skip CodeGraph entirely — indexing is the user's decision.
<!-- CODEGRAPH_END -->


## Development Checklist

当前项目开发进度 checklist 位于 [`doc/dev-plan.md`](doc/dev-plan.md)。

实现顺序：
1. **Phase 1 — 现有系统扩展**：在已有架构上补配置/补数据/补逻辑，改动范围小
2. **Phase 2 — 需新建模块**：Ship、Space、Fabricator、Perk、Prestige/Scoring、音频系统

完整差距分析见 [`.omo/plans/gap-analysis-original-vs-rebuild.md`](.omo/plans/gap-analysis-original-vs-rebuild.md)。
