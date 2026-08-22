import type {
  Friend,
  Goal,
  Group,
  MonthBudget,
  Profile,
  SavingsPocket,
  Tag,
  UnlockedBadge,
} from '../domain/types'

/**
 * Jeu de démonstration — entièrement fictif.
 *
 * Le profil est celui de Camille Roussel, 31 ans, graphiste salariée à Nantes,
 * seule en T2. Les ordres de grandeur sont ceux d'un salaire net de 2 480 €
 * porté à 2 560 € en juin, avec un loyer de 745 € : rien n'est repris d'un
 * relevé réel, et aucune donnée identifiante ne figure ici.
 *
 * Les huit mois racontent une trajectoire lisible, parce que c'est elle que
 * l'interface doit savoir montrer :
 *
 *   janvier   découvert hérité des fêtes, aucune épargne
 *   mars      dernier remboursement du découvert
 *   mai       430 € de soins dentaires : le mois qui fait mal
 *   juin      augmentation, et l'épargne passe la barre des 10 %
 *   juillet   vacances en Bretagne, et dernière mensualité du crédit conso
 *   août      premier mois sans aucune dette, en cours de saisie
 *
 * La cohérence de l'ensemble est vérifiée par `scripts/verifier-donnees.mjs` :
 * versements des poches contre lignes d'épargne des mois, avancement des
 * objectifs contre solde des poches, XP contre niveau et palier annoncés.
 */

type Row = Record<string, number>

const MONTHS: { month: string; closed: boolean; mood: 1 | 2 | 3 | 4 | 5; rows: Row }[] = [
  {
    // Découvert hérité des fêtes, régularisation d'électricité : le seul mois
    // qui se termine dans le rouge, et celui qui rend le suivant remarquable.
    month: '2026-01',
    closed: true,
    mood: 2,
    rows: {
      inc_salary: 2480,
      fix_housing: 745, fix_energy: 118, fix_water: 18, fix_internet: 31, fix_phone: 19,
      fix_transport: 39, fix_insurance_home: 14, fix_insurance_health: 42,
      fix_groceries: 362, fix_bank_fees: 9, fix_other: 60,
      debt_consumer: 96, debt_overdraft: 120,
      dis_restaurant: 168, dis_delivery: 122, dis_shopping: 209, dis_leisure: 76,
      dis_subscriptions: 59, dis_cash: 170, dis_other: 88,
    },
  },
  {
    month: '2026-02',
    closed: true,
    mood: 3,
    rows: {
      inc_salary: 2480,
      fix_housing: 745, fix_energy: 103, fix_water: 18, fix_internet: 31, fix_phone: 19,
      fix_transport: 39, fix_insurance_home: 14, fix_insurance_health: 42,
      fix_groceries: 342, fix_bank_fees: 6,
      debt_consumer: 96, debt_overdraft: 120,
      sav_emergency: 40,
      dis_restaurant: 152, dis_delivery: 103, dis_shopping: 126, dis_leisure: 68,
      dis_subscriptions: 47, dis_cash: 145, dis_gifts: 78, dis_other: 86,
    },
  },
  {
    // Dernier remboursement du découvert : le poste disparaît ensuite.
    month: '2026-03',
    closed: true,
    mood: 3,
    rows: {
      inc_salary: 2480, inc_refunds: 74,
      fix_housing: 745, fix_energy: 96, fix_water: 18, fix_internet: 31, fix_phone: 19,
      fix_transport: 39, fix_insurance_home: 14, fix_insurance_health: 42,
      fix_groceries: 330, fix_bank_fees: 2, fix_other: 66,
      debt_consumer: 96, debt_overdraft: 60,
      sav_emergency: 90,
      dis_restaurant: 136, dis_delivery: 87, dis_shopping: 85, dis_leisure: 66,
      dis_subscriptions: 39, dis_cash: 118, dis_travel: 150, dis_other: 92,
    },
  },
  {
    month: '2026-04',
    closed: true,
    mood: 4,
    rows: {
      inc_salary: 2480, inc_other: 220,
      fix_housing: 745, fix_energy: 71, fix_water: 18, fix_internet: 31, fix_phone: 19,
      fix_transport: 39, fix_insurance_home: 14, fix_insurance_health: 42,
      fix_groceries: 318, fix_other: 60,
      debt_consumer: 96,
      sav_emergency: 150, sav_home: 100,
      dis_restaurant: 130, dis_delivery: 66, dis_shopping: 104, dis_leisure: 75,
      dis_subscriptions: 31, dis_cash: 96, dis_travel: 100, dis_gifts: 95, dis_other: 90,
    },
  },
  {
    month: '2026-05',
    closed: true,
    mood: 2,
    rows: {
      inc_salary: 2480, inc_refunds: 118,
      fix_housing: 745, fix_energy: 74, fix_water: 18, fix_internet: 31, fix_phone: 19,
      fix_transport: 39, fix_insurance_home: 14, fix_insurance_health: 42,
      fix_groceries: 357,
      // 430 € de soins dentaires laissés à charge : l'épargne saute ce mois-ci.
      fix_other: 430,
      debt_consumer: 96,
      dis_restaurant: 118, dis_delivery: 77, dis_shopping: 58, dis_leisure: 54,
      dis_subscriptions: 41, dis_cash: 82, dis_travel: 120, dis_gifts: 55, dis_other: 88,
    },
  },
  {
    // Augmentation, et premier mois au-dessus de 10 % d'épargne.
    month: '2026-06',
    closed: true,
    mood: 4,
    rows: {
      inc_salary: 2560,
      fix_housing: 745, fix_energy: 58, fix_water: 18, fix_internet: 31, fix_phone: 19,
      fix_transport: 39, fix_insurance_home: 14, fix_insurance_health: 42,
      fix_groceries: 307,
      debt_consumer: 96,
      sav_emergency: 180, sav_home: 150,
      dis_restaurant: 124, dis_delivery: 58, dis_shopping: 83, dis_leisure: 90,
      dis_subscriptions: 24, dis_cash: 70, dis_travel: 100, dis_gifts: 50, dis_other: 82,
    },
  },
  {
    // Une semaine en Bretagne, et la dernière mensualité du crédit conso.
    month: '2026-07',
    closed: true,
    mood: 3,
    rows: {
      inc_salary: 2560, inc_refunds: 62,
      fix_housing: 745, fix_energy: 52, fix_water: 18, fix_internet: 31, fix_phone: 19,
      fix_transport: 39, fix_insurance_home: 14, fix_insurance_health: 42,
      fix_groceries: 268,
      debt_consumer: 96,
      sav_emergency: 100, sav_home: 100,
      dis_travel: 380, dis_restaurant: 152, dis_delivery: 64, dis_shopping: 88,
      dis_leisure: 92, dis_subscriptions: 24, dis_cash: 86, dis_gifts: 70, dis_other: 87,
    },
  },
  {
    // Mois en cours au 21 août : partiellement saisi, et sans aucune dette.
    // La marge encore disponible couvre les dix derniers jours du mois.
    month: '2026-08',
    closed: false,
    mood: 4,
    rows: {
      inc_salary: 2560,
      fix_housing: 745, fix_energy: 49, fix_water: 18, fix_internet: 31, fix_phone: 19,
      fix_transport: 39, fix_insurance_home: 14, fix_insurance_health: 42,
      fix_groceries: 280,
      sav_emergency: 200, sav_home: 160,
      dis_restaurant: 130, dis_delivery: 32, dis_shopping: 82, dis_leisure: 85,
      dis_subscriptions: 34, dis_cash: 45, dis_gifts: 35,
    },
  },
]

/** Étiquettes de Camille : des transversales qui croisent les catégories. */
export const MOCK_TAGS: Tag[] = [
  { id: 'tag_sante', label: 'Santé', tone: 'mint' },
  { id: 'tag_bretagne', label: 'Bretagne 2026', tone: 'indigo' },
  { id: 'tag_teletravail', label: 'Télétravail', tone: 'amber' },
]

/**
 * Retouches de lignes : étiquettes et dépenses ponctuelles. Les montants
 * restent dans MONTHS ; ici on ne pose que ce qui ne se somme pas.
 */
const LINE_DETAILS: Record<string, Record<string, { tagIds?: string[]; oneOff?: boolean; note?: string }>> = {
  '2026-05': {
    // Les soins dentaires : ponctuels par nature, et étiquetés Santé.
    fix_other: { oneOff: true, tagIds: ['tag_sante'], note: 'Couronne dentaire' },
  },
  '2026-07': {
    dis_travel: { oneOff: true, tagIds: ['tag_bretagne'], note: 'Location + train' },
    dis_restaurant: { tagIds: ['tag_bretagne'] },
  },
  '2026-08': {
    fix_internet: { tagIds: ['tag_teletravail'] },
  },
}

export const MOCK_BUDGETS: MonthBudget[] = MONTHS.map(({ month, closed, mood, rows }) => ({
  month,
  closed,
  closedAt: closed ? `${month}-28T20:00:00.000Z` : undefined,
  mood,
  lines: Object.entries(rows)
    .filter(([, amount]) => amount > 0)
    .map(([categoryId, amount]) => ({ categoryId, amount, ...LINE_DETAILS[month]?.[categoryId] })),
}))

/**
 * Poches d'épargne. Leur solde se calcule depuis les lignes `sav_*` des mois :
 * ce que Camille met de côté dans « Mon mois » EST le versement, il n'existe
 * aucun registre séparé qui pourrait diverger.
 */
export const MOCK_POCKETS: SavingsPocket[] = [
  {
    id: 'pocket_emergency',
    label: "Fonds d'urgence",
    icon: 'Umbrella',
    tone: 'mint',
    target: 3800,
    openingBalance: 0,
  },
  {
    id: 'pocket_home',
    label: 'Apport premier achat',
    icon: 'HousePlus',
    tone: 'indigo',
    target: 12000,
    openingBalance: 0,
  },
  {
    // Poche ouverte mais jamais alimentée : l'interface doit savoir le montrer.
    id: 'pocket_travel',
    label: 'Épargne voyages',
    icon: 'Plane',
    tone: 'orchid',
    target: 900,
    openingBalance: 0,
  },
]

export const MOCK_GOALS: Goal[] = [
  {
    id: 'goal_1',
    kind: 'emergency',
    label: 'Trois mois de charges devant moi',
    targetAmount: 3800,
    deadline: '2027-09',
    pocketId: 'pocket_emergency',
    createdAt: '2026-02-03T19:20:00.000Z',
  },
  {
    id: 'goal_2',
    kind: 'home',
    label: "Apport pour un premier appartement",
    targetAmount: 12000,
    deadline: '2029-06',
    pocketId: 'pocket_home',
    createdAt: '2026-04-06T21:05:00.000Z',
  },
]

export const MOCK_PROFILE: Profile = {
  id: 'usr_demo',
  pseudo: 'camille.r',
  displayName: 'Camille',
  email: 'camille@budgette.app',
  role: 'admin',
  createdAt: '2026-01-05T18:40:00.000Z',
  currency: 'EUR',
  // Les Fondations : construire l'apport sans entamer le fonds d'urgence.
  strategyId: 'fondations',
  xp: 10640,
  // La série s'est interrompue pendant les vacances de juillet, d'où un record
  // supérieur à la série en cours.
  streak: { current: 18, best: 34, lastCheckIn: '2026-08-21' },
  consents: {
    termsAcceptedAt: '2026-01-05T18:40:00.000Z',
    privacyAcceptedAt: '2026-01-05T18:40:00.000Z',
    analyticsOptIn: false,
  },
}

export const MOCK_UNLOCKED: UnlockedBadge[] = [
  { badgeId: 'first_step', unlockedAt: '2026-01-31T20:10:00.000Z' },
  { badgeId: 'streak_7', unlockedAt: '2026-02-09T08:05:00.000Z' },
  { badgeId: 'green_month', unlockedAt: '2026-02-28T21:30:00.000Z' },
  { badgeId: 'streak_30', unlockedAt: '2026-03-14T08:00:00.000Z' },
  { badgeId: 'sub_slayer', unlockedAt: '2026-06-12T22:15:00.000Z' },
  { badgeId: 'saver_10', unlockedAt: '2026-06-30T19:45:00.000Z' },
  { badgeId: 'debt_zero', unlockedAt: '2026-07-31T20:00:00.000Z' },
  { badgeId: 'frugal_week', unlockedAt: '2026-08-10T21:20:00.000Z' },
]

/** Défis déjà validés sur la période en cours, pour la démonstration. */
export const MOCK_CHALLENGE_PROGRESS = [
  { challengeId: 'd_log', period: '2026-08-21', value: 1, completed: true, completedAt: '2026-08-21T07:48:00.000Z' },
  { challengeId: 'd_home_meal', period: '2026-08-21', value: 1, completed: true, completedAt: '2026-08-21T12:55:00.000Z' },
  { challengeId: 'd_no_spend', period: '2026-08-21', value: 0, completed: false },
  { challengeId: 'd_no_cash', period: '2026-08-21', value: 1, completed: true, completedAt: '2026-08-21T08:30:00.000Z' },
  { challengeId: 'd_round_up', period: '2026-08-21', value: 0, completed: false },
  { challengeId: 'd_cart_pause', period: '2026-08-21', value: 0, completed: false },
  { challengeId: 'w_no_delivery', period: '2026-W34', value: 6, completed: false },
  { challengeId: 'w_three_no_spend', period: '2026-W34', value: 2, completed: false },
  { challengeId: 'w_review', period: '2026-W34', value: 1, completed: true, completedAt: '2026-08-17T20:40:00.000Z' },
  { challengeId: 'w_grocery_budget', period: '2026-W34', value: 1, completed: true, completedAt: '2026-08-19T18:25:00.000Z' },
  { challengeId: 'w_cash_only', period: '2026-W34', value: 0, completed: false },
  { challengeId: 'w_sell', period: '2026-W34', value: 0, completed: false },
  { challengeId: 'm_no_atm', period: '2026-08', value: 1, completed: false },
  { challengeId: 'm_save_10', period: '2026-08', value: 14.1, completed: true, completedAt: '2026-08-04T07:15:00.000Z' },
  { challengeId: 'm_close', period: '2026-08', value: 0, completed: false },
  { challengeId: 'm_sub_audit', period: '2026-08', value: 1, completed: true, completedAt: '2026-08-06T21:10:00.000Z' },
  { challengeId: 'm_under_budget', period: '2026-08', value: 0, completed: false },
  { challengeId: 'm_no_overdraft', period: '2026-08', value: 1, completed: false },
  { challengeId: 'm_extra_debt', period: '2026-08', value: 0, completed: false },
  { challengeId: 'y_12_closed', period: '2026', value: 7, completed: false },
  { challengeId: 'y_emergency_1m', period: '2026', value: 0.61, completed: false },
  { challengeId: 'y_save_15', period: '2026', value: 8.3, completed: false },
  { challengeId: 'y_debt_free', period: '2026', value: 1, completed: true, completedAt: '2026-07-31T20:00:00.000Z' },
  { challengeId: 'y_goal', period: '2026', value: 0, completed: false },
]

/* ------------------------------- Social -------------------------------- */

/**
 * Le réseau de Camille. Les niveaux et paliers sont visibles entre amis ;
 * jamais les montants — le jardin se partage, pas le relevé.
 */
export const MOCK_FRIENDS: Friend[] = [
  { id: 'usr_2', pseudo: 'jonas.brk', displayName: 'Jonas', level: 19, stageIndex: 4, status: 'ami' },
  { id: 'usr_3', pseudo: 'farida-v', displayName: 'Farida', level: 7, stageIndex: 2, status: 'ami' },
  { id: 'usr_4', pseudo: 'elio.mzt', displayName: 'Elio', level: 24, stageIndex: 5, status: 'ami' },
  { id: 'usr_6', pseudo: 'anouk_dl', displayName: 'Anouk', level: 5, stageIndex: 1, status: 'demande_recue' },
]

/** Annuaire de recherche : les comptes qui ne sont pas encore des amis. */
export const MOCK_DIRECTORY: Friend[] = [
  { id: 'usr_5', pseudo: 'wassim.k', displayName: 'Wassim', level: 2, stageIndex: 0, status: 'demande_envoyee' },
  { id: 'usr_7', pseudo: 'lea.plnt', displayName: 'Léa', level: 11, stageIndex: 3, status: 'ami' },
  { id: 'usr_8', pseudo: 'marco.bgt', displayName: 'Marco', level: 31, stageIndex: 6, status: 'ami' },
  { id: 'usr_9', pseudo: 'sonia.eco', displayName: 'Sonia', level: 15, stageIndex: 4, status: 'ami' },
].map((f) => ({ ...f, status: f.id === 'usr_5' ? ('demande_envoyee' as const) : ('ami' as const) }))

export const MOCK_GROUPS: Group[] = [
  {
    // Camille administre celui-ci : elle peut configurer l'objectif.
    id: 'grp_rome',
    name: 'Cap sur Rome',
    icon: 'Plane',
    tone: 'indigo',
    goalKind: 'travel',
    goalLabel: 'Quatre jours à Rome à trois',
    targetAmount: 1800,
    deadline: '2027-05',
    createdAt: '2026-06-14T19:30:00.000Z',
    members: [
      { id: 'usr_demo', pseudo: 'camille.r', displayName: 'Camille', role: 'admin', contributions: { '2026-06': 40, '2026-07': 40, '2026-08': 50 } },
      { id: 'usr_2', pseudo: 'jonas.brk', displayName: 'Jonas', role: 'membre', contributions: { '2026-06': 60, '2026-07': 60, '2026-08': 60 } },
      { id: 'usr_3', pseudo: 'farida-v', displayName: 'Farida', role: 'membre', contributions: { '2026-07': 35, '2026-08': 35 } },
    ],
  },
  {
    // Ici Camille est simple membre : Elio décide, elle contribue.
    id: 'grp_noel',
    name: 'Noël des Roussel',
    icon: 'Gift',
    tone: 'berry',
    goalKind: 'celebration',
    goalLabel: 'La cagnotte cadeaux de la famille',
    targetAmount: 400,
    deadline: '2026-12',
    createdAt: '2026-03-02T10:00:00.000Z',
    members: [
      { id: 'usr_4', pseudo: 'elio.mzt', displayName: 'Elio', role: 'admin', contributions: { '2026-04': 30, '2026-05': 30, '2026-06': 30, '2026-07': 30, '2026-08': 30 } },
      { id: 'usr_demo', pseudo: 'camille.r', displayName: 'Camille', role: 'membre', contributions: { '2026-06': 20, '2026-07': 20, '2026-08': 20 } },
      { id: 'usr_6', pseudo: 'anouk_dl', displayName: 'Anouk', role: 'membre', contributions: { '2026-07': 15 } },
    ],
  },
]

/** Données de l'écran d'administration (Phase 1 : entièrement fictives). */
export const MOCK_ADMIN_USERS = [
  { id: 'usr_demo', name: 'Camille', email: 'camille@budgette.app', role: 'admin' as const, level: 12, joined: '2026-01-05', lastSeen: '2026-08-21', status: 'actif' as const, months: 7 },
  { id: 'usr_2', name: 'Jonas', email: 'jonas@example.org', role: 'user' as const, level: 19, joined: '2026-01-19', lastSeen: '2026-08-21', status: 'actif' as const, months: 7 },
  { id: 'usr_3', name: 'Farida', email: 'farida@example.org', role: 'user' as const, level: 7, joined: '2026-03-08', lastSeen: '2026-08-20', status: 'actif' as const, months: 5 },
  { id: 'usr_4', name: 'Elio', email: 'elio@example.org', role: 'user' as const, level: 24, joined: '2026-01-11', lastSeen: '2026-08-18', status: 'actif' as const, months: 7 },
  { id: 'usr_5', name: 'Wassim', email: 'wassim@example.org', role: 'user' as const, level: 2, joined: '2026-07-24', lastSeen: '2026-08-02', status: 'inactif' as const, months: 1 },
  { id: 'usr_6', name: 'Anouk', email: 'anouk@example.org', role: 'user' as const, level: 5, joined: '2026-05-16', lastSeen: '2026-08-09', status: 'suspendu' as const, months: 3 },
]

export const MOCK_FEATURE_FLAGS = [
  { id: 'seasons', label: 'Saisons trimestrielles', description: 'Cycles de défis thématiques de trois mois.', enabled: true, rollout: 100 },
  { id: 'coop_goals', label: 'Objectifs partagés', description: 'Épargner à plusieurs sur un objectif commun.', enabled: false, rollout: 0 },
  { id: 'statement_import', label: 'Import de relevés', description: 'Analyse de relevés PDF. Reporté : la saisie manuelle reste la règle.', enabled: false, rollout: 0 },
  { id: 'weekly_digest', label: 'Récapitulatif hebdomadaire', description: 'E-mail du dimanche soir, avec consentement explicite.', enabled: true, rollout: 60 },
  { id: 'public_leaderboard', label: 'Classement public', description: 'Désactivé : incompatible avec la minimisation des données.', enabled: false, rollout: 0 },
]

export const MOCK_AUDIT_LOG = [
  { at: '2026-08-21T09:14:00.000Z', actor: 'Camille', action: 'feature_flag.update', target: 'weekly_digest', detail: 'déploiement 40 % → 60 %' },
  { at: '2026-08-20T16:02:00.000Z', actor: 'Camille', action: 'user.suspend', target: 'anouk@example.org', detail: 'signalement automatique' },
  { at: '2026-08-19T11:47:00.000Z', actor: 'système', action: 'data.export', target: 'elio@example.org', detail: 'demande RGPD, livrée en 4 min' },
  { at: '2026-08-18T08:30:00.000Z', actor: 'Camille', action: 'challenge.publish', target: 'm_extra_debt', detail: 'nouveau défi mensuel' },
  { at: '2026-08-14T19:05:00.000Z', actor: 'système', action: 'data.erase', target: 'ancien compte', detail: 'suppression définitive après 30 j' },
]
