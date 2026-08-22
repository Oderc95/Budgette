/**
 * Test de fumée : charge le prototype, parcourt chaque écran, et échoue si la
 * console remonte la moindre erreur. Produit aussi des captures d'écran.
 */
import { chromium } from 'playwright'
import { mkdirSync, readFileSync, existsSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'

const OUT = 'screenshots'
mkdirSync(OUT, { recursive: true })

// Les modules ES sont bloqués sur `file://` : on sert `dist/` en HTTP local.
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' }
const server = createServer((request, response) => {
  const path = normalize(decodeURIComponent(new URL(request.url, 'http://x').pathname))
  const target = join('dist', path === '/' ? 'index.html' : path)
  if (!existsSync(target)) {
    response.writeHead(404).end()
    return
  }
  response.writeHead(200, { 'content-type': TYPES[extname(target)] ?? 'application/octet-stream' })
  response.end(readFileSync(target))
})
await new Promise((done) => server.listen(4173, done))
const file = 'http://localhost:4173/'
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const errors = []

async function shoot(page, name, width, height) {
  await page.setViewportSize({ width, height })
  await page.waitForTimeout(900)
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: height > 1000 })
}

for (const theme of ['light', 'dark']) {
  const context = await browser.newContext({ colorScheme: theme, locale: 'fr-FR' })
  const page = await context.newPage()

  // L'environnement de test est hors ligne : les requêtes externes (polices)
  // reçoivent une réponse vide, plutôt que d'échouer et de polluer la console.
  await page.route('**/*', (route) => {
    const url = route.request().url()
    if (url.startsWith('http://localhost:4173')) return route.continue()
    return route.fulfill({ status: 200, contentType: 'text/css', body: '' })
  })

  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`[${theme}] console: ${message.text()}`)
  })
  page.on('pageerror', (error) => errors.push(`[${theme}] pageerror: ${error.message}`))

  await page.goto(file)
  await page.waitForSelector('text=Content de vous revoir', { timeout: 15000 })
  await shoot(page, `01-connexion-${theme}`, 1440, 900)

  await page.getByRole('button', { name: 'Se connecter' }).click()
  await page.waitForSelector('text=Où part mon argent', { timeout: 15000 })

  // La visite guidée accueille la première connexion : on la capture, on la
  // parcourt en entier (chaque étape doit s'afficher sans erreur), puis elle
  // ne doit plus jamais réapparaître dans la session.
  await page.waitForSelector('text=Ton accueil', { timeout: 15000 })
  await shoot(page, `12-tuto-${theme}`, 1440, 900)
  for (let etape = 0; etape < 4; etape += 1) {
    await page.getByRole('button', { name: 'Suivant' }).click()
    await page.waitForTimeout(350)
  }
  await page.getByRole('button', { name: 'C’est parti !' }).click()

  // La visite enchaîne sur la proposition d'objectif : on la capture puis on
  // la remet à plus tard pour continuer le parcours.
  await page.waitForSelector('text=Et maintenant, ton objectif', { timeout: 15000 })
  await shoot(page, `13-objectif-${theme}`, 1440, 900)
  await page.getByRole('button', { name: 'Plus tard' }).click()
  await page.waitForTimeout(400)

  await shoot(page, `02-accueil-${theme}`, 1440, 1800)

  const routes = [
    ['mois', '03-mon-mois'],
    ['annee', '14-mon-annee'],
    ['quetes', '04-quetes'],
    ['objectifs', '05-objectifs'],
    ['jardin', '06-jardin'],
    ['profil', '07-profil'],
    ['admin', '08-admin'],
  ]
  for (const [route, name] of routes) {
    await page.goto(`${file}#/${route}`)
    await page.waitForTimeout(700)
    await shoot(page, `${name}-${theme}`, 1440, 1800)
  }

  // Notification de récompense : on déclenche un défi puis on capture
  await page.goto(`${file}#/quetes`)
  await page.waitForTimeout(700)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.getByText('Journée sans dépense').first().click()
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${OUT}/10-notification-${theme}.png` })

  // Vue mobile
  await page.goto(`${file}#/`)
  await shoot(page, `09-mobile-${theme}`, 414, 1400)

  /*
    Contrôle du responsive.

    On mesure, écran par écran et largeur par largeur, ce qui dépasse le bord
    droit. Le débordement horizontal est le symptôme d'une grille ou d'une
    largeur fixe oubliée, et il ne se voit pas sur une capture : `body` porte
    `overflow-x: hidden`, qui masque le problème au lieu de le corriger.

    Les conteneurs qui défilent horizontalement à dessein — un tableau large,
    une rangée d'onglets — sont exclus en remontant les ancêtres. La remontée
    s'arrête à `body` : son `overflow-x` est précisément le filet de sécurité
    dont on veut vérifier qu'il ne sert pas.
  */
  const mesurerDebord = () =>
    page.evaluate(() => {
      const limite = document.documentElement.clientWidth
      const estClippe = (element) => {
        for (let p = element.parentElement; p && p !== document.body; p = p.parentElement) {
          const overflow = getComputedStyle(p).overflowX
          if (overflow === 'auto' || overflow === 'scroll' || overflow === 'hidden') return true
        }
        return false
      }

      let pire = 0
      for (const element of document.querySelectorAll('body *')) {
        const rect = element.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) continue
        const depassement = Math.round(rect.right - limite)
        if (depassement > pire && !estClippe(element)) pire = depassement
      }
      return pire
    })

  for (const width of [320, 360, 414]) {
    await page.setViewportSize({ width, height: 780 })
    for (const [route, name] of [['', 'accueil'], ...routes]) {
      await page.goto(`${file}#/${route}`)
      // La transition d'écran dure ~450 ms : mesurer pendant qu'elle glisse
      // compterait son décalage comme un débordement. Sous charge elle peut
      // durer davantage, donc une mesure positive n'est retenue que si elle
      // se confirme une fois l'écran posé.
      await page.waitForTimeout(800)
      let debord = await mesurerDebord()
      if (debord > 1) {
        await page.waitForTimeout(1200)
        debord = await mesurerDebord()
      }
      if (debord > 1) {
        errors.push(`[${theme}] ${name} déborde de ${debord} px à ${width} px de large`)
      }
    }
  }

  await page.goto(`${file}#/`)
  await shoot(page, `11-mobile-etroit-${theme}`, 320, 780)

  await context.close()
}

await browser.close()
server.close()

if (errors.length > 0) {
  console.error('ERREURS DÉTECTÉES :')
  for (const error of errors) console.error(' -', error)
  process.exit(1)
}
console.log('Aucune erreur console. Captures dans', OUT)
