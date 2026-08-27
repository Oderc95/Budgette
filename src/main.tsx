import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { App } from './App'
import { enregistrerServiceWorker } from './lib/pwa'
import './index.css'

/**
 * `HashRouter` plutôt que `BrowserRouter` : le prototype est distribué comme
 * un fichier HTML autonome, sans serveur capable de réécrire les URL.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)

// Mode hors ligne et installation sur l'écran d'accueil. Sans effet en
// développement, et sans effet sur le rendu : l'appel ne bloque rien.
enregistrerServiceWorker()
