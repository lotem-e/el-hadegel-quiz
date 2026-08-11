// main.tsx - the entry point. Vite loads this file first (see index.html),
// and it mounts the React app into the <div id="root"> element.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
