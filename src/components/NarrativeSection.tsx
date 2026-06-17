/**
 * NarrativeSection — 叙事区块通用组件
 *
 * 渲染标题 + 条目列表（可滚动，旧条目渐隐）。
 * 消除手动叙事/资源变化块之间的重复代码。
 */
import type { ReactNode } from 'react'

interface EntryItem {
  id: number
  text: string
}

interface NarrativeSectionProps {
  /** 区块标题（可选） */
  title?: string
  /** 叙事条目列表 */
  entries: EntryItem[]
  /** 无条目时显示的占位内容 */
  emptyPlaceholder?: ReactNode
}

function fadeOpacity(index: number): number {
  return Math.max(1 - index * 0.08, 0.5)
}

export function NarrativeSection({ title, entries, emptyPlaceholder }: NarrativeSectionProps) {
  if (entries.length === 0 && !emptyPlaceholder) return null

  return (
    <div className="overflow-y-auto min-h-0 pr-1">
      {title && (
        <div className="text-xs uppercase tracking-[0.2em] text-(--game-text-muted) mb-1">
          {title}
        </div>
      )}
      {entries.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          {entries.map((entry, i) => (
            <p
              key={entry.id}
              className="text-[0.7rem] leading-[1.6] transition-opacity duration-1000"
              style={{
                opacity: fadeOpacity(i),
                animation: i === 0 ? 'narrSlideIn 0.4s ease-out' : undefined,
              }}
            >
              {entry.text}
            </p>
          ))}
        </div>
      ) : emptyPlaceholder ? (
        <div className="text-xs text-(--game-text-muted) italic px-1">
          {emptyPlaceholder}
        </div>
      ) : null}
    </div>
  )
}
