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
import { EventOverlay } from './components/EventOverlay'
import { Room } from './rooms/Room'
import { Outside } from './rooms/Outside'

/** 场景路由表 — 新增场景只需在此注册即可 */
const SCENES: Partial<Record<RoomNameType, ComponentType>> = {
  [RoomName.Room]: Room,
  [RoomName.Outside]: Outside,
}

function App() {
  const state = useGameState()
  const currentRoom = state.currentRoom
  const activeEvent = state.game.activeEvent
  const Scene = SCENES[currentRoom]

  return (
    <div
      className="mx-auto h-screen"
      style={{ maxWidth: 'var(--game-content-max-width)' }}
    >
      <div className="grid h-full overflow-hidden grid-cols-[1fr_3fr_1.5fr]">
        {/* 左栏 — 剧情文本 */}
        <aside className="p-4 overflow-y-auto">
          <NarrativePanel />
        </aside>

        {/* 中栏 — 交互操作 */}
        <div className="relative flex flex-col h-full overflow-y-auto">
          <Header />
          {/* 事件弹窗覆盖层 */}
          {activeEvent && <EventOverlay />}
          <main className="flex-1 flex flex-col">
            {/* 全局游戏循环（始终挂载：定时器 + 通知） */}
            <GameLoop />
            {/* 场景区域 */}
            <div className="flex-1 flex flex-col justify-start">
              {Scene && <Scene />}
            </div>
          </main>
        </div>

        {/* 右栏 — 游戏数据 */}
        <aside className="p-4 overflow-y-auto">
          <StoresPanel />
        </aside>
        <Toolbar />
      </div>
    </div>
  )
}

export default App
