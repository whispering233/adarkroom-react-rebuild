---
name: A Dark Room
description: 基于文字生存冒险游戏的黑白极简风设计系统
colors:
  primary: "#000000"
  secondary: "#333333"
  accent: "#000000"
  neutral: "#ffffff"
  surface: "#f5f5f5"
  on-surface: "#333333"
  border: "rgba(0,0,0,0.1)"
  dark-primary: "#e0e0e0"
  dark-secondary: "#c8c8c8"
  dark-surface: "#0d0d1a"
  dark-bg: "#1a1a2e"
  dark-accent: "#e0e0e0"
  dark-border: "rgba(255,255,255,0.15)"
typography:
  body-mono:
    fontFamily: "'Courier New', Courier, monospace"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  label-sm:
    fontFamily: "'Courier New', Courier, monospace"
    fontSize: 12px
    fontWeight: 600
    letterSpacing: 0.15em
  label-xs:
    fontFamily: "'Courier New', Courier, monospace"
    fontSize: 11px
    fontWeight: 400
    letterSpacing: 0.1em
    lineHeight: 1.6
rounded:
  sm: 4px
  md: 8px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  panel-padding: 16px
  panel-gap: 12px
components:
  button:
    backgroundColor: "rgba(0,0,0,0.05)"
    textColor: "#000000"
    borderColor: "rgba(0,0,0,0.25)"
    rounded: "{rounded.sm}"
    padding: "8px 20px"
    minWidth: 11rem
    fontFamily: "{typography.body-mono.fontFamily}"
  button-hover:
    backgroundColor: "rgba(0,0,0,0.1)"
  button-disabled:
    opacity: 0.4
  header-tab:
    textColor: "#333333"
    borderColor: "transparent"
    fontWeight: 400
    padding: "12px 16px"
  header-tab-active:
    textColor: "#000000"
    borderColor: "#000000"
    fontWeight: 700
  event-overlay:
    backgroundColor: "#ffffff"
    borderColor: "rgba(0,0,0,0.1)"
    rounded: "{rounded.md}"
    maxWidth: 32rem
  tooltip:
    backgroundColor: "#ffffff"
    borderColor: "rgba(0,0,0,0.1)"
    rounded: "{rounded.sm}"
    textColor: "#333333"
  world-tile:
    fontFamily: "monospace"
    fontSize: 12px
---

## 概述

本设计系统服务于 **A Dark Room**，一款基于 React + TypeScript 重构的文字生存冒险游戏。其美学定义为**黑白极简风**。

UI 的每一部分均采用黑白灰度调色板。不使用彩色进行强调。而是通过字重（标签 600，活跃元素和标题 700）和下划线装饰来传达层次结构。这一约束保留了文字冒险的沉浸感，让玩家专注于叙事。

等宽字体（Courier New）强化了复古终端的感觉。布局边框仅用于按钮和弹窗面板，绝不用于布局分割。暗色主题切换到深海军蓝背景（`#1a1a2e`），同时保持相同的排版和间距体系。

**核心原则：**
- 仅使用黑白灰色调
- 通过字重和下划线强调，绝不使用彩色
- 所有文字使用 Courier New 等宽字体
- 边框仅用于交互元素，绝不用于布局
- 暗色主题采用深海军蓝背景

## 色彩

调色板刻意限定为黑、白和灰色。UI 强调通过字重（600/700）或下划线传达。

### 浅色主题

| 令牌 | 值 | 用途 |
|-------|-------|-------|
| `--game-bg-primary` | `#ffffff` | 页面和面板背景 |
| `--game-bg-header` | `#f5f5f5` | 顶栏背景 |
| `--game-bg-panel` | `rgba(0,0,0,0.03)` | 面板微色调 |
| `--game-text-primary` | `#000000` | 标题、名称、主要标签 |
| `--game-text-body` | `#333333` | 正文、描述 |
| `--game-text-muted` | `#333333` | 弱化/次要文本 |
| `--game-accent` | `#000000` | 数据值、计数、强调 |
| `--game-btn-text` | `#000000` | 按钮标签文本 |
| `--game-btn-bg` | `rgba(0,0,0,0.05)` | 按钮背景 |
| `--game-btn-border` | `rgba(0,0,0,0.25)` | 按钮边框 |
| `--game-btn-hover-bg` | `rgba(0,0,0,0.1)` | 按钮悬停填充 |
| `--game-border` | `rgba(0,0,0,0.1)` | 弹窗和提示框边框 |

### 暗色主题

| 令牌 | 值 | 用途 |
|-------|-------|-------|
| `--game-bg-primary` | `#1a1a2e` | 页面和面板背景 |
| `--game-bg-header` | `#0d0d1a` | 顶栏背景（更深层） |
| `--game-bg-panel` | `rgba(0,0,0,0.3)` | 面板微色调 |
| `--game-text-primary` | `#e0e0e0` | 标题、名称、主要标签 |
| `--game-text-body` | `#c8c8c8` | 正文、描述 |
| `--game-text-muted` | `#666666` | 弱化/次要文本 |
| `--game-accent` | `#e0e0e0` | 数据值、计数、强调 |
| `--game-btn-text` | `#e0e0e0` | 按钮标签文本 |
| `--game-btn-bg` | `rgba(255,255,255,0.08)` | 按钮背景 |
| `--game-btn-border` | `rgba(255,255,255,0.25)` | 按钮边框 |
| `--game-btn-hover-bg` | `rgba(255,255,255,0.12)` | 按钮悬停填充 |
| `--game-border` | `rgba(255,255,255,0.15)` | 弹窗和提示框边框 |

## 排版

排版系统仅使用等宽字体。所有文本使用同一字族，分为三个字号层级。

### 字族

```
font-family: 'Courier New', Courier, monospace;
```

### 字号层级

| 层级 | 字号 | 字重 | 字距 | 行高 | 用途 |
|-------|------|--------|----------|-------------|-------|
| body | 16px | 400 | 默认 | 1.6 | 所有正文、按钮、面板 |
| label-sm | 12px | 600 | 0.15em | 1.25 | 区块标题、大写标签 |
| label-xs | 11px | 400 | 0.1em | 1.6 | 叙事条目、提示框 |
| map-tile | 12px | 400 | 默认 | 1.2em | 世界地图字符 |
| button | 14px | 400 | 默认 | 1.25 | 按钮标签 |

### 字距层级

| 层级 | 值 | 用途 |
|-------|-------|-------|
| 宽松（`--game-tracking-wide`） | `0.3em` | 大写面板标题 |
| 标准（`--game-tracking`） | `0.15em` | `label-sm` 区块标题 |
| 紧凑（`--game-tracking-tight`） | `0.1em` | `label-xs` 叙事文本、事件标题 |

### 强调方式

- **粗体（600）**：区块标题、行标签、弱化数据标签
- **粗体（700）**：活跃顶栏标签、事件弹窗标题、建筑数量
- 下划线：当前 UI 中未使用（保留用于未来的链接式交互）

## 布局

### 栅格结构

根布局为三栏栅格，定义在 `App.tsx` 中：

```
grid-cols-[1fr_3fr_1.5fr]
```

| 列 | 占比 | 内容 |
|--------|----------|---------|
| 左栏 | 1fr | 叙事面板（故事文本、状态、资源变更日志） |
| 中栏 | 3fr | 顶栏标签 + 场景内容（交互操作） |
| 右栏 | 1.5fr | 数据面板（建筑、库存、武器） |

### 内容宽度

整个布局包裹在一个容器中，设置 `max-width: 75%`（`--game-content-max-width`），水平居中。

### 间距

所有间距值源于 CSS 自定义属性：

| 令牌 | 值 | 用途 |
|-------|-------|-------|
| `--game-panel-padding` | `1rem`（16px） | 侧栏内边距 |
| `--game-panel-gap` | `0.75rem`（12px） | 面板区域间距 |
| `xs` | 4px | 按钮进度条、小间隙 |
| `sm` | 8px | 元素分组、表单间距 |
| `md` | 16px | 区块间距、面板内边距 |
| `lg` | 24px | 大区块分割 |
| `xl` | 32px | 页面级外边距 |

### 顶栏

- 高度：`41px`（`--game-header-h`）
- 由场景导航标签组成（暗室、野外、小径、世界等）
- 标签底部有下边框作为激活指示

### 按钮尺寸

- 最小宽度：`11rem`（`--game-btn-min-width`）
- 内边距：`0.5rem 1.25rem`（8px 20px）
- 全宽变体：事件弹窗按钮使用 `w-full`

## 层级与深度

设计刻意扁平。表面和卡片上不使用阴影。

### 交互反馈

| 元素 | 反馈效果 |
|---------|----------|
| 按钮按下 | `:active` 时 `transform: scale(0.95)` |
| 按钮悬停 | 背景从 `--game-btn-bg` 变为 `--game-btn-hover-bg` |
| 标签悬停 | 无变换；仅颜色过渡 |
| 可点击地图格 | `cursor: pointer` |

### 弹窗层级

事件弹窗是唯一具有视觉深度的元素。它使用：

```
box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4)
```

在半透明遮罩（`rgba(0, 0, 0, 0.4)`）之上营造浮动弹窗效果。

### 暗色主题色层

暗色模式中，通过色层暗示深度：

- 页面背景：`#1a1a2e`
- 顶栏背景：`#0d0d1a`（更深、后退感）
- 事件弹窗：`#1a1a2e`（与页面同色，通过边框区分）

### 过渡动画

- 交互元素：`0.15s ease`（按钮、标签、悬停效果）
- 血条填充：`0.3s ease`
- 叙事文本透明度：`1s`

## 形状

| 元素 | 圆角 | 令牌 |
|---------|--------|-------|
| 按钮 | 4px（0.25rem） | `{rounded.sm}` |
| 事件弹窗、面板 | 8px（0.5rem） | `{rounded.md}` |
| 提示框 | 4px（0.25rem） | `{rounded.sm}` |
| 血条 | 4px | - |
| 历史遗留小型操作按钮 | 3px | - |

任何地方都不使用圆 pill 形状。

小型操作按钮（工人面板 +/- 按钮、小径物品 +/- 按钮）使用 `border-radius: 3px`。这是历史遗留。新按钮标准为 4px。

## 组件

### Button

**文件：** `src/components/Button.tsx` + `Button.module.css`

通用游戏操作按钮。所有游戏交互操作必须使用此组件，而非内联样式的 `<button>` 元素。

- 固定最小宽度 `11rem`（`--game-btn-min-width`）
- 左对齐标签，右对齐数量显示
- 冷却进度条：从 `--game-btn-hover-bg` 填充，通过 CSS 过渡从左向右收缩
- 悬停成本提示：结构化列表显示资源名称 | 数量
- 禁用状态：`opacity: 0.4`，`cursor: not-allowed`
- 悬停：背景从 `--game-btn-bg` 过渡到 `--game-btn-hover-bg`
- 按下：`transform: scale(0.95)`
- 过渡：`all 0.15s ease`

### Header Tab

**文件：** `src/components/Header.tsx` + `Header.module.css`

中栏顶部的场景导航标签。

- 活跃标签：`color: var(--game-text-primary)`，`font-weight: 700`，`border-bottom: 2px solid`，`opacity: 1`
- 非活跃标签：`color: var(--game-text-body)`，`border-color: transparent`，`opacity: 0.45`
- 内边距：`12px 16px`
- 字体：等宽，`0.875rem`（14px）

### Event Overlay

**文件：** `src/components/EventOverlay.tsx` + `EventOverlay.module.css`

随机事件和遭遇的弹窗覆盖层。

- 固定定位，顶部偏移 `15vh`
- 半透明遮罩（`rgba(0, 0, 0, 0.4)`）
- 白色面板，`max-width: 32rem`
- `border-radius: 8px`（`{rounded.md}`）
- `box-shadow: 0 10px 40px rgba(0,0,0,0.4)`
- 淡入动画：`eventFadeIn 0.2s ease-out`（透明度 0 到 1，translateY -16px 到 0）
- 标题：`font-weight: 700`，`letter-spacing: var(--game-tracking-tight)`
- 正文：`0.875rem`，`line-height: 1.5`
- 操作按钮垂直堆叠，全宽

### Combat Overlay

**文件：** `src/combat/CombatOverlay.tsx` + `CombatOverlay.module.css`

战斗 UI，渲染在事件弹窗面板内。

- 双列战斗者展示（玩家 vs 敌人）
- 血条：`8px` 高度，`--game-accent` 填充色，`0.3s` 宽度过渡
- 武器网格：`grid-template-columns: 1fr 1fr`，小型操作按钮
- 伤害漂浮动画：`dmgFloat 0.7s ease-out`（向上淡出，translateY -24px）
- 治疗行：两个并排按钮
- 逃跑按钮：全宽，弱化文本颜色

### Workers Panel

**文件：** `src/components/WorkersPanel.tsx` + `WorkersPanel.module.css`

工人分配面板，渲染在野外场景中。

- 2 列网格布局：左侧 = 职业名称 + 数量，右侧 = 操作按钮
- 操作按钮：`+1`、`+10`、`-1`、`-10` 模式
- 小型紧凑按钮：`padding: 0.1rem 0.4rem`，`font-size: 0.65rem`
- 悬停资源提示：绝对定位覆盖层，显示每人收入速率
- 禁用按钮：`opacity: 0.35`

### Narrative Entry

**文件：** `src/components/NarrativeSection.tsx`

左栏中的单条叙事文本条目。

- 字体：`0.7rem`（11.2px），`line-height: 1.6`
- 透明度过渡：老条目渐隐至 0.5 的过程为 `1s`
- 最新条目：滑入动画（`narrSlideIn 0.4s ease-out`）
- 基于索引的透明度衰减：`max(1 - index * 0.08, 0.5)`

### World Map Tile

**文件：** `src/world/WorldCanvasScene.ts`（独立 Canvas 渲染模块）+ `src/world/renderViewport.ts`（纯数据变换 + Canvas 渲染 + TILE_CONFIG）

世界场景（`src/rooms/World.tsx`）挂载 WorldCanvasScene 进行 Canvas 渲染，每帧 clearRect 重新绘制。

- **视口**：31×31（VIEWPORT_RADIUS=15），以玩家位置为中心，vx/vy 视口坐标 0..30
- **渲染管道**：World.tsx 中的 draw 回调（约 5 行）→ renderViewport（纯函数，零 DOM/Canvas 依赖）→ TileDescriptor[] → renderTiles（Canvas fillText，零分支绘制循环）
- **数据驱动**：通过 TileRole（`'boundary'|'player'|'landmark'|'terrain'`）声明字符角色，TILE_CONFIG 单源映射角色 → font + CSS 变量名，renderTiles 运行时通过 `getComputedStyle` 读取 CSS 变量实现主题自适应
- **字符规则**：
  - 边界墙：`|`（超出地图范围，`--game-text-muted`）
  - 玩家：`@`（`--game-text-primary`）
  - 地标：对应字符（村庄 `A`、铁矿 `I`、煤矿 `C`、硫矿 `S` 等，`--game-accent`，bold 12px）
  - 普通地形：`.`（`--game-terrain`，所有已探索格）
- **查找表**：`terrainCharMap` / `landmarkCharMap` 预构建在模块加载时，renderViewport 每帧 O(1) 查表
- **Canvas 驱动**：WorldCanvasScene 使用 SceneState 对象模式 + rAF 循环 + 自检门禁（`state !== st` 防止陈旧回调泄漏）+ mount/unmount 生命周期
- **Cell 尺寸**：固定计算 `Math.max(6, floor(min(w,h) / 31))`，DPR 缩放（`canvas.width = logicalSize * dpr`），不支持动态 cellSize 切换
- **自适应**：ResizeObserver 监听容器尺寸变化自动重算 cellSize 并重绘；MutationObserver 监听 `data-theme` 属性变化自动重绘
- **CSS 令牌**：`--game-terrain: rgba(0,0,0,0.15)`（浅色） / `rgba(255,255,255,0.08)`（暗色）

## 注意事项

- ✅ 所有游戏操作应使用共享的 `Button` 组件，不要用 Tailwind 内联按钮样式
- ✅ 颜色、字体、间距应引用 `var(--game-*)` CSS 令牌，不要硬编码值
- ✅ 组件级样式应使用 CSS Modules（`.module.css`），不要对隔离组件使用全局类名
- ✅ 保持单色调色板，不要为 UI 元素添加彩色高亮
- ✅ 使用字重（600/700）或下划线进行强调，不要添加彩色高亮
- ❌ 不要重复小型按钮样式（如工人面板、世界 HUD、小径中的 +/- 按钮），应提取共享令牌
- ❌ 不要混用圆角值——按钮 4px、弹窗 8px、小型操作按钮 3px（历史遗留）
- ❌ 不要混用过渡时长——交互元素统一 `0.15s ease`
- ❌ 不要使用边框进行布局分割——仅按钮和弹窗使用边框
- ❌ 不要直接使用 Tailwind 颜色类（如 `text-gray-500`），始终使用 `text-(--game-*)`
- ❌ 不要添加未在 `index.css` 注册关键帧的新 CSS 动画
