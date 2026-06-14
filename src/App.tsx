/**
 * App — 根组件
 *
 * 基于 currentRoom 状态驱动场景路由。
 * 后续阶段逐步添加 Outside / Path / World / Space / Fabricator / Ship 场景。
 */
import { useGameState, RoomName } from './state'
import { Header } from './components/Header'
import { Room } from './rooms/Room'

function App() {
  const currentRoom = useGameState().currentRoom

  return (
    <div className="flex flex-col min-h-screen bg-[#1a1a2e]">
      <Header />
      <main className="flex-1">
        {currentRoom === RoomName.Room && <Room />}
        {/* 后续阶段添加：Outside, Path, World, Space, Fabricator, Ship */}
      </main>
    </div>
  )
}

export default App
