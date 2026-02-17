import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { registerServiceWorker, initInstallPrompt } from './utils/pwa'

// Register service worker for PWA (Installable but No Caching)
registerServiceWorker()

// Initialize install prompt
initInstallPrompt()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

