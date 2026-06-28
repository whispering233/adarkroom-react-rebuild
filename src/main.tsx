import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GameProvider } from './state'
import { ErrorBoundary } from './components/ErrorBoundary'
import './i18n'
import './index.css'
import { registerAll } from './events/EventRegistry'
import App from './App.tsx'

registerAll()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <GameProvider>
        <App />
      </GameProvider>
    </ErrorBoundary>
  </StrictMode>,
)
