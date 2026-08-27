/**
 * Réglages propres à l'application native.
 *
 * Sur le web, tout ici est inerte : les fonctions repartent immédiatement si
 * Capacitor n'est pas présent. Le même code sert donc les deux cibles.
 */
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

/** Couleurs de fond de l'application, reprises de `index.css`. */
const FOND = { light: '#f6e9d8', dark: '#1a1119' } as const

/**
 * Range la barre d'état.
 *
 * Par défaut, Android dessine l'application sous l'heure et la batterie : le
 * contenu passe dessous et devient illisible. Deux réponses existent — réserver
 * la place en CSS avec `env(safe-area-inset-top)`, ou demander au système de ne
 * plus superposer. La seconde est retenue : elle vaut pour toutes les versions
 * d'Android, y compris celles dont la vue web ne renseigne pas ces variables.
 *
 * La couleur du fond et celle des icônes suivent le thème. `Style.Light`
 * désigne, dans Capacitor, des icônes sombres sur fond clair.
 */
export async function reglerBarresSysteme(sombre: boolean) {
  if (!Capacitor.isNativePlatform()) return

  try {
    await StatusBar.setOverlaysWebView({ overlay: false })
    await StatusBar.setBackgroundColor({ color: sombre ? FOND.dark : FOND.light })
    await StatusBar.setStyle({ style: sombre ? Style.Dark : Style.Light })
  } catch {
    // Une barre d'état absente — tablette, version ancienne — ne doit pas
    // empêcher l'application de s'afficher.
  }
}
