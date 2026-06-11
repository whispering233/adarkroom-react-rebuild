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
```

## 项目结构

```
.
├── index.html                # 入口 HTML
├── public/                   # 静态资源（不经过构建处理）
├── src/
│   ├── main.tsx              # React 挂载入口
│   ├── index.css             # 全局样式 & Tailwind 指令
│   ├── App.tsx               # 根组件
│   └── App.module.css        # CSS Modules 演示
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

## 重构目标

原始项目是一个纯 JavaScript 文字冒险游戏。本重构练习逐步将其改造为：

- 组件化的 React 架构
- 类型安全的 TypeScript
- 可静态部署的 SPA
- 响应式 UI（Tailwind + CSS Modules）

详见 [`doc/`](doc/) 目录下的架构分析、阶段方案和 TODO 清单。

## License

原始项目 (c) Michael Townsend / doublespeakgames — [MPL-2.0](https://github.com/doublespeakgames/adarkroom/blob/master/LICENSE)
