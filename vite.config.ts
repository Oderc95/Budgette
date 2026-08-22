import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `ARTIFACT=1 npm run build` produit un fichier HTML autonome (prototype cliquable).
// Le build standard produit un SPA classique prêt à héberger.
const singleFile = process.env.ARTIFACT === '1'

export default defineConfig({
  // Chemins relatifs : le SPA fonctionne aussi bien à la racine d'un domaine
  // que dans un sous-dossier ou ouvert directement depuis le disque.
  base: './',
  plugins: [react(), tailwindcss(), ...(singleFile ? [viteSingleFile()] : [])],
  build: {
    outDir: singleFile ? 'dist-artifact' : 'dist',
    // Le prototype tient dans un seul fichier : pas de découpage ni de sourcemaps.
    sourcemap: !singleFile,
    rollupOptions: singleFile
      ? undefined
      : {
          output: {
            // Les graphiques et les animations pèsent autant que le reste de
            // l'application réunie. Les isoler laisse le navigateur les garder
            // en cache d'une visite à l'autre, alors que le code applicatif
            // change à chaque déploiement.
            manualChunks: (id: string) => {
              if (id.includes('/node_modules/recharts/')) return 'charts'
              if (id.includes('/node_modules/framer-motion/')) return 'motion'
              if (id.includes('/node_modules/animejs/')) return 'motion'
            },
          },
        },
  },
})
