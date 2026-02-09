import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

const APP_VERSION = 'v1.1.0'
const storedVersion = localStorage.getItem('app_version')

if (storedVersion !== APP_VERSION) {
  localStorage.clear()
  sessionStorage.clear()
  localStorage.setItem('app_version', APP_VERSION)
  window.location.reload()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
