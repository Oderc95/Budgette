/**
 * Écrit `dist/sw.js` après le build de Vite.
 *
 * Le service worker est produit ici plutôt qu'écrit à la main parce qu'il doit
 * connaître le nom exact des fichiers du build : Vite y appose une empreinte
 * qui change à chaque déploiement. Cette liste sert à la fois de préchargement
 * et de numéro de version — un fichier différent, un cache différent.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, relative } from 'node:path'

const racine = 'dist'

/** Chemins de tous les fichiers du build, relatifs à `dist`, en séparateurs URL. */
function fichiers(dossier) {
  return readdirSync(dossier, { withFileTypes: true }).flatMap((entree) => {
    const chemin = join(dossier, entree.name)
    return entree.isDirectory() ? fichiers(chemin) : [relative(racine, chemin).split('\\').join('/')]
  })
}

const tous = fichiers(racine)

/*
 * Ce qui est préchargé : la coquille de l'application et ses ressources. Les
 * cartes de sources pèsent lourd et ne servent qu'au débogage ; le service
 * worker lui-même ne se met évidemment pas en cache.
 */
const precache = tous.filter((nom) => !nom.endsWith('.map') && nom !== 'sw.js')

// L'empreinte du contenu réel, et non de la seule liste des noms : un fichier
// non versionné modifié (`favicon.svg`, une icône) change lui aussi le cache.
const empreinte = createHash('sha256')
for (const nom of [...precache].sort()) {
  empreinte.update(nom)
  empreinte.update(readFileSync(join(racine, nom)))
}
const version = empreinte.digest('hex').slice(0, 12)

const source = `/*
 * Service worker de Budgette — engendré par scripts/service-worker.mjs.
 * Ne pas modifier à la main : le fichier est réécrit à chaque build.
 */
const VERSION = '${version}'
const CACHE = 'budgette-' + VERSION
const PRECACHE = ${JSON.stringify(precache, null, 2)}

// L'installation ne se termine que si toute la coquille est en cache : une
// version à moitié téléchargée ne doit jamais prendre la main sur la précédente.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE.map((nom) => './' + nom))),
  )
})

// Le nouveau service worker prend la main dès qu'il est prêt, et efface les
// caches des versions précédentes. \`clients.claim\` évite que l'onglet ouvert
// continue d'être servi par l'ancienne version jusqu'à sa fermeture.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((noms) => Promise.all(noms.filter((nom) => nom !== CACHE).map((nom) => caches.delete(nom))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const requete = event.request
  if (requete.method !== 'GET') return

  const url = new URL(requete.url)

  /*
   * Navigation. L'application est routée par ancre : toute navigation vise le
   * même document. On le sert depuis le cache, ce qui rend le démarrage hors
   * ligne immédiat, et on ne va sur le réseau que si le cache est vide.
   */
  if (requete.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then((reponse) => reponse || fetch(requete)),
    )
    return
  }

  // Les polices Google sont immuables et servies depuis un autre domaine :
  // on répond depuis le cache et on rafraîchit en arrière-plan. Une réponse
  // opaque (requête inter-domaines) est mise en cache telle quelle.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const enCache = await cache.match(requete)
        const reseau = fetch(requete)
          .then((reponse) => {
            if (reponse.ok || reponse.type === 'opaque') cache.put(requete, reponse.clone())
            return reponse
          })
          .catch(() => enCache)
        return enCache || reseau
      }),
    )
    return
  }

  // Hors de notre origine, on ne s'interpose pas.
  if (url.origin !== self.location.origin) return

  /*
   * Ressources de l'application. Le nom porte une empreinte : le contenu ne
   * change jamais sous un même nom, le cache fait donc autorité. Ce qui n'y
   * est pas est récupéré puis conservé, pour que le prochain démarrage hors
   * ligne en dispose.
   */
  event.respondWith(
    caches.match(requete).then(
      (reponse) =>
        reponse ||
        fetch(requete).then((reseau) => {
          if (reseau.ok && reseau.type === 'basic') {
            const copie = reseau.clone()
            caches.open(CACHE).then((cache) => cache.put(requete, copie))
          }
          return reseau
        }),
    ),
  )
})
`

writeFileSync(join(racine, 'sw.js'), source)
console.log(`sw.js — version ${version}, ${precache.length} fichiers préchargés`)
