/**
 * StoresPanel — 资源显示面板
 *
 * 实时列出 stores 中所有有值（>0）的资源项。
 * 顶部固定半透明条，资源横向排列。
 */
import { useGameState } from '../state'

/** 已知核心资源键列表（用于判断某项是否为"已知"资源） */
const KNOWN_STORE_KEYS = new Set([
  'wood',
  'fur',
  'meat',
  'scales',
  'teeth',
  'iron',
  'coal',
  'steel',
  'sulphur',
  'cloth',
  'leather',
  'cured meat',
  'bullets',
  'energy cell',
  'medicine',
  'hypo',
  'stim',
])

export function StoresPanel() {
  const state = useGameState()
  const stores = state.stores

  // 有值的资源项：已知资源即使为 0 也显示，动态资源只在 > 0 时显示
  const entries = Object.entries(stores).filter(([key, value]) => {
    if (KNOWN_STORE_KEYS.has(key)) return true // 已知资源始终显示
    return (value ?? 0) > 0 // 动态资源只在有值时显示
  })

  if (entries.length === 0) return null

  return (
    <div className="sticky top-0 z-20 bg-black/50 backdrop-blur-sm border-b border-gray-800 px-4 py-2">
      <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center">
        {entries.map(([key, value]) => (
          <span
            key={key}
            className="font-mono text-sm text-gray-400 transition-all duration-300"
          >
            <span className="text-gray-500">{key}:</span>{' '}
            <span className="text-amber-300">{value ?? 0}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
