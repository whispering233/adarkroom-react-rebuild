# Changelog

本文件记录项目的所有显著变动。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]
- Added
- Changed
- Fixed
- Removed


## [v0.3.3] - 2026-06-24

### Added
- EntityCell 抽象接口：entity 只返回 { char, prominent, bold } 视觉意图，不碰 CSS 变量
- createUniformEntity() 工厂函数：统一 footprint 实体一行配置即可创建
- deriveEntity() 派生函数：支持实体行为变体但外观复用的派生
- ResolvedEntityDrawCommand 类型：隔离 entity 层与渲染层

### Changed
- 15 个 entity 文件：用工厂重写，每文件从 ~60 行缩减为 ~8 行
- renderViewport 实体渲染段：删除 prominent:true/bold:true 硬编码
- 18 个测试文件适配 EntityCell 输出格式
- 提取 makeMask 辅助函数到 testHelpers.ts

### Removed
- 14 处硬编码 FONT_BOLD 常量
- 28 处硬编码 var(--game-*) CSS 变量引用


## [v0.3.2] - 2026-06-24

### Added
- 地图架构重构：地形层 + 实体层分离（WorldEntity 统一接口）
- Entity 系统：15 个地标实体，getDrawCommand() 纯函数渲染，onEnter() 触发
- StyleResolver：全局样式映射器，Entity 不碰 CSS 变量名
- 多格实体支持：village 3×3 箱形绘图字符统一图案
- 存档迁移 v1.3→v1.4：原子构建+验证，旧存档无损转换

### Changed
- renderViewport：纯函数，零 DOM 访问，StyleResolver 注入
- drawComposed：替换 renderTiles，按 (font, fillStyle) 分组批量绘制
- World.tsx：entityCellMap 替换 tile.landmark 地标检测
- generator.ts：输出 WorldMap（terrainMap + entityLayer）替代 MapTile[][]
- PersistentWorldData：tiles 弃用，worldMap 替代

### Removed
- effects.ts（composeEffects / getTerrainNarrationKey 死代码）
- TILE_CONFIG / fillStyleFor（被 StyleResolver 替代）
- renderTiles（被 drawComposed 替代）


## [v0.3.1] - 2026-06-22

### Added
- 世界地图：解耦地图逻辑和渲染逻辑，支持多格地块、异形地块、路径记录
- 世界地图信息显示

### Changed
- 调整世界地图HUD位置：右栏显示HUD

### Fixed
- 世界地图HUD，战斗界面：i18n 显示修复

### Removed
- 世界地图：移除地图固定大小，支持地图大小传参


## [v0.3.0] - 2026-06-21

### Added
- UI规则文件：CHANGELOG.md
- 重构world模块：使用canvas渲染world map，添加可变视觉窗口，给大地图做准备

### Fixed
- 世界地图css样式统一
- 世界地图布局优化
- react hook 修复
- 修复刷新页面存档丢失


## [v0.2.0] - 2026-06-19

### Added
- 存档系统：右下角工具栏新增保存/导出/导入/重新开始按钮
- 自动保存：每 10 秒自动保存至浏览器 localStorage，战斗和事件中暂停
- 存档导出/导入：通过 Base64 编码文本实现跨设备迁移，无需文件
- 页面关闭自动保存：beforeunload 事件兜底


## [v0.1.0] - 2026-06-19

### Added
- 初始版本：A Dark Room React + TypeScript 重构
- 暗室系统：点火/添柴，火堆冷却 + 温度调节
- 野外系统：伐木 + 检查陷阱，随机掉落 + 诱饵消耗
- 人口系统：hut 容纳上限，定时器自动增长
- 建造系统：10 栋建筑，per-worker 收入，动态解锁
- 世界地图：61×61 CSS Grid，四向行走，遭遇战
- 战斗系统：CombatOverlay 自包含，武器网格
- 随机事件系统：Room/Outside/World 事件
- 国际化：中/英双语支持
- 主题切换：浅色/暗色，localStorage 持久化
