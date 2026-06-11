import { useState } from 'react'
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
  const [lit, setLit] = useState(false)

  return (
    <div className={styles.room}>
      {/* 标题区域 —— 使用 CSS Modules */}
      <h1 className={styles.title}>A Dark Room</h1>
      <p className={styles.subtitle}>the fire is {lit ? '🔥 lit' : '❄️ dead'}</p>

      {/* 按钮 —— 使用 Tailwind 原子类 */}
      <button
        type="button"
        onClick={() => setLit((v) => !v)}
        className="mt-6 cursor-pointer rounded border border-orange-700/50 bg-orange-900/30 px-6 py-2 font-mono text-sm text-orange-300 transition hover:bg-orange-900/50 hover:shadow-[0_0_15px_rgba(201,75,26,0.3)] active:scale-95"
      >
        {lit ? 'stoke the fire' : 'light the fire'}
      </button>

      {/* 技术栈展示区 —— 混合使用 CSS Modules + Tailwind */}
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
