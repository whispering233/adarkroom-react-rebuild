/**
 * Header — 场景标签导航栏（中栏顶部）
 *
 * 基于 features["location.xxx"] 和 currentRoom 动态渲染标签。
 * Room 始终可见，其余场景在对应 feature 解锁后显示。
 */
import { useTranslation } from 'react-i18next'
import { useGameState, useGameDispatch, applyRecipe, RoomName } from '../state'
import styles from './Header.module.css'

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

/** 场景名 → i18n key */
const ROOM_I18N: Record<RoomNameType, string> = {
  [RoomName.Room]: 'nav.room',
  [RoomName.Outside]: 'nav.outside',
  [RoomName.Path]: 'nav.path',
  [RoomName.World]: 'nav.world',
  [RoomName.Space]: 'nav.space',
  [RoomName.Fabricator]: 'nav.fabricator',
  [RoomName.Ship]: 'nav.ship',
}

/** 场景对应的 feature key */
function featureKey(name: RoomNameType): string {
  return `location.${name}`
}

/** 标签基础样式 */
const TAB_BASE =
  'px-4 py-3 font-[var(--game-font)] text-sm transition-colors cursor-pointer border-b-2 -mb-[1px]'

export function Header() {
  const { t } = useTranslation()
  const state = useGameState()
  const dispatch = useGameDispatch()
  const currentRoom = state.currentRoom
  const features = state.features

  const handleNavigate = (room: RoomNameType) => {
    dispatch(applyRecipe(draft => { draft.currentRoom = room }))
  }

  return (
    <nav
      className="flex items-center px-4 py-0"
    >
      {ROOM_ORDER.map((room) => {
        const isUnlocked =
          room === RoomName.Room || room === RoomName.Outside || features[featureKey(room)] === true
        if (!isUnlocked) return null

        const isActive = currentRoom === room

        return (
          <button
            key={room}
            type="button"
            onClick={() => handleNavigate(room)}
            className={`${TAB_BASE} ${isActive ? styles.tabActive : styles.tabInactive}`}
          >
            {t(ROOM_I18N[room])}
          </button>
        )
      })}
    </nav>
  )
}
