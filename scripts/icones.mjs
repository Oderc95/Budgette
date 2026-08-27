/**
 * Produit les icônes de l'application — web installable et Android — à partir
 * de `favicon.svg`.
 *
 * Deux familles sont nécessaires. L'icône ordinaire est affichée telle quelle.
 * L'icône « maskable » est recadrée par le système dans une forme qu'il choisit
 * — cercle, goutte, carré arrondi — et doit donc porter son motif dans le cercle
 * de sûreté central, soit 80 % de sa largeur, sur un fond qui couvre tout.
 *
 * À relancer uniquement quand la marque change : les fichiers produits sont
 * versionnés, le build n'en dépend pas.
 */
import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'node:fs'

const marque = readFileSync('public/favicon.svg', 'utf8')

// Le fond du gabarit reprend le dégradé de la marque. Pour l'icône recadrée,
// le carré arrondi que porte le fichier source est masqué : c'est le fond de la
// page qui va jusqu'aux bords, et le système applique ensuite sa propre forme.
const gabarit = (taille, marge, transparent = false) => `<!doctype html>
<html><head><meta charset="utf-8"><style>
  html, body { margin: 0; padding: 0; }
  body {
    width: ${taille}px;
    height: ${taille}px;
    background: ${transparent ? 'transparent' : 'linear-gradient(135deg, #db5620 0%, #d0344f 100%)'};
  }
  svg { position: absolute; inset: ${marge}px; width: ${taille - marge * 2}px; height: ${taille - marge * 2}px; }
  ${marge > 0 ? 'svg rect { display: none; }' : ''}
</style></head><body>${marque}</body></html>`

const cibles = [
  { fichier: 'public/icone-192.png', taille: 192, marge: 0 },
  { fichier: 'public/icone-512.png', taille: 512, marge: 0 },
  // Le motif fait déjà les trois quarts de la largeur du fichier source : une
  // marge de 15 % le ramène dans le cercle de sûreté, qui couvre 80 % du carré.
  { fichier: 'public/icone-maskable-512.png', taille: 512, marge: 77 },
  // Icône d'écran d'accueil iOS : le système lui applique déjà son propre
  // arrondi, la marque est donc posée sans marge.
  { fichier: 'public/apple-touch-icon.png', taille: 180, marge: 0 },
]

// `CHROMIUM` permet de désigner un binaire déjà présent, quand la version
// téléchargée par Playwright n'est pas disponible sur la machine.
/*
 * Icônes Android.
 *
 * Deux jeux, pour deux générations du système. L'icône héritée est utilisée
 * telle quelle par les anciennes versions. L'icône adaptative, elle, superpose
 * un fond uni et un calque de premier plan que le système anime et découpe
 * dans la forme du constructeur : ce calque est transparent, mesure 108 unités
 * pour 72 utiles, et son motif doit donc tenir dans les deux tiers centraux.
 */
const RES = 'android/app/src/main/res'
const DENSITES = [
  ['mdpi', 1],
  ['hdpi', 1.5],
  ['xhdpi', 2],
  ['xxhdpi', 3],
  ['xxxhdpi', 4],
]

for (const [densite, facteur] of DENSITES) {
  const heritee = Math.round(48 * facteur)
  cibles.push(
    { fichier: `${RES}/mipmap-${densite}/ic_launcher.png`, taille: heritee, marge: 0 },
    { fichier: `${RES}/mipmap-${densite}/ic_launcher_round.png`, taille: heritee, marge: 0 },
    {
      fichier: `${RES}/mipmap-${densite}/ic_launcher_foreground.png`,
      taille: Math.round(108 * facteur),
      // (108 − 72) / 2 = 18 unités de marge de chaque côté.
      marge: Math.round(18 * facteur),
      transparent: true,
    },
  )
}

const navigateur = await chromium.launch(
  process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {},
)
const page = await navigateur.newPage()

for (const { fichier, taille, marge, transparent } of cibles) {
  await page.setViewportSize({ width: taille, height: taille })
  await page.setContent(gabarit(taille, marge, transparent))
  writeFileSync(fichier, await page.screenshot({ omitBackground: Boolean(transparent) }))
  console.log(`${fichier} — ${taille}px`)
}

await navigateur.close()
