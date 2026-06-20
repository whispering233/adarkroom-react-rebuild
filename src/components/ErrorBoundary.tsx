/**
 * ErrorBoundary — 顶层错误边界，防止未捕获异常导致全屏白屏。
 */
import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-(--game-bg-primary) text-(--game-text-body) font-[var(--game-font)] text-sm p-8">
          <div className="max-w-md text-center">
            <h1 className="text-(--game-text-primary) text-lg font-bold mb-4">游戏崩溃</h1>
            <p className="text-(--game-text-muted) mb-4 break-all">
              {this.state.error.message}
            </p>
            <button
              onClick={() => {
                this.setState({ error: null })
                window.location.reload()
              }}
              className="rounded border border-(--game-btn-border) px-4 py-2 text-(--game-btn-text) hover:bg-(--game-btn-hover-bg) cursor-pointer"
            >
              重新加载
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
