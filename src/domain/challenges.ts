import type { Badge, Challenge, MonthBudget, MonthKey, SavingsPocket, Goal } from './types'
import { lineKey } from './types'
import { CATEGORY_BY_ID } from './categories'
import { pocketBalance, summarize } from './budget'

/**
 * Catalogue des quêtes.
 *
 * Règle unique, et sans exception : **une quête se mesure sur ce que
 * l'utilisateur a saisi**. Aucune ne se coche à la main, aucune ne demande de
 * jurer qu'on a cuisiné plutôt que commandé — l'application n'a aucun moyen de
 * le savoir, et une case cochée sur l'honneur ne récompense que la bonne foi.
 *
 * Cela écarte les défis quotidiens et hebdomadaires : la saisie est mensuelle,
 * elle ne peut rien dire d'une journée. Restent trois rythmes — ce qui se joue
 * une fois, ce qui se rejoue chaque mois, ce qui se compte sur l'année.
 */
export const CHALLENGES: Challenge[] = [
  /* --------------------------- Une fois, au début -------------------------- */
  {
    id: 'u_first_income',
    title: 'Dire ce qui rentre',
    description: 'Saisir un premier revenu. Sans lui, aucun pourcentage n’a de sens.',
    cadence: 'unique',
    difficulty: 'douce',
    xp: 40,
    icon: 'Wallet',
    tone: 'mint',
    target: 1,
    unit: 'revenu',
  },
  {
    id: 'u_first_fixed',
    title: 'Poser ses charges',
    description: 'Saisir trois charges fixes : loyer, énergie, abonnements. Le socle du mois.',
    cadence: 'unique',
    difficulty: 'douce',
    xp: 60,
    icon: 'House',
    tone: 'indigo',
    target: 3,
    unit: 'charges',
  },
  {
    id: 'u_first_close',
    title: 'Clore un premier mois',
    description: 'Arrêter les comptes d’un mois. C’est ce qui ouvre le bilan et le jardin.',
    cadence: 'unique',
    difficulty: 'moyenne',
    xp: 120,
    icon: 'CalendarCheck',
    tone: 'brand',
    target: 1,
    unit: 'mois',
  },
  {
    id: 'u_first_saving',
    title: 'Le premier euro de côté',
    description: 'Saisir un versement d’épargne, même modeste. Le montant importe moins que le geste.',
    cadence: 'unique',
    difficulty: 'douce',
    xp: 80,
    icon: 'PiggyBank',
    tone: 'amber',
    target: 1,
    unit: 'versement',
  },

  /* ------------------------------ Chaque mois ------------------------------ */
  {
    id: 'm_complete',
    title: 'Mois complet',
    description: 'Renseigner revenus et charges fixes du mois. La base de tout le reste.',
    cadence: 'monthly',
    difficulty: 'douce',
    xp: 50,
    icon: 'PenLine',
    tone: 'mint',
    target: 1,
    unit: 'mois',
  },
  {
    id: 'm_close',
    title: 'Clôturer le mois',
    description: 'Arrêter les comptes et déclarer son ressenti. Le geste qui fait avancer l’année.',
    cadence: 'monthly',
    difficulty: 'moyenne',
    xp: 100,
    icon: 'CalendarCheck',
    tone: 'brand',
    target: 1,
    unit: 'clôture',
  },
  {
    id: 'm_save_10',
    title: 'Le dixième sacré',
    description: 'Mettre de côté au moins 10 % de ce qui est entré ce mois-ci.',
    cadence: 'monthly',
    difficulty: 'moyenne',
    xp: 120,
    icon: 'PiggyBank',
    tone: 'amber',
    target: 10,
    unit: '% du revenu',
    suitedTo: ['emergency', 'travel', 'home', 'retirement', 'freedom'],
  },
  {
    id: 'm_positive',
    title: 'Finir dans le vert',
    description: 'Terminer le mois avec un reste positif : tout n’a pas été dépensé.',
    cadence: 'monthly',
    difficulty: 'moyenne',
    xp: 110,
    icon: 'TrendingUp',
    tone: 'mint',
    target: 1,
    unit: 'mois',
  },
  {
    id: 'm_fixed_50',
    title: 'Charges sous la barre',
    description: 'Garder les charges contraintes sous la moitié du revenu, le repère habituel.',
    cadence: 'monthly',
    difficulty: 'costaude',
    xp: 130,
    icon: 'Scale',
    tone: 'indigo',
    target: 50,
    unit: '% du revenu',
  },
  {
    id: 'm_discret_20',
    title: 'Envies tenues',
    description: 'Contenir les dépenses non essentielles sous un cinquième du revenu.',
    cadence: 'monthly',
    difficulty: 'costaude',
    xp: 130,
    icon: 'ShoppingBag',
    tone: 'orchid',
    target: 20,
    unit: '% du revenu',
  },
  {
    id: 'm_all_paid',
    title: 'Tout est réglé',
    description: 'Pointer chaque charge fixe du mois comme payée. Aucun oubli, aucun frais.',
    cadence: 'monthly',
    difficulty: 'moyenne',
    xp: 90,
    icon: 'CheckCircle2',
    tone: 'mint',
    target: 100,
    unit: '% pointé',
  },
  {
    id: 'm_debt_down',
    title: 'Coup de rabot',
    description: 'Consacrer une part au remboursement des dettes ce mois-ci.',
    cadence: 'monthly',
    difficulty: 'costaude',
    xp: 140,
    icon: 'TrendingDown',
    tone: 'berry',
    target: 1,
    unit: 'remboursement',
    suitedTo: ['debt_exit'],
  },
  {
    id: 'm_documented',
    title: 'Mois documenté',
    description: 'Annoter ou étiqueter trois lignes. Dans six mois, vous saurez encore pourquoi.',
    cadence: 'monthly',
    difficulty: 'douce',
    xp: 70,
    icon: 'Tag',
    tone: 'orchid',
    target: 3,
    unit: 'lignes',
  },

  /* ------------------------------ Sur l'année ------------------------------ */
  {
    id: 'y_3_closed',
    title: 'Un trimestre au compteur',
    description: 'Clôturer trois mois dans l’année. La tendance commence à se lire.',
    cadence: 'yearly',
    difficulty: 'moyenne',
    xp: 200,
    icon: 'CalendarRange',
    tone: 'indigo',
    target: 3,
    unit: 'mois clôturés',
  },
  {
    id: 'y_12_closed',
    title: 'Douze mois au compteur',
    description: 'Une année entière arrêtée, mois après mois. Peu de gens y arrivent.',
    cadence: 'yearly',
    difficulty: 'héroïque',
    xp: 600,
    icon: 'Trophy',
    tone: 'amber',
    target: 12,
    unit: 'mois clôturés',
  },
  {
    id: 'y_save_15',
    title: 'Année en terrain sec',
    description: 'Tenir 15 % d’épargne en moyenne sur les mois clôturés de l’année.',
    cadence: 'yearly',
    difficulty: 'héroïque',
    xp: 500,
    icon: 'Gem',
    tone: 'mint',
    target: 15,
    unit: '% moyens',
  },
  {
    id: 'y_goal',
    title: 'Objectif atteint',
    description: 'Amener une poche d’épargne jusqu’à sa cible. Le but de tout l’édifice.',
    cadence: 'yearly',
    difficulty: 'héroïque',
    xp: 700,
    icon: 'Target',
    tone: 'brand',
    target: 1,
    unit: 'objectif',
  },
]

/* ------------------------------- Mesures ---------------------------------- */

export interface ContexteMesure {
  budgets: MonthBudget[]
  month: MonthKey
  pockets: SavingsPocket[]
  goals: Goal[]
  /** Catégories déclarées « plus d'actualité », et depuis quel mois. */
  retired?: Record<string, MonthKey>
}

/** Lignes non nulles d'un mois, par flux. */
function lignes(budget: MonthBudget | undefined, flow: string) {
  return (budget?.lines ?? []).filter(
    (line) => line.amount > 0 && CATEGORY_BY_ID[line.categoryId]?.flow === flow,
  )
}

/** Part, en pourcentage, d'un total rapporté au revenu. */
function part(valeur: number, revenu: number): number {
  return revenu > 0 ? Math.round((valeur / revenu) * 100) : 0
}

/**
 * Avancement mesuré d'une quête, dans l'unité de sa cible.
 *
 * La valeur retournée se compare à `challenge.target`. Pour les quêtes dont la
 * réussite consiste à rester *sous* un seuil — charges, envies — la mesure est
 * inversée à l'affichage par `estReussie`, qui reste la seule autorité sur
 * « c'est gagné ».
 */
export function mesurer(challenge: Challenge, ctx: ContexteMesure): number {
  const budget = ctx.budgets.find((b) => b.month === ctx.month)
  const resume = summarize(budget, ctx.month)
  const annee = ctx.month.slice(0, 4)
  const moisDeLAnnee = ctx.budgets.filter((b) => b.month.startsWith(annee))
  const clotures = moisDeLAnnee.filter((b) => b.closed)

  switch (challenge.id) {
    case 'u_first_income':
      return ctx.budgets.some((b) => lignes(b, 'income').length > 0) ? 1 : 0
    case 'u_first_fixed':
      return Math.max(0, ...ctx.budgets.map((b) => lignes(b, 'fixed').length))
    case 'u_first_close':
      return ctx.budgets.some((b) => b.closed) ? 1 : 0
    case 'u_first_saving':
      return ctx.budgets.some((b) => lignes(b, 'saving').length > 0) ? 1 : 0

    case 'm_complete':
      return lignes(budget, 'income').length > 0 && lignes(budget, 'fixed').length > 0 ? 1 : 0
    case 'm_close':
      return budget?.closed ? 1 : 0
    case 'm_save_10':
      return part(resume.totals.saving, resume.totals.income)
    case 'm_positive':
      return resume.totals.income > 0 && resume.endOfMonth >= 0 ? 1 : 0
    case 'm_fixed_50':
      return part(resume.totals.fixed, resume.totals.income)
    case 'm_discret_20':
      return part(resume.totals.discretionary, resume.totals.income)
    case 'm_all_paid': {
      const fixes = lignes(budget, 'fixed')
      if (fixes.length === 0) return 0
      return Math.round((fixes.filter((l) => l.paid).length / fixes.length) * 100)
    }
    case 'm_debt_down':
      return resume.totals.debt > 0 ? 1 : 0
    case 'm_documented':
      return (budget?.lines ?? []).filter((l) => l.note?.trim() || (l.tagIds?.length ?? 0) > 0).length

    case 'y_3_closed':
    case 'y_12_closed':
      return clotures.length
    case 'y_save_15': {
      if (clotures.length === 0) return 0
      const parts = clotures.map((b) => {
        const r = summarize(b, b.month)
        return part(r.totals.saving, r.totals.income)
      })
      return Math.round(parts.reduce((a, b) => a + b, 0) / parts.length)
    }
    case 'y_goal':
      return ctx.goals.some((goal) => {
        const poche = goal.pocketId ? ctx.pockets.find((p) => p.id === goal.pocketId) : undefined
        if (!poche) return false
        return pocketBalance(poche, ctx.budgets) >= goal.targetAmount
      })
        ? 1
        : 0

    default:
      return 0
  }
}

/** Quêtes réussies en restant *sous* leur cible, et non en l'atteignant. */
const SOUS_LE_SEUIL = new Set(['m_fixed_50', 'm_discret_20'])

/**
 * Une quête est-elle gagnée ?
 *
 * Les quêtes « sous le seuil » demandent en plus qu'un revenu existe : sans
 * revenu, la part vaut zéro et la quête serait offerte à un mois vide.
 */
export function estReussie(challenge: Challenge, valeur: number, ctx: ContexteMesure): boolean {
  if (!SOUS_LE_SEUIL.has(challenge.id)) return valeur >= challenge.target
  const budget = ctx.budgets.find((b) => b.month === ctx.month)
  const resume = summarize(budget, ctx.month)
  return resume.totals.income > 0 && valeur <= challenge.target
}

/** Avancement de 0 à 1, pour la barre de progression. */
export function avancement(challenge: Challenge, valeur: number, ctx: ContexteMesure): number {
  if (estReussie(challenge, valeur, ctx)) return 1
  if (SOUS_LE_SEUIL.has(challenge.id)) {
    // Au-dessus du seuil : d'autant plus loin du but qu'on le dépasse.
    return valeur > 0 ? Math.max(0, Math.min(1, challenge.target / valeur)) : 0
  }
  return Math.max(0, Math.min(1, valeur / challenge.target))
}

/** Lignes en double dans un mois : deux fois la même catégorie sans intitulé. */
export function lignesAmbigues(budget: MonthBudget | undefined): string[] {
  const vues = new Map<string, number>()
  for (const line of budget?.lines ?? []) {
    const cle = line.label?.trim() || CATEGORY_BY_ID[line.categoryId]?.label || lineKey(line)
    vues.set(cle, (vues.get(cle) ?? 0) + 1)
  }
  return [...vues.entries()].filter(([, n]) => n > 1).map(([cle]) => cle)
}

export const BADGES: Badge[] = [
  {
    id: 'first_step',
    label: 'Premier pas',
    description: 'Vous avez saisi votre premier mois. Tout commence là.',
    criteria: 'Saisir un premier mois',
    rarity: 'commun',
    icon: 'Footprints',
    tone: 'mint',
    xp: 50,
  },
  {
    id: 'streak_7',
    label: 'Sept jours',
    description: 'Une semaine de suivi sans interruption.',
    criteria: '7 jours de série',
    rarity: 'commun',
    icon: 'Flame',
    tone: 'berry',
    xp: 80,
  },
  {
    id: 'streak_30',
    label: 'Le mois entier',
    description: 'Trente jours de suivi consécutifs. L’habitude est prise.',
    criteria: '30 jours de série',
    rarity: 'rare',
    icon: 'CalendarCheck',
    tone: 'berry',
    xp: 250,
  },
  {
    id: 'streak_100',
    label: 'Cent jours',
    description: 'Cent jours d’affilée. Peu de gens vont jusque-là.',
    criteria: '100 jours de série',
    rarity: 'épique',
    icon: 'Hourglass',
    tone: 'amber',
    xp: 700,
  },
  {
    id: 'streak_365',
    label: 'Une année pleine',
    description: 'Trois cent soixante-cinq jours. Vous ne subissez plus votre budget.',
    criteria: '365 jours de série',
    rarity: 'légendaire',
    icon: 'Crown',
    tone: 'amber',
    xp: 2500,
  },
  {
    id: 'green_month',
    label: 'Mois dans le vert',
    description: 'Un mois clôturé avec un solde positif.',
    criteria: 'Clôturer un mois avec un reste positif',
    rarity: 'commun',
    icon: 'Leaf',
    tone: 'mint',
    xp: 120,
  },
  {
    id: 'phoenix',
    label: 'Phénix',
    description: 'Repasser dans le vert après un mois à découvert.',
    criteria: 'Un mois positif juste après un mois négatif',
    rarity: 'rare',
    icon: 'Bird',
    tone: 'berry',
    xp: 400,
  },
  {
    id: 'all_paid_3',
    label: 'Rien d’oublié',
    description: 'Trois mois où chaque charge fixe a été pointée comme payée.',
    criteria: '3 mois avec toutes les charges pointées',
    rarity: 'rare',
    icon: 'Landmark',
    tone: 'indigo',
    xp: 450,
  },
  {
    id: 'sub_slayer',
    label: 'Élagueur',
    description: 'Trois abonnements résiliés. Autant de charges fixes en moins, chaque mois.',
    criteria: 'Résilier 3 abonnements',
    rarity: 'rare',
    icon: 'Scissors',
    tone: 'orchid',
    xp: 380,
  },
  {
    id: 'saver_10',
    label: 'Dixième tenu',
    description: 'Trois mois consécutifs à plus de 10 % d’épargne.',
    criteria: '3 mois à 10 % d’épargne',
    rarity: 'rare',
    icon: 'PiggyBank',
    tone: 'amber',
    xp: 500,
  },
  {
    id: 'saver_20',
    label: 'Cinquième tenu',
    description: 'Six mois consécutifs à plus de 20 % d’épargne.',
    criteria: '6 mois à 20 % d’épargne',
    rarity: 'épique',
    icon: 'Gem',
    tone: 'amber',
    xp: 1200,
  },
  {
    id: 'emergency_1m',
    label: 'Premier matelas',
    description: 'Un mois de charges couvert par le fonds d’urgence.',
    criteria: "1 mois de charges en fonds d'urgence",
    rarity: 'rare',
    icon: 'Umbrella',
    tone: 'mint',
    xp: 600,
  },
  {
    id: 'emergency_3m',
    label: 'Trois mois devant',
    description: 'Trois mois de charges couverts. Le seuil qui change la vie.',
    criteria: "3 mois de charges en fonds d'urgence",
    rarity: 'épique',
    icon: 'ShieldCheck',
    tone: 'mint',
    xp: 1500,
  },
  {
    id: 'emergency_6m',
    label: 'Six mois de sérénité',
    description: 'Six mois de charges de côté. Vous pouvez voir venir.',
    criteria: "6 mois de charges en fonds d'urgence",
    rarity: 'légendaire',
    icon: 'Mountain',
    tone: 'mint',
    xp: 3000,
  },
  {
    id: 'debt_zero',
    label: 'Table rase',
    description: 'Plus une seule dette en cours.',
    criteria: 'Solder toutes les dettes',
    rarity: 'légendaire',
    icon: 'Sparkles',
    tone: 'amber',
    xp: 2500,
  },
  {
    id: 'goal_first',
    label: 'Objectif atteint',
    description: 'Votre premier objectif mené jusqu’au bout.',
    criteria: 'Atteindre un objectif',
    rarity: 'rare',
    icon: 'Flag',
    tone: 'orchid',
    xp: 700,
  },
  {
    id: 'goal_5',
    label: 'Collectionneur de sommets',
    description: 'Cinq objectifs atteints. Vous savez viser et finir.',
    criteria: 'Atteindre 5 objectifs',
    rarity: 'épique',
    icon: 'Trophy',
    tone: 'amber',
    xp: 2000,
  },
  {
    id: 'month_12',
    label: 'Année complète',
    description: 'Douze mois clôturés. Vous avez une vraie photo de votre année.',
    criteria: 'Clôturer 12 mois',
    rarity: 'épique',
    icon: 'CalendarRange',
    tone: 'indigo',
    xp: 1400,
  },
  {
    id: 'documented_6',
    label: 'Mémoire longue',
    description: 'Six mois où au moins trois lignes portent une note ou une étiquette.',
    criteria: '6 mois documentés',
    rarity: 'commun',
    icon: 'ChefHat',
    tone: 'mint',
    xp: 150,
  },
]

/**
 * Badges décrochés, d'après les données.
 *
 * Ils étaient posés à la main dans le jeu de démonstration et ne se
 * débloquaient jamais autrement : aucun compte réel n'en aurait obtenu un.
 * Chaque critère se lit ici dans les mois saisis, la série, et les poches
 * d'épargne — rien de déclaratif.
 */
export function badgesAcquis(ctx: ContexteMesure, streakBest: number): string[] {
  const { budgets, pockets, goals } = ctx
  const clotures = budgets.filter((b) => b.closed)
  const resumes = clotures.map((b) => summarize(b, b.month))

  /** Nombre de mois où toutes les charges fixes sont pointées payées. */
  const moisPointes = clotures.filter((b) => {
    const fixes = lignes(b, 'fixed')
    return fixes.length > 0 && fixes.every((l) => l.paid)
  }).length

  const moisDocumentes = budgets.filter(
    (b) => b.lines.filter((l) => l.note?.trim() || (l.tagIds?.length ?? 0) > 0).length >= 3,
  ).length

  /** Épargne totale disponible, toutes poches confondues. */
  const epargne = pockets.reduce((total, poche) => total + pocketBalance(poche, budgets), 0)
  /** Charges d'un mois type, pour exprimer le matelas en mois de dépenses. */
  const chargeType =
    resumes.length > 0
      ? resumes.reduce((t, r) => t + r.totals.fixed + r.totals.debt, 0) / resumes.length
      : 0
  const moisDeMatelas = chargeType > 0 ? epargne / chargeType : 0

  const objectifsAtteints = goals.filter((goal) => {
    const poche = goal.pocketId ? pockets.find((p) => p.id === goal.pocketId) : undefined
    return poche ? pocketBalance(poche, budgets) >= goal.targetAmount : false
  }).length

  /*
   * Phénix : un mois terminé dans le rouge, puis le suivant dans le vert.
   * Les mois sont triés par clé, qui est chronologique par construction.
   */
  const ordonnes = [...resumes].sort((a, b) => a.month.localeCompare(b.month))
  const phenix = ordonnes.some(
    (r, index) => index > 0 && ordonnes[index - 1].endOfMonth < 0 && r.endOfMonth >= 0,
  )

  const tauxEpargne = (r: (typeof resumes)[number]) =>
    r.totals.income > 0 ? r.totals.saving / r.totals.income : 0

  const conditions: Record<string, boolean> = {
    first_step: budgets.some((b) => b.lines.some((l) => l.amount > 0)),
    streak_7: streakBest >= 7,
    streak_30: streakBest >= 30,
    streak_100: streakBest >= 100,
    streak_365: streakBest >= 365,
    green_month: resumes.some((r) => r.endOfMonth >= 0),
    phoenix: phenix,
    all_paid_3: moisPointes >= 3,
    // Résilier, dans l'application, c'est retirer une charge de la saisie :
    // c'est exactement ce que consigne `retired`.
    sub_slayer: Object.keys(ctx.retired ?? {}).length >= 3,
    saver_10: resumes.some((r) => tauxEpargne(r) >= 0.1),
    saver_20: resumes.some((r) => tauxEpargne(r) >= 0.2),
    emergency_1m: moisDeMatelas >= 1,
    emergency_3m: moisDeMatelas >= 3,
    emergency_6m: moisDeMatelas >= 6,
    debt_zero: clotures.length > 0 && resumes.every((r) => r.totals.debt === 0),
    goal_first: objectifsAtteints >= 1,
    goal_5: objectifsAtteints >= 5,
    month_12: clotures.length >= 12,
    documented_6: moisDocumentes >= 6,
  }

  return BADGES.filter((badge) => conditions[badge.id]).map((badge) => badge.id)
}

export const BADGE_BY_ID: Record<string, Badge> = Object.fromEntries(BADGES.map((b) => [b.id, b]))
