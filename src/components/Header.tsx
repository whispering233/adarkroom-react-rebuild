/**
 * Header — 场景标签导航栏
 *
 * 基于 features["location.xxx"] 和 currentRoom 动态渲染标签。
 * Room 始终可见，其余场景在对应 feature 解锁后显示。
 */
import { useGameState, useGameDispatch, applyRecipe, RoomName } from '../state'

type RoomNameType = (typeof RoomName)[keyof typeof RoomName]

/** 所有场景顺序 */
const ROOM_ORDER: RoomNameType[] = [
  RoomName.Room,
  RoomName.Outside,
  RoomName.Path,
  RoomName.World,
  RoomName.Fabricator,
  RoomName.Ship,
]

/** 场景标签显示文字 */
const ROOM_LABELS: Record<RoomNameType, string> = {
  [RoomName.Room]: 'A Dark Room',
  [RoomName.Outside]: 'Outside',
  [RoomName.Path]: 'Path',
  [RoomName.World]: 'World',
  [RoomName.Space]: 'Space',
  [RoomName.Fabricator]: 'Fabricator',
  [RoomName.Ship]: 'Ship',
}

/** 场景对应的 feature key */
function featureKey(name: RoomNameType): string {
  return `location.${name}`
}

export function Header() {
  const state = useGameState()
  const dispatch = useGameDispatch()
  const currentRoom = state.currentRoom
  const features = state.features

  const handleNavigate = (room: RoomNameType) => {
    dispatch(applyRecipe(draft => { draft.currentRoom = room }))
  }

  return (
    <header className="flex items-center bg-[#0d0d1a] border-b border-gray-800 px-4 py-0">
      {ROOM_ORDER.map((room) => {
        // Room 始终显示，其余按 feature 解锁
        const isUnlocked =
          room === RoomName.Room || features[featureKey(room)] === true
        if (!isUnlocked) return null

        const isActive = currentRoom === room

        return (
          <button
            key={room}
            type="button"
            onClick={() => handleNavigate(room)}
            className={`
              px-4 py-3 font-mono text-sm transition-colors
              cursor-pointer border-b-2 -mb-[1px]
              ${isActive
                ? 'text-orange-400 border-orange-500'
                : 'text-gray-500 border-transparent hover:text-gray-300 hover:border-gray-600'
              }
            `}
          >
            {ROOM_LABELS[room]}
          </button>
        )
      })}
    </header>
  )
}
