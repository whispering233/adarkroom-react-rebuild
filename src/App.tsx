/**
 * App — 根组件
 *
 * 三栏布局：左栏剧情 | 中栏交互 | 右栏数据
 * 基于 currentRoom 状态驱动场景路由。
 */
import { useGameState, RoomName } from './state'
import { Header } from './components/Header'
import { NarrativePanel } from './components/NarrativePanel'
import { StoresPanel } from './components/StoresPanel'
import { Toolbar } from './components/Toolbar'
import { Room } from './rooms/Room'

function App() {
  const currentRoom = useGameState().currentRoom

  return (
    <div
      className="grid min-h-screen"
      style={{ gridTemplateColumns: '280px 1fr 280px' }}
    >
      {/* 左栏 — 剧情文本 */}
      <aside className="border-r p-4 overflow-y-auto" style={{ borderColor: 'var(--game-border)' }}>
        <NarrativePanel />
      </aside>

      {/* 中栏 — 交互操作 */}
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          {currentRoom === RoomName.Room && <Room />}
          {/* 后续阶段添加：Outside, Path, World, Space, Fabricator, Ship */}
        </main>
      </div>

      {/* 右栏 — 游戏数据 */}
      <aside className="border-l p-4 overflow-y-auto" style={{ borderColor: 'var(--game-border)' }}>
        <StoresPanel />
      </aside>
      <Toolbar />
    </div>
  )
}

export default App
