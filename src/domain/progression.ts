/**
 * Progression d'un compte : ce qui est ouvert, ce qui reste à faire.
 *
 * Tout est déduit des données déjà présentes — aucun drapeau à tenir à jour,
 * donc aucun risque qu'un compteur dise « fait » quand la donnée dit le
 * contraire. Le fichier ne dépend pas de React : il se teste seul, comme le
 * reste de `domain/`.
 */
import type { Goal, MonthBudget, MonthKey, Profile } from './types'

/** Sections de l'application susceptibles d'être masquées à l'arrivée. */
export type SectionId = 'accueil' | 'mois' | 'objectifs' | 'quetes' | 'annee' | 'jardin' | 'profil'

export interface EtatCompte {
  budgets: MonthBudget[]
  goals: Goal[]
  profile: Profile
  activeMonth: MonthKey
}

/** Un mois est « saisi » dès qu'il porte au moins un montant non nul. */
export function moisSaisi(budget: MonthBudget | undefined): boolean {
  return Boolean(budget?.lines.some((line) => line.amount > 0))
}

export function aSaisiUnMois(budgets: MonthBudget[]): boolean {
  return budgets.some(moisSaisi)
}

export function aClotureUnMois(budgets: MonthBudget[]): boolean {
  return budgets.some((budget) => budget.closed)
}

/**
 * Sections ouvertes.
 *
 * L'arrivée ne montre que ce qui sert immédiatement : voir où l'on en est,
 * saisir, et se donner un cap. Les quêtes n'ont pas de sens tant qu'aucun
 * chiffre n'existe — elles se résolvent toutes à partir de la saisie. Le
 * jardin et la vue annuelle demandent, eux, un mois clôturé : sans cela ils
 * n'afficheraient qu'un décor vide.
 */
export function sectionsOuvertes(etat: EtatCompte): Set<SectionId> {
  const ouvertes = new Set<SectionId>(['accueil', 'mois', 'objectifs', 'profil'])
  if (aSaisiUnMois(etat.budgets)) ouvertes.add('quetes')
  if (aClotureUnMois(etat.budgets)) {
    ouvertes.add('annee')
    ouvertes.add('jardin')
  }
  return ouvertes
}

/** Ce qui débloque une section, dit à l'utilisateur. */
export const CONDITION_SECTION: Partial<Record<SectionId, string>> = {
  quetes: 'Saisissez un premier montant pour ouvrir les quêtes.',
  annee: 'Clôturez un mois pour suivre votre année.',
  jardin: 'Clôturez un mois pour voir votre jardin pousser.',
}

/* ------------------------------ Premiers pas ------------------------------ */

export interface PremierPas {
  id: string
  label: string
  /** Ce que l'étape apporte, en une ligne. */
  hint: string
  icon: string
  /** Route à ouvrir quand l'utilisateur touche l'étape. */
  to: string
  fait: boolean
}

/**
 * Les quatre gestes qui font passer un compte neuf à un compte vivant.
 *
 * L'ordre est celui dans lequel ils se font naturellement : se nommer, se
 * donner un cap, saisir, clôturer. Chacun est vérifié sur les données, pas
 * sur un clic.
 */
export function premiersPas(etat: EtatCompte): PremierPas[] {
  const budget = etat.budgets.find((b) => b.month === etat.activeMonth)
  return [
    {
      id: 'profil',
      label: 'Complétez votre profil',
      hint: 'Votre prénom, pour que l’application vous parle.',
      icon: 'UserPlus',
      to: '/profil',
      fait: etat.profile.displayName.trim().length > 0,
    },
    {
      id: 'objectif',
      label: 'Fixez un objectif',
      hint: 'Il décide de la répartition conseillée de chaque euro.',
      icon: 'Target',
      to: '/objectifs',
      fait: etat.goals.some((goal) => !goal.archived),
    },
    {
      id: 'saisie',
      label: 'Saisissez votre mois',
      hint: 'Revenus et charges : c’est la matière de tout le reste.',
      icon: 'PenLine',
      to: '/mois',
      fait: moisSaisi(budget),
    },
    {
      id: 'cloture',
      label: 'Clôturez votre premier mois',
      hint: 'Le bilan arrive, et le jardin s’ouvre.',
      icon: 'CalendarCheck',
      to: '/mois',
      fait: aClotureUnMois(etat.budgets),
    },
  ]
}

/**
 * Complétude du compte, de 0 à 1.
 *
 * Elle reprend exactement les premiers pas : le pourcentage affiché au profil
 * et la liste affichée à l'accueil ne peuvent donc pas se contredire.
 */
export function completude(etat: EtatCompte): number {
  const pas = premiersPas(etat)
  return pas.filter((p) => p.fait).length / pas.length
}

/** Vrai quand aucun objectif n'est défini : la section réclame une visite. */
export function objectifManquant(etat: Pick<EtatCompte, 'goals'>): boolean {
  return !etat.goals.some((goal) => !goal.archived)
}
