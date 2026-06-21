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
- **场景路由**：`App.tsx` 中的 `SCENES` 对象映射（`Partial<Record<RoomName, ComponentType>>`），新增场景在此注册即可
- **数据驱动**：新增资源/建筑/职业只需在 `config.ts` 加一行配置，UI 自动渲染。`evaluateUnlock()` 声明式解锁条件评估
- **冷却系统**：所有按钮冷却由 `state.cooldown[id]` 驱动，无组件级定时器。`START_COOLDOWN` → `INCOME_TICK` 递减 → 归零时自动发放 reward
- **CSS 三层架构**：Tailwind v4（`@import "tailwindcss"` 指令，非旧版 `@tailwind` 指令）+ `tokens.css`（设计 Token `var(--game-*)`）+ CSS Modules（`.module.css` 组件级隔离）
- **DESIGN.md**: 项目根目录 DESIGN.md 文件记录了完整的 UI 设计规范，所有 UI 开发前应先阅读
- **Tailwind v4 插件**：使用 `@tailwindcss/vite` Vite 插件，无需 PostCSS 配置
- **原始项目参考**：`origin-adarkroom/`（只读，git-ignored）；架构分析在 `doc/原始ADarkRoom架构分析.md`
- **世界地图渲染**：WorldCanvasScene 作为独立模块，零 React 依赖，使用 SceneState 对象模式 + rAF 循环 + mount/unmount 生命周期。renderViewport 返回 TileDescriptor[]（role + char），覆盖边界墙 `|`、玩家 `@`、地标字符、普通地形格 `.`，输出始终 31×31（VIEWPORT_RADIUS=15）。renderTiles 零分支纯函数根据 TileRole + TILE_CONFIG 数据驱动渲染到 Canvas。World.tsx 中 draw 回调约 5 行。
- **世界渲染数据驱动**：通过 TileRole（'boundary'|'player'|'landmark'|'terrain'）声明角色，TILE_CONFIG 映射角色 → font + CSS 变量名，renderTiles 运行时读取 CSS 变量实现主题自适应。addLandmark/terrainCharMap 查找表提高每帧性能。

## Key module map

| 目录 | 职责 |
|------|------|
| `src/state/` | 全局状态：types + Immer reducer + Context + hooks |
| `src/config.ts` | 游戏数值配置：RESOURCES、WORKER_INCOME、TRAP_DROPS、背包常量 |
| `src/system/` | GameLoop（100ms 主循环）+ gameSpeed（倍速控制） |
| `src/components/` | 通用 UI 组件（Button、Header、NarrativePanel、StoresPanel 等） |
| `src/rooms/` | 场景组件 + `craftables/` 制造系统（纯数据配置） |
| `src/events/` | 随机事件系统（调度器 + 注册表 + 场景数据） |
| `src/combat/` | 战斗系统（事件驱动，CombatOverlay 自包含） |
| `src/i18n/` | i18next 国际化（`zh.json`/`en.json`，默认中文） |
| `src/world/` | 世界地图生成 + Canvas 渲染管道（WorldCanvasScene / renderViewport / renderTiles） |

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

### 状态更新必须通过 dispatch

组件中使用 `useGameDispatch()` 获取 dispatch，通过 action creator（`modifyResource`、`pushNarrative`、`assignWorker` 等从 `src/state` 导出）创建 action 再 dispatch。**不要在组件中直接操作 state 对象**。

### `index.css` 中的 Tailwind 导入语法

使用 `@import "tailwindcss"`（Tailwind v4 语法），**不是** `@tailwind base/components/utilities`。

### 战斗时强制 1× 速度

`gameSpeed.ts` 中 `forceSpeed(1)` 在战斗开始/结束时自动调用，组件不需要手动处理。

### Vite `base: './'`

构建产物使用相对路径，可直接部署到任意子目录。`public/` 中的资源引用也使用相对路径。

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
