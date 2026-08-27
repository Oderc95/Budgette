/**
 * Enregistrement du service worker.
 *
 * Le fichier `sw.js` n'existe que dans la sortie de production : il est
 * engendré après le build par `scripts/service-worker.mjs`. En développement,
 * l'enregistrer servirait un cache périmé à la place du serveur de Vite.
 */

/** Vrai quand un service worker déjà installé sert la page. */
export function estInstallee(): boolean {
  return typeof navigator !== 'undefined' && Boolean(navigator.serviceWorker?.controller)
}

export function enregistrerServiceWorker() {
  if (import.meta.env.DEV) return
  if (!('serviceWorker' in navigator)) return

  /*
   * Dans l'application Android, les fichiers sont déjà sur l'appareil : mettre
   * en cache une copie locale n'apporte rien, et le cache survivrait à une
   * mise à jour de l'application en resservant l'ancienne version. Capacitor
   * sert la page depuis `localhost`, donc le protocole ne suffit pas à la
   * reconnaître — c'est l'objet qu'il injecte qui la distingue.
   */
  if ('Capacitor' in window) return

  /*
   * L'enregistrement attend le chargement complet de la page. Lancé plus tôt,
   * le préchargement de la coquille entre en concurrence avec l'affichage du
   * premier écran, sur la connexion comme sur le processeur.
   */
  window.addEventListener('load', () => {
    // Chemin relatif au document : l'application est publiée dans un
    // sous-dossier sur GitHub Pages, et la portée doit suivre.
    navigator.serviceWorker.register('./sw.js').catch((erreur) => {
      // Un échec d'enregistrement ne casse rien : l'application fonctionne,
      // sans le mode hors ligne. On n'interrompt pas l'utilisateur pour cela.
      console.warn("Budgette — mode hors ligne indisponible :", erreur)
    })
  })
}
