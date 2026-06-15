# A Dark Room — React Rebuild

基于 [doublespeakgames/adarkroom](https://github.com/doublespeakgames/adarkroom) 的 React + TypeScript 渐进式重构 **练习学习项目**。

## Project

- 技术栈：pnpm / React 19 / TypeScript ~6.0 / Vite 8 / Tailwind CSS v4 / CSS Modules / Vitest / Immer / i18next
- 入口：`index.html` → `src/main.tsx` → i18n init → `<GameProvider><App /></GameProvider>`
- 项目文档在 `doc/`：架构分析、分阶段重构方案、TODO checklist
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

当前已实现（阶段 1-3）：

- **`src/state/`** — 全局状态管理层，替代原项目 `$SM` + `State`
  - `types.ts` — 类型定义 + const-object 枚举（`FireLevel`/`TempLevel`/`RoomName`）+ `INITIAL_STATE`
  - `reducer.ts` — Immer draft-recipe reducer（`gameReducer(draft, action) => void`），由 `useImmerReducer` 驱动；action 含语义 action（`LIGHT_FIRE` 等）和通用 `APPLY_RECIPE` 草稿回调
  - `GameContext.tsx` — React Context + `<GameProvider>`（接受可选 `initialState`）
  - `hooks.ts` — `useGameContext` / `useGameState` / `useGameDispatch` 三个 hook
  - `index.ts` — barrel export
  - `state.test.ts` — Vitest 单元测试
- **`src/i18n/`** — i18next 国际化（`zh.json`/`en.json`），默认中文，`LanguageDetector` 自动匹配浏览器语言
- **`src/components/Button.tsx`** — 通用操作按钮（冷却倒计时、进度条、消耗检查）
- **`src/components/Header.tsx`** — 场景标签导航（features 驱动显隐 + currentRoom 高亮）
- **`src/components/StoresPanel.tsx`** — 资源实时显示面板（右栏）
- **`src/components/NarrativePanel.tsx`** — 剧情文本区（左栏），i18n 查表渲染火堆/温度/建造者叙事
- **`src/components/Toolbar.tsx`** — 右下角工具栏（浅色/暗色主题切换，持久化到 localStorage）
- **`src/rooms/Room.tsx`** — 暗室场景（火堆交互、建造者 NPC、收入系统）
- **`src/App.tsx`** — 根组件，三栏布局（NarrativePanel | 场景路由 | StoresPanel）+ Toolbar
- **`src/index.css`** — `@import "tailwindcss"` + `@import "./styles/tokens.css"` + 动画关键帧
- **`src/styles/tokens.css`** — CSS 设计 Token（`var(--game-*)`），浅色/暗色主题通过 `[data-theme="dark"]` 切换

## Conventions

- **枚举风格**：`const X = { ... } as const` + `type X = (typeof X)[keyof typeof X]`（兼容 `erasableSyntaxOnly`）
- **状态更新**：Immer draft-recipe 模式 — reducer 内直接修改 draft，`useImmerReducer` 自动生成不可变副本；仅 `LOAD_SAVE` 用 `return` 替换整个 state
- **函数式风格**：纯函数 + discriminated union action；`APPLY_RECIPE` 草稿回调用于一次性操作
- **CSS**：Tailwind 原子化 + `tokens.css` 设计 Token（`var(--game-*)`）+ CSS Modules 组件级样式 + `index.css` 动画关键帧
- **主题**：浅色默认，`[data-theme="dark"]` 暗色，偏好存 `localStorage` key `adr-theme`
- **i18n**：`useTranslation()` + `t('namespace.key')` 查表，fallback `zh`
- **导入**：`verbatimModuleSyntax`，显式 `type` 导入
- **严格模式**：`noUnusedLocals` / `noUnusedParameters` / `noFallthroughCasesInSwitch` / `erasableSyntaxOnly`（tsconfig 全部开启）
- **测试**：Vitest（`globals: true`，`include: ['src/**/*.test.ts']`，配置在 `vite.config.ts`）
- **Lint**：ESLint flat config（`eslint.config.js`），插件 `typescript-eslint` + `react-hooks` + `react-refresh`

## Notes

- `.reasonix/` — agent 本地状态，git-ignored，可再生
- `.codegraph/` — Codegraph 缓存索引，git-ignored，可再生
- `public/` — 静态资源（`favicon.svg`、`icons.svg`），不经构建处理直接复制
- Vite `base: './'` — 构建产物使用相对路径，支持任意目录静态部署
