import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Emballage natif du build web.
 *
 * Capacitor ne réécrit pas l'application : il embarque la sortie de Vite dans
 * une coquille Android et la sert depuis le disque de l'appareil. Le même code
 * alimente donc le site et l'application, sans duplication.
 */
const config: CapacitorConfig = {
  // Identifiant de l'application sur l'appareil et dans le Play Store. Il est
  // définitif : une fois publié, il ne peut plus changer sans repartir d'une
  // fiche vierge.
  appId: 'io.github.oderc95.budgette',
  appName: 'Budgette',

  // Le dossier produit par `npm run build`. `npx cap sync` en recopie le
  // contenu dans le projet Android.
  webDir: 'dist',

  android: {
    // Le contenu est servi depuis le disque : aucune requête réseau au
    // démarrage, et rien à héberger pour que l'application fonctionne.
    allowMixedContent: false,
  },

  backgroundColor: '#f6e9d8',
}

export default config
