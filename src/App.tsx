import { useGameState, useGameDispatch, useGameValue, add, set, FireLevel, FIRE_TEXT } from './state'
import styles from './App.module.css'

/** 技术栈列表 */
const TECH_STACK = [
  'pnpm',
  'React 19',
  'TypeScript',
  'Vite',
  'Tailwind CSS v4',
  'CSS Modules',
] as const

function App() {
  const state = useGameState()
  const dispatch = useGameDispatch()
  const fireLevel = (useGameValue<number>('game.fire') ?? FireLevel.Dead) as FireLevel
  const wood = useGameValue<number>('stores.wood') ?? 0

  const handleLightFire = () => {
    if (wood < 5) return
    dispatch(add('stores.wood', -5))
    dispatch(set('game.fire', FireLevel.Burning))
  }

  const handleStokeFire = () => {
    if (wood < 1) return
    dispatch(add('stores.wood', -1))
    if (fireLevel < FireLevel.Roaring) {
      dispatch(set('game.fire', fireLevel + 1))
    }
  }

  const handleGatherWood = () => {
    dispatch(add('stores.wood', 1))
  }

  const isFireDead = fireLevel === FireLevel.Dead

  return (
    <div className={styles.room}>
      {/* 标题 */}
      <h1 className={styles.title}>
        {fireLevel >= FireLevel.Flickering ? 'A Firelit Room' : 'A Dark Room'}
      </h1>
      <p className={styles.subtitle}>
        the fire is {isFireDead ? '❄️ dead' : `🔥 ${FIRE_TEXT[fireLevel]}`}
      </p>

      {/* 资源显示 */}
      <div className="mt-2 font-mono text-sm text-gray-400">
        wood: {wood}
      </div>

      {/* 操作按钮组 */}
      <div className="mt-4 flex gap-3">
        {isFireDead ? (
          <button
            type="button"
            onClick={handleLightFire}
            disabled={wood < 5}
            className="cursor-pointer rounded border border-orange-700/50 bg-orange-900/30 px-5 py-2 font-mono text-sm text-orange-300 transition hover:bg-orange-900/50 hover:shadow-[0_0_15px_rgba(201,75,26,0.3)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            light fire (5 wood)
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStokeFire}
            disabled={wood < 1}
            className="cursor-pointer rounded border border-orange-700/50 bg-orange-900/30 px-5 py-2 font-mono text-sm text-orange-300 transition hover:bg-orange-900/50 hover:shadow-[0_0_15px_rgba(201,75,26,0.3)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            stoke fire (1 wood)
          </button>
        )}

        <button
          type="button"
          onClick={handleGatherWood}
          className="cursor-pointer rounded border border-amber-700/50 bg-amber-900/20 px-5 py-2 font-mono text-sm text-amber-300 transition hover:bg-amber-900/40 active:scale-95"
        >
          gather wood
        </button>
      </div>

      {/* 状态调试面板 */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>State Inspector</h2>
        <pre className="text-left text-xs text-gray-500 max-h-32 overflow-auto font-mono">
          {JSON.stringify(
            { 'game.fire': fireLevel, 'stores.wood': wood, 'state.keys': Object.keys(state) },
            null,
            2,
          )}
        </pre>
      </div>

      {/* 技术栈展示 */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Workshop Stack</h2>
        <div className={styles.stack}>
          {TECH_STACK.map((tech) => (
            <span key={tech} className={styles.badge}>
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* 来源说明 */}
      <div className="mt-8 text-xs text-gray-600">
        Refactoring practice based on{' '}
        <a
          href="https://github.com/doublespeakgames/adarkroom"
          target="_blank"
          rel="noreferrer"
          className="text-orange-600 underline hover:text-orange-400"
        >
          doublespeakgames/adarkroom
        </a>
      </div>
    </div>
  )
}

export default App
