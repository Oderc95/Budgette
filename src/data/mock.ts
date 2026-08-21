import type {
  Goal,
  MonthBudget,
  Profile,
  SavingsPocket,
  UnlockedBadge,
} from '../domain/types'

/**
 * Jeu de démonstration.
 *
 * Les ordres de grandeur sont calqués sur un profil réel de relevés bancaires
 * (salaire net ~2 200 €, loyer 720 €, forte part de livraison de repas et de
 * retraits d'espèces), puis étalés sur huit mois pour raconter une trajectoire
 * de redressement : sortie du découvert, baisse des retraits, montée de
 * l'épargne. Aucune donnée identifiante n'est stockée ici.
 */

type Row = Record<string, number>

const MONTHS: { month: string; closed: boolean; mood: 1 | 2 | 3 | 4 | 5; rows: Row }[] = [
  {
    month: '2026-01',
    closed: true,
    mood: 2,
    rows: {
      inc_salary: 2200,
      fix_housing: 720, fix_water: 15, fix_internet: 40, fix_phone: 115, fix_transport: 70,
      fix_groceries: 305, fix_insurance_health: 10, fix_tools: 31, fix_bank_fees: 28,
      debt_installments: 101, debt_overdraft: 0,
      sav_emergency: 0,
      dis_delivery: 265, dis_restaurant: 145, dis_cash: 420, dis_subscriptions: 64,
      dis_shopping: 96, dis_leisure: 40,
    },
  },
  {
    month: '2026-02',
    closed: true,
    mood: 2,
    rows: {
      inc_salary: 2200,
      fix_housing: 720, fix_water: 15, fix_internet: 40, fix_phone: 115, fix_transport: 70,
      fix_groceries: 288, fix_insurance_health: 10, fix_tools: 31, fix_bank_fees: 34,
      debt_installments: 101, debt_overdraft: 0,
      sav_emergency: 0,
      dis_delivery: 231, dis_restaurant: 122, dis_cash: 390, dis_subscriptions: 58,
      dis_shopping: 62, dis_leisure: 55,
    },
  },
  {
    month: '2026-03',
    closed: true,
    mood: 3,
    rows: {
      inc_salary: 2200, inc_refunds: 60,
      fix_housing: 720, fix_water: 15, fix_internet: 40, fix_phone: 115, fix_transport: 70,
      fix_groceries: 262, fix_insurance_health: 10, fix_tools: 31, fix_bank_fees: 18,
      debt_installments: 101, debt_overdraft: 60,
      sav_emergency: 30,
      dis_delivery: 188, dis_restaurant: 96, dis_cash: 320, dis_subscriptions: 44,
      dis_shopping: 30, dis_leisure: 45,
    },
  },
  {
    month: '2026-04',
    closed: true,
    mood: 3,
    rows: {
      inc_salary: 2202,
      fix_housing: 720, fix_water: 15, fix_internet: 40, fix_phone: 122, fix_transport: 70,
      fix_groceries: 233, fix_insurance_health: 5, fix_tools: 61, fix_bank_fees: 12,
      debt_installments: 101, debt_overdraft: 80,
      sav_emergency: 50,
      dis_delivery: 145, dis_restaurant: 158, dis_cash: 240, dis_subscriptions: 22,
      dis_shopping: 24, dis_leisure: 35,
    },
  },
  {
    month: '2026-05',
    closed: true,
    mood: 2,
    rows: {
      inc_salary: 2202,
      // Deux loyers prélevés sur la même période : le mois qui fait mal.
      fix_housing: 1440, fix_water: 15, fix_internet: 40, fix_phone: 130, fix_transport: 88,
      fix_groceries: 322, fix_insurance_health: 10, fix_tools: 31, fix_bank_fees: 59,
      debt_installments: 101, debt_overdraft: 0,
      sav_emergency: 0,
      dis_delivery: 49, dis_restaurant: 128, dis_cash: 490, dis_subscriptions: 31,
      dis_shopping: 86, dis_leisure: 30,
    },
  },
  {
    month: '2026-06',
    closed: true,
    mood: 3,
    rows: {
      inc_salary: 2150, inc_refunds: 483,
      fix_housing: 720, fix_water: 15, fix_internet: 40, fix_phone: 118, fix_transport: 70,
      fix_groceries: 333, fix_insurance_health: 10, fix_tools: 31, fix_bank_fees: 4,
      debt_installments: 110, debt_overdraft: 69,
      sav_emergency: 100,
      dis_delivery: 229, dis_restaurant: 116, dis_cash: 340, dis_subscriptions: 64,
      dis_shopping: 100, dis_leisure: 45,
    },
  },
  {
    month: '2026-07',
    closed: true,
    mood: 4,
    rows: {
      inc_salary: 2200, inc_refunds: 156,
      fix_housing: 720, fix_water: 15, fix_internet: 40, fix_phone: 112, fix_transport: 70,
      fix_groceries: 296, fix_insurance_health: 10, fix_tools: 31, fix_bank_fees: 0,
      debt_installments: 110,
      sav_emergency: 180, sav_travel: 40,
      dis_delivery: 96, dis_restaurant: 72, dis_cash: 120, dis_subscriptions: 42,
      dis_shopping: 35, dis_leisure: 60,
    },
  },
  {
    // Mois en cours au 21 août : partiellement saisi.
    month: '2026-08',
    closed: false,
    mood: 4,
    rows: {
      inc_salary: 2200,
      fix_housing: 720, fix_water: 15, fix_internet: 40, fix_phone: 112, fix_transport: 70,
      fix_groceries: 214, fix_insurance_health: 10, fix_tools: 31,
      debt_installments: 110,
      sav_emergency: 200, sav_travel: 60,
      dis_delivery: 34, dis_restaurant: 48, dis_cash: 0, dis_subscriptions: 42,
      dis_leisure: 25,
    },
  },
]

export const MOCK_BUDGETS: MonthBudget[] = MONTHS.map(({ month, closed, mood, rows }) => ({
  month,
  closed,
  closedAt: closed ? `${month}-28T20:00:00.000Z` : undefined,
  mood,
  lines: Object.entries(rows)
    .filter(([, amount]) => amount > 0)
    .map(([categoryId, amount]) => ({ categoryId, amount })),
}))

export const MOCK_POCKETS: SavingsPocket[] = [
  {
    id: 'pocket_emergency',
    label: "Fonds d'urgence",
    icon: 'Umbrella',
    tone: 'mint',
    target: 3600,
    openingBalance: 0,
    contributions: {
      '2026-03': 30, '2026-04': 50, '2026-06': 100, '2026-07': 180, '2026-08': 200,
    },
  },
  {
    id: 'pocket_travel',
    label: 'Épargne voyages',
    icon: 'Plane',
    tone: 'indigo',
    target: 1800,
    openingBalance: 0,
    contributions: { '2026-07': 40, '2026-08': 60 },
  },
  {
    id: 'pocket_buffer',
    label: 'Épargne de précaution',
    icon: 'ShieldCheck',
    tone: 'amber',
    target: 1000,
    openingBalance: 120,
    contributions: {},
  },
  {
    id: 'pocket_retirement',
    label: 'Épargne retraite',
    icon: 'Palmtree',
    tone: 'orchid',
    target: null,
    openingBalance: 0,
    contributions: {},
  },
]

export const MOCK_GOALS: Goal[] = [
  {
    id: 'goal_1',
    kind: 'emergency',
    label: "Trois mois de charges devant moi",
    targetAmount: 3600,
    savedAmount: 560,
    deadline: '2027-06',
    pocketId: 'pocket_emergency',
    createdAt: '2026-03-02T09:00:00.000Z',
  },
  {
    id: 'goal_2',
    kind: 'travel',
    label: 'Deux semaines au Japon',
    targetAmount: 1800,
    savedAmount: 100,
    deadline: '2027-04',
    pocketId: 'pocket_travel',
    createdAt: '2026-07-04T18:30:00.000Z',
  },
]

export const MOCK_PROFILE: Profile = {
  id: 'usr_demo',
  displayName: 'Credo',
  email: 'demo@budgette.app',
  role: 'admin',
  createdAt: '2026-01-08T10:00:00.000Z',
  currency: 'EUR',
  strategyId: 'bouclier',
  xp: 4820,
  streak: { current: 23, best: 31, lastCheckIn: '2026-08-21' },
  consents: {
    termsAcceptedAt: '2026-01-08T10:00:00.000Z',
    privacyAcceptedAt: '2026-01-08T10:00:00.000Z',
    analyticsOptIn: false,
  },
}

export const MOCK_UNLOCKED: UnlockedBadge[] = [
  { badgeId: 'first_step', unlockedAt: '2026-01-31T19:00:00.000Z' },
  { badgeId: 'streak_7', unlockedAt: '2026-02-12T08:00:00.000Z' },
  { badgeId: 'green_month', unlockedAt: '2026-04-30T21:00:00.000Z' },
  { badgeId: 'streak_30', unlockedAt: '2026-06-05T08:00:00.000Z' },
  { badgeId: 'phoenix', unlockedAt: '2026-07-31T20:00:00.000Z' },
  { badgeId: 'frugal_week', unlockedAt: '2026-08-11T21:00:00.000Z' },
]

/** Défis déjà validés sur la période en cours, pour la démonstration. */
export const MOCK_CHALLENGE_PROGRESS = [
  { challengeId: 'd_log', period: '2026-08-21', value: 1, completed: true, completedAt: '2026-08-21T08:12:00.000Z' },
  { challengeId: 'd_home_meal', period: '2026-08-21', value: 1, completed: true, completedAt: '2026-08-21T13:40:00.000Z' },
  { challengeId: 'd_no_spend', period: '2026-08-21', value: 0, completed: false },
  { challengeId: 'd_no_cash', period: '2026-08-21', value: 1, completed: true, completedAt: '2026-08-21T09:00:00.000Z' },
  { challengeId: 'd_round_up', period: '2026-08-21', value: 0, completed: false },
  { challengeId: 'd_cart_pause', period: '2026-08-21', value: 0, completed: false },
  { challengeId: 'w_no_delivery', period: '2026-W34', value: 5, completed: false },
  { challengeId: 'w_three_no_spend', period: '2026-W34', value: 2, completed: false },
  { challengeId: 'w_review', period: '2026-W34', value: 0, completed: false },
  { challengeId: 'w_grocery_budget', period: '2026-W34', value: 1, completed: true, completedAt: '2026-08-18T19:00:00.000Z' },
  { challengeId: 'w_cash_only', period: '2026-W34', value: 0, completed: false },
  { challengeId: 'w_sell', period: '2026-W34', value: 0, completed: false },
  { challengeId: 'm_no_atm', period: '2026-08', value: 1, completed: false },
  { challengeId: 'm_save_10', period: '2026-08', value: 11.8, completed: true, completedAt: '2026-08-05T07:30:00.000Z' },
  { challengeId: 'm_close', period: '2026-08', value: 0, completed: false },
  { challengeId: 'm_sub_audit', period: '2026-08', value: 0, completed: false },
  { challengeId: 'm_under_budget', period: '2026-08', value: 0, completed: false },
  { challengeId: 'm_no_overdraft', period: '2026-08', value: 1, completed: false },
  { challengeId: 'm_extra_debt', period: '2026-08', value: 0, completed: false },
  { challengeId: 'y_12_closed', period: '2026', value: 7, completed: false },
  { challengeId: 'y_emergency_1m', period: '2026', value: 0.47, completed: false },
  { challengeId: 'y_save_15', period: '2026', value: 4.1, completed: false },
  { challengeId: 'y_debt_free', period: '2026', value: 4, completed: false },
  { challengeId: 'y_goal', period: '2026', value: 0, completed: false },
]

/** Données de l'écran d'administration (Phase 1 : entièrement fictives). */
export const MOCK_ADMIN_USERS = [
  { id: 'usr_demo', name: 'Credo', email: 'demo@budgette.app', role: 'admin' as const, level: 14, joined: '2026-01-08', lastSeen: '2026-08-21', status: 'actif' as const, months: 7 },
  { id: 'usr_2', name: 'Aïcha', email: 'aicha@example.org', role: 'user' as const, level: 9, joined: '2026-02-14', lastSeen: '2026-08-20', status: 'actif' as const, months: 6 },
  { id: 'usr_3', name: 'Théo', email: 'theo@example.org', role: 'user' as const, level: 22, joined: '2026-01-22', lastSeen: '2026-08-21', status: 'actif' as const, months: 7 },
  { id: 'usr_4', name: 'Marion', email: 'marion@example.org', role: 'user' as const, level: 3, joined: '2026-06-30', lastSeen: '2026-07-14', status: 'inactif' as const, months: 1 },
  { id: 'usr_5', name: 'Sofiane', email: 'sofiane@example.org', role: 'user' as const, level: 17, joined: '2026-03-11', lastSeen: '2026-08-19', status: 'actif' as const, months: 5 },
  { id: 'usr_6', name: 'Lena', email: 'lena@example.org', role: 'user' as const, level: 6, joined: '2026-05-02', lastSeen: '2026-08-12', status: 'suspendu' as const, months: 3 },
]

export const MOCK_FEATURE_FLAGS = [
  { id: 'seasons', label: 'Saisons trimestrielles', description: 'Cycles de défis thématiques de trois mois.', enabled: true, rollout: 100 },
  { id: 'coop_goals', label: 'Objectifs partagés', description: 'Épargner à plusieurs sur un objectif commun.', enabled: false, rollout: 0 },
  { id: 'statement_import', label: 'Import de relevés', description: 'Analyse de relevés PDF. Reporté : la saisie manuelle reste la règle.', enabled: false, rollout: 0 },
  { id: 'weekly_digest', label: 'Récapitulatif hebdomadaire', description: 'E-mail du dimanche soir, avec consentement explicite.', enabled: true, rollout: 60 },
  { id: 'public_leaderboard', label: 'Classement public', description: 'Désactivé : incompatible avec la minimisation des données.', enabled: false, rollout: 0 },
]

export const MOCK_AUDIT_LOG = [
  { at: '2026-08-21T09:14:00.000Z', actor: 'Credo', action: 'feature_flag.update', target: 'weekly_digest', detail: 'déploiement 40 % → 60 %' },
  { at: '2026-08-20T16:02:00.000Z', actor: 'Credo', action: 'user.suspend', target: 'lena@example.org', detail: 'signalement automatique' },
  { at: '2026-08-19T11:47:00.000Z', actor: 'système', action: 'data.export', target: 'theo@example.org', detail: 'demande RGPD, livrée en 4 min' },
  { at: '2026-08-18T08:30:00.000Z', actor: 'Credo', action: 'challenge.publish', target: 'm_extra_debt', detail: 'nouveau défi mensuel' },
  { at: '2026-08-14T19:05:00.000Z', actor: 'système', action: 'data.erase', target: 'ancien compte', detail: 'suppression définitive après 30 j' },
]
