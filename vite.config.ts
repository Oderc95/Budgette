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
  },
})
