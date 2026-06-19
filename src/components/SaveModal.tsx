/**
 * SaveModal — 存档导入/导出弹窗
 *
 * Export 模式：将当前游戏状态编码为 Base64 显示，支持一键复制。
 * Import 模式：粘贴 Base64 存档数据并解码加载。
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameState, useGameDispatch, loadSave, pushNarrative } from '../state'
import { encodeState, decodeState } from '../system/saveManager'

// ─── 常量 ─────────────────────────────────────────────────

const BTN_STYLE =
  'rounded border px-2.5 py-1 font-mono text-xs transition cursor-pointer bg-(--game-bg-header) border-(--game-border) text-(--game-text-body) hover:bg-(--game-btn-hover-bg)'

// ─── Props ────────────────────────────────────────────────

interface SaveModalProps {
  mode: 'export' | 'import'
  onClose: () => void
}

// ─── 组件 ─────────────────────────────────────────────────

export function SaveModal({ mode, onClose }: SaveModalProps) {
  const { t } = useTranslation()
  const state = useGameState()
  const dispatch = useGameDispatch()

  // ── Export 状态 ──
  const b64 = mode === 'export' ? encodeState(state) : ''
  const [copied, setCopied] = useState(false)

  // ── Import 状态 ──
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  // ── 复制 ─────────────────────────────────────────────

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(b64)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard API 不可用时静默失败
    }
  }, [b64])

  // ── 导入 ─────────────────────────────────────────────

  const handleImport = useCallback(() => {
    try {
      const decoded = decodeState(text)
      dispatch(loadSave(decoded))
      dispatch(pushNarrative(t('save.import_ok')))
      onClose()
    } catch {
      setError(t('save.import_invalid'))
    }
  }, [text, dispatch, onClose, t])

  // ── 渲染 ─────────────────────────────────────────────

  if (mode === 'export') {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
        <div className="bg-(--game-bg-header) rounded-lg p-6 max-w-lg w-full mx-4 shadow-lg border border-(--game-border)">
          <h2 className="text-lg font-bold mb-2 text-(--game-text-body)">
            {t('save.export_title')}
          </h2>
          <p className="text-sm text-(--game-text-body) mb-3">
            {t('save.export_desc')}
          </p>
          <pre className="select-all overflow-auto max-h-60 text-xs break-all bg-(--game-bg) p-3 rounded border border-(--game-border) text-(--game-text-body) mb-4">
            {b64}
          </pre>
          <div className="flex gap-2">
            <button type="button" onClick={handleCopy} className={BTN_STYLE}>
              {copied ? t('save.copied') : t('save.copy')}
            </button>
            <button type="button" onClick={onClose} className={BTN_STYLE}>
              {t('save.close')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Import mode
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
      <div className="bg-(--game-bg-header) rounded-lg p-6 max-w-lg w-full mx-4 shadow-lg border border-(--game-border)">
        <h2 className="text-lg font-bold mb-2 text-(--game-text-body)">
          {t('save.import_title')}
        </h2>
        <p className="text-sm text-(--game-text-body) mb-3">
          {t('save.import_desc')}
        </p>
        <textarea
          className="w-full h-40 font-mono text-xs border rounded p-2 bg-(--game-bg) border-(--game-border) text-(--game-text-body) mb-2 resize-none"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setError(null)
          }}
          placeholder={t('save.import_desc')}
        />
        {error && (
          <p className="text-red-500 text-sm mb-2">{error}</p>
        )}
        <div className="flex gap-2">
          <button type="button" onClick={handleImport} className={BTN_STYLE}>
            {t('save.import_btn')}
          </button>
          <button type="button" onClick={onClose} className={BTN_STYLE}>
            {t('save.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
