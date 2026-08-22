/**
 * Modèle de domaine de Budgette.
 *
 * La segmentation reprend celle du classeur « GESTION BUDGET PERSO » :
 * revenus, charges contraintes, dettes, épargne brute, dépenses non
 * essentielles. C'est cette découpe qui donne le « reste à vivre » et le
 * « reste fin de mois », les deux chiffres que l'utilisateur regarde vraiment.
 */

/** Les cinq flux qui composent un mois. */
export type Flow = 'income' | 'fixed' | 'debt' | 'saving' | 'discretionary'

/** Teinte sémantique associée à un flux ou une catégorie. */
export type Tone = 'brand' | 'mint' | 'indigo' | 'berry' | 'amber' | 'orchid'

export interface Category {
  id: string
  label: string
  flow: Flow
  /** Nom d'icône lucide, résolu à l'affichage. */
  icon: string
  /** Repère pour l'utilisateur au moment de la saisie. */
  hint?: string
  /** Une charge fixe est reconduite automatiquement d'un mois sur l'autre. */
  recurring?: boolean
}

/** Étiquette libre, à coller sur des lignes pour croiser les catégories. */
export interface Tag {
  id: string
  label: string
  tone: Tone
}

/** Une ligne de saisie : un montant pour une catégorie, sur un mois donné. */
export interface BudgetLine {
  categoryId: string
  amount: number
  /** Précision libre saisie par l'utilisateur (« Deliveroo x4 »). */
  note?: string
  /** Étiquettes collées sur la ligne. */
  tagIds?: string[]
  /**
   * Dépense ponctuelle : elle ne sera pas attendue le mois suivant quand ce
   * mois sert de référence.
   */
  oneOff?: boolean
}

/** Identifiant de mois au format `AAAA-MM`. */
export type MonthKey = string

export interface MonthBudget {
  month: MonthKey
  lines: BudgetLine[]
  /** Un mois clôturé est figé : il alimente l'historique et les défis. */
  closed: boolean
  closedAt?: string
  /** Ressenti déclaré à la clôture, de 1 (difficile) à 5 (serein). */
  mood?: 1 | 2 | 3 | 4 | 5
  note?: string
}

/** Poche d'épargne (fonds d'urgence, vacances, retraite…). */
export interface SavingsPocket {
  id: string
  label: string
  icon: string
  tone: Tone
  /** Montant visé ; `null` pour une poche sans plafond (retraite). */
  target: number | null
  /**
   * Solde de départ, avant le premier mois suivi dans l'app. Les versements
   * suivants sont les lignes d'épargne des mois : une seule source de vérité.
   */
  openingBalance: number
}

/** Familles d'objectifs proposées à l'onboarding. */
export type GoalKind =
  | 'emergency'
  | 'debt_exit'
  | 'travel'
  | 'home'
  | 'study'
  | 'purchase'
  | 'retirement'
  | 'freedom'
  | 'car'
  | 'wedding'
  | 'baby'
  | 'moving'
  | 'celebration'
  | 'health'

export interface Goal {
  id: string
  kind: GoalKind
  label: string
  targetAmount: number
  /** Échéance visée au format `AAAA-MM`. */
  deadline: MonthKey
  /** Poche d'épargne alimentant l'objectif, si rattachée. */
  pocketId?: string
  createdAt: string
  archived?: boolean
}

/** Règle de répartition du revenu net, en pourcentages. */
export interface AllocationRule {
  /** Besoins : charges contraintes. */
  needs: number
  /** Envies : dépenses non essentielles. */
  wants: number
  /** Épargne et remboursement de dettes. */
  future: number
}

export interface Strategy {
  id: string
  name: string
  /** Une phrase qui explique le parti pris, affichée à l'utilisateur. */
  rationale: string
  rule: AllocationRule
  /** Ordre de priorité des actions du mois. */
  priorities: string[]
  /** Identifiants de défis mis en avant par cette stratégie. */
  featuredChallenges: string[]
}

/* ------------------------------ Gamification ------------------------------ */

export type ChallengeCadence = 'daily' | 'weekly' | 'monthly' | 'yearly'
export type ChallengeDifficulty = 'douce' | 'moyenne' | 'costaude' | 'héroïque'

export interface Challenge {
  id: string
  title: string
  description: string
  cadence: ChallengeCadence
  difficulty: ChallengeDifficulty
  xp: number
  icon: string
  tone: Tone
  /** Objectif chiffré à atteindre (jours sans dépense, euros épargnés…). */
  target: number
  unit: string
  /** Familles d'objectifs pour lesquelles le défi est particulièrement utile. */
  suitedTo?: GoalKind[]
}

export interface ChallengeProgress {
  challengeId: string
  /** Période concernée : `2026-07-21`, `2026-W30`, `2026-07`, `2026`. */
  period: string
  value: number
  completed: boolean
  completedAt?: string
}

export type BadgeRarity = 'commun' | 'rare' | 'épique' | 'légendaire'

export interface Badge {
  id: string
  label: string
  description: string
  /** Condition en clair, affichée tant que le badge est verrouillé. */
  criteria: string
  rarity: BadgeRarity
  icon: string
  tone: Tone
  xp: number
}

export interface UnlockedBadge {
  badgeId: string
  unlockedAt: string
}

/** Palier de progression : chaque niveau franchit un état de la mascotte. */
export interface GrowthStage {
  id: string
  label: string
  /** Niveau à partir duquel le palier est atteint. */
  fromLevel: number
  blurb: string
}

export interface Streak {
  /** Série en cours, en jours consécutifs de suivi. */
  current: number
  best: number
  lastCheckIn?: string
}

/* --------------------------------- Compte --------------------------------- */

export type UserRole = 'user' | 'admin'

export interface Profile {
  /** Pseudo unique, la poignée par laquelle les amis vous trouvent. */
  pseudo: string
  id: string
  displayName: string
  email: string
  role: UserRole
  createdAt: string
  /** Devise ISO 4217 ; l'app est pensée pour la zone euro. */
  currency: 'EUR'
  strategyId: string
  xp: number
  streak: Streak
  /** Consentements RGPD, horodatés. */
  consents: {
    termsAcceptedAt?: string
    privacyAcceptedAt?: string
    analyticsOptIn: boolean
  }
}

/* ------------------------------- Social -------------------------------- */

/** Un membre du réseau, vu de l'extérieur : jamais ses montants. */
export interface Friend {
  id: string
  pseudo: string
  displayName: string
  level: number
  /** Palier de jardin, pour afficher sa plante. */
  stageIndex: number
  status: 'ami' | 'demande_envoyee' | 'demande_recue'
}

export interface GroupMember {
  id: string
  pseudo: string
  displayName: string
  role: 'admin' | 'membre'
  /** Versements déclarés au pot commun, par mois. */
  contributions: Record<MonthKey, number>
}

/** Un groupe : des membres autour d'un objectif commun. */
export interface Group {
  id: string
  name: string
  icon: string
  tone: Tone
  goalKind: GoalKind
  goalLabel: string
  targetAmount: number
  deadline: MonthKey
  createdAt: string
  members: GroupMember[]
}
