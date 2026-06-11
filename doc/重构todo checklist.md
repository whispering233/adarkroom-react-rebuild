# A Dark Room — 重构 TODO Checklist

> 勾选标记：`[ ]` 未开始 · `[~]` 进行中 · `[x]` 已完成

---

## ✅ 项目初始化

- [x] pnpm + Vite + React + TypeScript 项目骨架
- [x] Tailwind CSS v4 集成
- [x] CSS Modules 配置验证
- [x] `base: './'` 静态部署配置
- [x] 开发服务器可启动（`pnpm dev`）
- [x] 生产构建通过（`pnpm build`）
- [x] README.md 项目说明
- [x] `.gitignore` 配置
- [x] 原始项目源码拉取（`origin-adarkroom/` 只读参考）
- [x] 架构分析文档
- [x] 重构方案文档
- [x] TODO Checklist（本文件）
- [ ] Git 初始提交

---

## 阶段 1：状态管理基础

- [ ] **1.1** 定义 TypeScript 接口
  - [ ] `Stores` — 资源类型（wood, fur, meat, scales, teeth, iron, coal, steel...）
  - [ ] `Game` — 游戏状态（fire, temperature, builder.level, buildings, population...）
  - [ ] `Character` — 角色（perks, punches, health...）
  - [ ] `Income` — 收入配置
  - [ ] `Config` — 配置项
  - [ ] `GameState` — 根类型
- [ ] **1.2** 实现 `GameProvider` + `useGameContext`
  - [ ] Context 创建
  - [ ] Provider 组件
  - [ ] 自定义 hook（`useGameState`, `useGameDispatch`）
- [ ] **1.3** 实现 Reducer + Actions
  - [ ] `SET` action（设值）
  - [ ] `ADD` action（数值增减）
  - [ ] `SET_M` action（批量设置）
  - [ ] `ADD_M` action（批量增减）
  - [ ] `REMOVE` action
  - [ ] 自动创建缺失路径（类 `createState`）
  - [ ] 数值上限校验（`MAX_STORE`）
  - [ ] 负数保护
- [ ] **1.4** 状态变更通知机制
  - [ ] `onStateChange` 回调注册
  - [ ] 按 category 过滤通知
- [ ] **1.5** 单元测试
  - [ ] 基本读写
  - [ ] 路径自动创建
  - [ ] 批量操作
  - [ ] 边界值（MAX_STORE、负数）

---

## 阶段 2：房间路由系统

- [ ] **2.1** 场景路由
  - [ ] `currentRoom` 状态字段
  - [ ] 场景条件渲染（Room → Outside → Path → ...）
- [ ] **2.2** Header 标签栏
  - [ ] `<Header>` 组件
  - [ ] 标签动态显示/隐藏（基于 features 解锁）
  - [ ] 当前场景高亮
- [ ] **2.3** 场景切换动画
  - [ ] CSS transition 过渡
- [ ] **2.4** 暗室基础 UI
  - [ ] 标题动态变化（"A Dark Room" / "A Firelit Room"）
  - [ ] 火堆状态文字显示
  - [ ] 温度状态文字显示
  - [ ] 通知消息区域
- [ ] **2.5** `<Button>` 通用组件
  - [ ] 基本渲染（文字、点击）
  - [ ] 冷却倒计时（进度条动画）
  - [ ] 消耗提示（tooltip）
  - [ ] 禁用态（资源不足 / 冷却中）
  - [ ] `cooldown` / `cost` / `disabled` props

---

## 阶段 3：资源系统

- [ ] **3.1** 资源显示面板
  - [ ] `<StoresPanel>` 组件
  - [ ] 资源实时数值显示
  - [ ] 增量/减量数字动画
- [ ] **3.2** 收入系统
  - [ ] 定时 tick（1 秒间隔）
  - [ ] 收入配置（来源、产量、间隔）
  - [ ] 双倍速支持
  - [ ] 资源不足时暂停收入
- [ ] **3.3** 火堆机制
  - [ ] `lightFire()` — 消耗 5 木材，火堆 → Burning
  - [ ] `stokeFire()` — 消耗 1 木材，火堆 +1
  - [ ] `coolFire()` — 每 5 分钟火堆 -1
  - [ ] 建造者自动添柴（Lv≥4）
- [ ] **3.4** 建造者 NPC
  - [ ] 阶段 0-4 状态机
  - [ ] 阶段推进条件判断
  - [ ] 通知消息
- [ ] **3.5** 建造/交易逻辑
  - [ ] 建筑建造（trap, cart, hut, lodge, trading post...）
  - [ ] 工具/武器制作（torch, bone spear, iron sword...）
  - [ ] 交易品购买（scales, teeth, iron...）
  - [ ] 消耗校验 + 数量上限

---

## 阶段 4：事件引擎

- [ ] **4.1** 事件配置类型
  - [ ] `EventConfig` 接口
  - [ ] `SceneConfig` 接口（text, buttons, notification, reward...）
  - [ ] `ButtonConfig` 接口（text, nextScene, cost, onChoose...）
- [ ] **4.2** 事件调度器
  - [ ] 事件池（合并各模块事件）
  - [ ] 权重随机选择
  - [ ] 条件过滤（`available` 函数）
  - [ ] 冷却计时
- [ ] **4.3** 场景渲染
  - [ ] `<EventScene>` 递归组件
  - [ ] 文本渲染
  - [ ] 按钮渲染 + 场景跳转
- [ ] **4.4** `<EventModal>` 弹窗
  - [ ] Portal 渲染到 body
  - [ ] 半透明遮罩
  - [ ] 淡入动画
- [ ] **4.5** 状态触发事件
  - [ ] 状态变更 → 匹配触发条件
  - [ ] 延迟触发（`saveDelay`）

---

## 阶段 5：存档系统

- [ ] **5.1** 自动存档
  - [ ] 状态变更时 debounce 写入 localStorage
  - [ ] 保存指示器（"saved." 提示）
- [ ] **5.2** 存档加载
  - [ ] JSON 反序列化
  - [ ] 版本检测 + 迁移链
  - [ ] 无效存档容错（回退到新游戏）
- [ ] **5.3** 导入/导出
  - [ ] Base64 编码导出
  - [ ] 文本导入 + 解码
  - [ ] 确认提示
- [ ] **5.4** 新游戏/重置
  - [ ] 确认弹窗
  - [ ] 清除 localStorage
  - [ ] 保留 prestige 数据

---

## 阶段 6：UI 打磨 & 部署

- [ ] **6.1** 主题完善
  - [ ] 暗色背景 + 淡色文字
  - [ ] 火堆光效（文字阴影、辉光）
  - [ ] 等宽字体排版
  - [ ] 按钮样式一致性
- [ ] **6.2** 响应式适配
  - [ ] 移动端布局（< 768px）
  - [ ] 触屏友好按钮尺寸
- [ ] **6.3** 动画
  - [ ] 场景切换过渡
  - [ ] 数值浮动动画
  - [ ] 通知淡入淡出
- [ ] **6.4** 构建部署
  - [ ] `pnpm build` 产物验证
  - [ ] 静态部署测试（`pnpm preview`）

---

## 可选扩展

- [ ] **E1** Outside 村庄模块
- [ ] **E2** World 地图模块
- [ ] **E3** Path 路径 & 战斗模块
- [ ] **E4** Space 太空模块
- [ ] **E5** Fabricator 制造模块
- [ ] **E6** 音频系统（Web Audio API）
- [ ] **E7** 多语言支持（i18n）

---

## 技术备忘

- **构建命令**：`pnpm build`（tsc + vite build）
- **测试框架**：待定（Vitest 推荐）
- **部署目标**：静态 HTML + JS + CSS（可托管到任意静态服务器）
- **原项目参考**：`origin-adarkroom/`（git 已忽略）
