import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { LogtoProvider, type LogtoConfig } from '@logto/react'
import './index.css'
import App from './App.tsx'

const APP_VERSION = 'v1.9.24'
const storedVersion = localStorage.getItem('app_version')

if (storedVersion !== APP_VERSION) {
  localStorage.clear()
  sessionStorage.clear()
  localStorage.setItem('app_version', APP_VERSION)
  window.location.reload()
}

const logtoConfig: LogtoConfig = {
  endpoint: (import.meta.env.VITE_LOGTO_ENDPOINT || 'https://logto.iasbt.cloud').trim(),
  appId: (import.meta.env.VITE_LOGTO_APP_ID || '').trim()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LogtoProvider config={logtoConfig}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </LogtoProvider>
  </StrictMode>,
)
