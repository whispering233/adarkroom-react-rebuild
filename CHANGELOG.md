# Changelog

本文件记录项目的所有显著变动。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

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
