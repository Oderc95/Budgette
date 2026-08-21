import { CATEGORY_BY_ID, FLOW_ORDER } from './categories'
import type { Flow, MonthBudget, MonthKey, SavingsPocket } from './types'
import { monthsBetween } from '../lib/format'

export type FlowTotals = Record<Flow, number>

const EMPTY_TOTALS = (): FlowTotals => ({
  income: 0,
  fixed: 0,
  debt: 0,
  saving: 0,
  discretionary: 0,
})

/** Somme des lignes d'un mois, ventilée par flux. */
export function totalsByFlow(budget: MonthBudget | undefined): FlowTotals {
  const totals = EMPTY_TOTALS()
  if (!budget) return totals
  for (const line of budget.lines) {
    const category = CATEGORY_BY_ID[line.categoryId]
    if (!category) continue
    totals[category.flow] += line.amount
  }
  return totals
}

/** Ventilation d'un flux par catégorie, triée du plus lourd au plus léger. */
export function breakdown(
  budget: MonthBudget | undefined,
  flow: Flow,
): { categoryId: string; label: string; amount: number; icon: string }[] {
  if (!budget) return []
  const sums = new Map<string, number>()
  for (const line of budget.lines) {
    const category = CATEGORY_BY_ID[line.categoryId]
    if (!category || category.flow !== flow || line.amount === 0) continue
    sums.set(line.categoryId, (sums.get(line.categoryId) ?? 0) + line.amount)
  }
  return [...sums.entries()]
    .map(([categoryId, amount]) => ({
      categoryId,
      amount,
      label: CATEGORY_BY_ID[categoryId].label,
      icon: CATEGORY_BY_ID[categoryId].icon,
    }))
    .sort((a, b) => b.amount - a.amount)
}

export interface MonthSummary {
  month: MonthKey
  totals: FlowTotals
  /** Revenus − charges contraintes − dettes. Ce qu'il reste pour vivre. */
  livingAllowance: number
  /** Ce qui reste réellement une fois tout passé. */
  endOfMonth: number
  savingRate: number
  fixedRate: number
  debtRate: number
  discretionaryRate: number
  closed: boolean
}

export function summarize(budget: MonthBudget | undefined, month: MonthKey): MonthSummary {
  const totals = totalsByFlow(budget)
  const income = totals.income
  const livingAllowance = income - totals.fixed - totals.debt
  const endOfMonth = livingAllowance - totals.saving - totals.discretionary
  const ratio = (value: number) => (income > 0 ? value / income : 0)

  return {
    month,
    totals,
    livingAllowance,
    endOfMonth,
    savingRate: ratio(totals.saving),
    fixedRate: ratio(totals.fixed),
    debtRate: ratio(totals.debt),
    discretionaryRate: ratio(totals.discretionary),
    closed: budget?.closed ?? false,
  }
}

export interface HealthBreakdown {
  label: string
  score: number
  max: number
  comment: string
}

export interface HealthScore {
  total: number
  grade: 'Fragile' | 'À consolider' | 'Solide' | 'Excellent'
  parts: HealthBreakdown[]
}

/**
 * Score de santé budgétaire sur 100.
 *
 * Les seuils suivent les repères courants de l'éducation budgétaire en France
 * (charges contraintes sous 50 % du revenu, épargne d'au moins 10 %,
 * endettement sous 33 %). C'est un indicateur pédagogique, jamais un conseil
 * en investissement ni une évaluation de solvabilité.
 */
export function healthScore(summary: MonthSummary, streakDays: number): HealthScore {
  const parts: HealthBreakdown[] = []

  const savingScore = Math.min(30, Math.round((summary.savingRate / 0.2) * 30))
  parts.push({
    label: "Effort d'épargne",
    score: Math.max(0, savingScore),
    max: 30,
    comment:
      summary.savingRate >= 0.2
        ? 'Au-delà de 20 % : vous construisez vite.'
        : summary.savingRate >= 0.1
          ? 'Entre 10 et 20 % : rythme sain.'
          : 'Sous 10 % : le premier levier à travailler.',
  })

  const fixedScore =
    summary.fixedRate === 0 ? 0 : Math.max(0, Math.round(25 - Math.max(0, summary.fixedRate - 0.5) * 100))
  parts.push({
    label: 'Poids des charges fixes',
    score: Math.min(25, fixedScore),
    max: 25,
    comment:
      summary.fixedRate <= 0.5
        ? 'Sous 50 % du revenu : vous gardez de la marge de manœuvre.'
        : 'Au-delà de 50 %, chaque imprévu fait mal.',
  })

  const debtScore = Math.max(0, Math.round(20 - Math.max(0, summary.debtRate) * 60))
  parts.push({
    label: 'Charge de la dette',
    score: Math.min(20, debtScore),
    max: 20,
    comment:
      summary.debtRate === 0
        ? 'Aucune dette en cours. Le confort absolu.'
        : summary.debtRate <= 0.33
          ? 'Sous le seuil de 33 % retenu par les prêteurs.'
          : 'Au-delà de 33 % : priorité au désendettement.',
  })

  const balanceScore = summary.endOfMonth >= 0 ? 15 : Math.max(0, 15 + Math.round(summary.endOfMonth / 20))
  parts.push({
    label: 'Fin de mois',
    score: balanceScore,
    max: 15,
    comment: summary.endOfMonth >= 0 ? 'Le mois se termine dans le vert.' : 'Le mois se termine à découvert.',
  })

  const regularityScore = Math.min(10, Math.round(streakDays / 3))
  parts.push({
    label: 'Régularité du suivi',
    score: regularityScore,
    max: 10,
    comment: streakDays >= 30 ? 'Un mois de suivi sans interruption.' : 'La régularité vaut autant que le montant.',
  })

  const total = parts.reduce((sum, part) => sum + part.score, 0)
  const grade: HealthScore['grade'] =
    total >= 80 ? 'Excellent' : total >= 60 ? 'Solide' : total >= 40 ? 'À consolider' : 'Fragile'

  return { total, grade, parts }
}

/** Moyenne d'un flux sur les `n` derniers mois clôturés. */
export function averageFlow(budgets: MonthBudget[], flow: Flow, months = 3): number {
  const closed = budgets.filter((b) => b.closed).slice(-months)
  if (closed.length === 0) return 0
  const sum = closed.reduce((acc, b) => acc + totalsByFlow(b)[flow], 0)
  return sum / closed.length
}

/** Solde d'une poche d'épargne, versements cumulés inclus. */
export function pocketBalance(pocket: SavingsPocket): number {
  return (
    pocket.openingBalance +
    Object.values(pocket.contributions).reduce((sum, amount) => sum + amount, 0)
  )
}

export interface GoalProjection {
  monthsRemaining: number
  monthlyEffort: number
  /** Effort mensuel rapporté au revenu disponible. */
  feasible: boolean
  shortfall: number
}

/** Effort mensuel nécessaire pour tenir une échéance. */
export function projectGoal(
  targetAmount: number,
  savedAmount: number,
  deadline: MonthKey,
  currentMonth: MonthKey,
  livingAllowance: number,
): GoalProjection {
  const monthsRemaining = Math.max(1, monthsBetween(currentMonth, deadline))
  const shortfall = Math.max(0, targetAmount - savedAmount)
  const monthlyEffort = shortfall / monthsRemaining
  return {
    monthsRemaining,
    monthlyEffort,
    shortfall,
    feasible: livingAllowance <= 0 ? false : monthlyEffort <= livingAllowance * 0.6,
  }
}

/** Sert à l'affichage des barres empilées : part de chaque flux dans le revenu. */
export function flowShares(totals: FlowTotals): { flow: Flow; share: number; amount: number }[] {
  const spend = FLOW_ORDER.filter((f) => f !== 'income')
  const base = totals.income > 0 ? totals.income : spend.reduce((sum, f) => sum + totals[f], 0) || 1
  return spend.map((flow) => ({ flow, amount: totals[flow], share: totals[flow] / base }))
}
