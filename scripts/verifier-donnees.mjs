/**
 * Contrôle de cohérence du jeu de démonstration.
 *
 * Les données de `src/data/mock.ts` sont lues par plusieurs écrans qui en
 * dérivent chacun leurs propres chiffres : l'Accueil recalcule les soldes à
 * partir des lignes mensuelles, l'écran Objectifs lit les poches d'épargne, le
 * Jardin lit l'XP. Une incohérence entre ces sources ne casse rien — elle
 * affiche simplement deux montants différents pour la même chose, ce qui ne se
 * voit qu'à la lecture attentive d'une capture.
 *
 * Ce script relit donc le jeu de données avec les vraies fonctions du domaine
 * et vérifie les liens qu'aucun type ne peut exprimer. Il passe par le
 * chargeur de Vite : les modules sont en TypeScript et utilisent des imports
 * sans extension, que Node ne sait pas résoudre seul.
 */
import { createServer } from 'vite'

const vite = await createServer({ server: { middlewareMode: true }, logLevel: 'error' })

const mock = await vite.ssrLoadModule('/src/data/mock.ts')
const { CATEGORY_BY_ID } = await vite.ssrLoadModule('/src/domain/categories.ts')
const { summarize, pocketBalance } = await vite.ssrLoadModule('/src/domain/budget.ts')
const { levelFromXp, stageForLevel } = await vite.ssrLoadModule('/src/domain/gamification.ts')
const { BADGE_BY_ID, CHALLENGE_BY_ID } = await vite.ssrLoadModule('/src/domain/challenges.ts')
const { STRATEGIES } = await vite.ssrLoadModule('/src/domain/strategy.ts')

const erreurs = []
const moisRouges = []
const dire = []
const verifier = (condition, message) => {
  if (!condition) erreurs.push(message)
}

const {
  MOCK_BUDGETS, MOCK_POCKETS, MOCK_GOALS, MOCK_PROFILE,
  MOCK_UNLOCKED, MOCK_CHALLENGE_PROGRESS, MOCK_ADMIN_USERS, MOCK_AUDIT_LOG,
} = mock

// --- Les catégories saisies existent bien au catalogue -----------------------
for (const budget of MOCK_BUDGETS) {
  for (const line of budget.lines) {
    verifier(
      CATEGORY_BY_ID[line.categoryId],
      `${budget.month} : catégorie inconnue « ${line.categoryId} »`,
    )
  }
}

// --- Les mois se tiennent ----------------------------------------------------
for (const budget of MOCK_BUDGETS) {
  const s = summarize(budget, budget.month)
  verifier(s.totals.income > 0, `${budget.month} : aucun revenu saisi`)
  // Un mois dans le rouge est un cas que l'app doit savoir raconter ; une
  // dérive de plusieurs centaines d'euros est en revanche une erreur de saisie.
  verifier(
    s.endOfMonth >= -300,
    `${budget.month} : le mois se termine à ${Math.round(s.endOfMonth)} €, bien trop bas`,
  )
  if (budget.closed && s.endOfMonth < 0) moisRouges.push(budget.month)
  dire.push(
    `${budget.month}  revenu ${String(Math.round(s.totals.income)).padStart(4)} €` +
      `  reste à vivre ${String(Math.round(s.livingAllowance)).padStart(4)} €` +
      `  fin de mois ${String(Math.round(s.endOfMonth)).padStart(4)} €` +
      `  épargne ${String(Math.round(s.savingRate * 100)).padStart(2)} %` +
      `  charges ${Math.round(s.fixedRate * 100)} %`,
  )
}

verifier(
  moisRouges.length <= 1,
  `mois clôturés dans le rouge : ${moisRouges.join(', ')} — la trajectoire devient illisible`,
)

// --- Poches d'épargne -------------------------------------------------------
// Le solde dérive des lignes de saisie : il reste à vérifier que chaque poche
// a bien sa catégorie au catalogue (convention `pocket_x` ↔ `sav_x`).
for (const pocket of MOCK_POCKETS) {
  const categoryId = pocket.id.replace(/^pocket_/, 'sav_')
  verifier(CATEGORY_BY_ID[categoryId], `${pocket.id} : pas de catégorie « ${categoryId} »`)
}

// Aucune ligne d'épargne ne doit viser une poche qui n'existe pas.
const pochesConnues = new Set(MOCK_POCKETS.map((p) => p.id.replace(/^pocket_/, 'sav_')))
for (const budget of MOCK_BUDGETS) {
  for (const line of budget.lines) {
    if (CATEGORY_BY_ID[line.categoryId]?.flow !== 'saving') continue
    verifier(
      pochesConnues.has(line.categoryId),
      `${budget.month} : ${line.categoryId} n'a pas de poche d'épargne correspondante`,
    )
  }
}

// --- Objectifs contre poches -------------------------------------------------
for (const goal of MOCK_GOALS) {
  const pocket = MOCK_POCKETS.find((p) => p.id === goal.pocketId)
  verifier(pocket, `${goal.id} : poche « ${goal.pocketId} » introuvable`)
  if (!pocket) continue

  const solde = pocketBalance(pocket, MOCK_BUDGETS)
  verifier(solde > 0, `${goal.id} : la poche « ${pocket.id} » n'a reçu aucun versement`)
  verifier(
    goal.targetAmount === pocket.target,
    `${goal.id} : cible ${goal.targetAmount} € contre ${pocket.target} € sur la poche`,
  )
}

// --- Profil : niveau, palier, stratégie, badges ------------------------------
const niveau = levelFromXp(MOCK_PROFILE.xp)
const palier = stageForLevel(niveau.level)
dire.push(
  `profil    ${MOCK_PROFILE.xp} XP → niveau ${niveau.level} (${palier.label}), ` +
    `${niveau.xpInLevel} / ${niveau.xpForLevel} dans le niveau`,
)

verifier(STRATEGIES[MOCK_GOALS[0].kind], 'objectif principal : famille inconnue')
verifier(
  Object.values(STRATEGIES).some((s) => s.id === MOCK_PROFILE.strategyId),
  `profil : stratégie « ${MOCK_PROFILE.strategyId} » inconnue`,
)
verifier(
  MOCK_PROFILE.streak.current <= MOCK_PROFILE.streak.best,
  'profil : la série en cours dépasse le record',
)

for (const badge of MOCK_UNLOCKED) {
  verifier(BADGE_BY_ID[badge.badgeId], `badge inconnu « ${badge.badgeId} »`)
}
for (const suivi of MOCK_CHALLENGE_PROGRESS) {
  verifier(CHALLENGE_BY_ID[suivi.challengeId], `défi inconnu « ${suivi.challengeId} »`)
}

// --- Étiquettes et social ----------------------------------------------------
const { MOCK_TAGS, MOCK_FRIENDS, MOCK_DIRECTORY, MOCK_GROUPS } = mock
const tagsConnus = new Set(MOCK_TAGS.map((t) => t.id))
for (const budget of MOCK_BUDGETS) {
  for (const line of budget.lines) {
    for (const tagId of line.tagIds ?? []) {
      verifier(tagsConnus.has(tagId), `${budget.month} / ${line.categoryId} : étiquette inconnue « ${tagId} »`)
    }
  }
}

const pseudos = [
  MOCK_PROFILE.pseudo,
  ...MOCK_FRIENDS.map((f) => f.pseudo),
  ...MOCK_DIRECTORY.map((f) => f.pseudo),
]
verifier(new Set(pseudos).size === pseudos.length, 'social : des pseudos ne sont pas uniques')

for (const groupe of MOCK_GROUPS) {
  verifier(
    groupe.members.filter((m) => m.role === 'admin').length === 1,
    `${groupe.id} : il faut exactement un administrateur`,
  )
  verifier(
    groupe.members.some((m) => m.id === MOCK_PROFILE.id),
    `${groupe.id} : le profil de démonstration doit être membre`,
  )
  const verse = groupe.members.reduce(
    (sum, m) => sum + Object.values(m.contributions).reduce((s, v) => s + v, 0),
    0,
  )
  verifier(verse <= groupe.targetAmount, `${groupe.id} : ${verse} € versés pour ${groupe.targetAmount} € visés`)
  dire.push(`groupe    ${groupe.name} : ${verse} € / ${groupe.targetAmount} €, ${groupe.members.length} membres`)
}

// --- Console d'administration ------------------------------------------------
const moi = MOCK_ADMIN_USERS.find((u) => u.id === MOCK_PROFILE.id)
verifier(moi, "console : le profil connecté ne figure pas dans la liste des comptes")
if (moi) {
  verifier(moi.name === MOCK_PROFILE.displayName, 'console : le nom diffère du profil')
  verifier(moi.email === MOCK_PROFILE.email, "console : l'adresse diffère du profil")
  verifier(moi.role === MOCK_PROFILE.role, 'console : le rôle diffère du profil')
  verifier(moi.level === niveau.level, `console : niveau ${moi.level} annoncé contre ${niveau.level} calculé`)
  const clos = MOCK_BUDGETS.filter((b) => b.closed).length
  verifier(moi.months === clos, `console : ${moi.months} mois annoncés contre ${clos} mois clôturés`)
}

const comptes = new Set(MOCK_ADMIN_USERS.map((u) => u.email))
for (const entree of MOCK_AUDIT_LOG) {
  if (!entree.target.includes('@')) continue
  verifier(comptes.has(entree.target), `journal : « ${entree.target} » n'est pas un compte connu`)
}

await vite.close()

console.log(dire.join('\n'))
if (erreurs.length > 0) {
  console.error(`\nINCOHÉRENCES (${erreurs.length}) :`)
  for (const erreur of erreurs) console.error(' -', erreur)
  process.exit(1)
}
console.log('\nJeu de démonstration cohérent.')
