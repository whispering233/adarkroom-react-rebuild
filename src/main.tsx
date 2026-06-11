import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GameProvider } from './state'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </StrictMode>,
)
