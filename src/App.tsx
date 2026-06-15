/**
 * App — 根组件
 *
 * 三栏布局：左栏剧情 | 中栏交互 | 右栏数据
 * 基于 currentRoom 状态驱动场景路由（对象映射）。
 */
import type { ComponentType } from 'react'
import { useGameState, RoomName } from './state'
import type { RoomName as RoomNameType } from './state/types'
import { Header } from './components/Header'
import { NarrativePanel } from './components/NarrativePanel'
import { StoresPanel } from './components/StoresPanel'
import { Toolbar } from './components/Toolbar'
import { GameLoop } from './system/GameLoop'
import { Room } from './rooms/Room'
import { Outside } from './rooms/Outside'

/** 场景路由表 — 新增场景只需在此注册即可 */
const SCENES: Partial<Record<RoomNameType, ComponentType>> = {
  [RoomName.Room]: Room,
  [RoomName.Outside]: Outside,
}

function App() {
  const currentRoom = useGameState().currentRoom
  const Scene = SCENES[currentRoom]

  return (
    <div className="grid min-h-screen grid-cols-[280px_1fr_280px]">
      {/* 左栏 — 剧情文本 */}
      <aside className="border-r p-4 overflow-y-auto border-(--game-border)">
        <NarrativePanel />
      </aside>

      {/* 中栏 — 交互操作 */}
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex flex-col">
          {/* 全局游戏循环（始终挂载：定时器 + 通知） */}
          <GameLoop />
          {/* 场景区域 */}
          <div className="flex-1 flex flex-col justify-center">
            {Scene && <Scene />}
          </div>
        </main>
      </div>

      {/* 右栏 — 游戏数据 */}
      <aside className="border-l p-4 overflow-y-auto border-(--game-border)">
        <StoresPanel />
      </aside>
      <Toolbar />
    </div>
  )
}

export default App
