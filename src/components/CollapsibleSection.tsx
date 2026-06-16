/**
 * CollapsibleSection — 可折叠区块
 *
 * 标题行点击展开/折叠，带 ▶/▼ 箭头指示。
 * 用于右栏数据面板的三级折叠（建筑物 / 库存 / 武器 → 库存子分类）。
 */
import { useState } from 'react'
import type { ReactNode } from 'react'

interface Props {
  title: string
  defaultOpen?: boolean
  children: ReactNode
}

export function CollapsibleSection({ title, defaultOpen = false, children }: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        className="flex items-center gap-1 w-full text-left cursor-pointer select-none
                   hover:text-(--game-accent) transition-colors"
      >
        <span className="text-[0.6rem] w-3 shrink-0 text-(--game-text-muted)">
          {isOpen ? '▼' : '▶'}
        </span>
        <span className="text-xs uppercase tracking-[0.2em] text-(--game-accent)">
          {title}
        </span>
      </button>
      {isOpen && (
        <div className="mt-1.5 ml-4">
          {children}
        </div>
      )}
    </div>
  )
}
