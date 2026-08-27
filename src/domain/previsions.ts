/**
 * Prévisionnel : ce qu'on pouvait attendre d'un mois avant de le vivre.
 *
 * Deux sources, sans double compte. Le mois de référence — le dernier
 * clôturé — donne le train de vie ordinaire, hors dépenses ponctuelles et
 * hors postes retirés depuis. Le calendrier ajoute ce qui a été planifié à
 * l'avance : une charge annoncée, une échéance qui tombe ce mois-là.
 *
 * Le calcul vivait dans le composant qui l'affichait. Il est ici parce que
 * trois écrans en ont besoin — le comparatif du mois, la question posée à la
 * clôture, et l'histogramme de l'année — et qu'ils doivent tous répondre le
 * même chiffre.
 */
import type { FlowTotals } from './budget'
import type { Flow, MonthBudget, MonthKey, PlannedItem } from './types'
import { CATEGORY_BY_ID, FLOW_ORDER } from './categories'

export interface SourcesPrevision {
  budgets: MonthBudget[]
  referenceMonth: MonthKey | null
  retired: Record<string, MonthKey>
  planned: PlannedItem[]
}

const vide = (): FlowTotals => ({ income: 0, fixed: 0, debt: 0, saving: 0, discretionary: 0 })

export function previsionDuMois(month: MonthKey, sources: SourcesPrevision): FlowTotals {
  const { budgets, referenceMonth, retired, planned } = sources
  const reference = budgets.find((b) => b.month === referenceMonth && b.closed && b.month !== month)

  const prevu = vide()

  // Le report du mois précédent n'est pas prévisible : il reste hors budget.
  const refLines = (reference?.lines ?? []).filter(
    (line) => !line.oneOff && !retired[line.categoryId] && line.categoryId !== 'inc_carryover',
  )
  for (const line of refLines) {
    const flow = CATEGORY_BY_ID[line.categoryId]?.flow
    if (flow) prevu[flow] += line.amount
  }
  for (const item of planned) {
    if (item.recurrence !== 'monthly' && item.month !== month) continue
    // Même poste, même montant dans la référence : déjà compté.
    if (refLines.some((l) => l.categoryId === item.categoryId && l.amount === item.amount)) continue
    const flow = CATEGORY_BY_ID[item.categoryId]?.flow
    if (flow) prevu[flow] += item.amount
  }

  return prevu
}

/** Vrai dès qu'une prévision existe : sans elle, aucun écart n'a de sens. */
export function aUnePrevision(prevu: FlowTotals): boolean {
  return FLOW_ORDER.some((flow) => prevu[flow] > 0)
}

export interface Ecart {
  flow: Flow
  prevu: number
  reel: number
  ecart: number
}

/**
 * Écarts qui méritent une explication.
 *
 * Deux conditions cumulées, pour ne pas réclamer une note à chaque arrondi :
 * un écart d'au moins un cinquième du montant prévu, et d'au moins cinquante
 * euros. Un loyer qui augmente de dix euros ne demande rien ; un loyer qui
 * passe de 700 à 900 se remarque.
 */
export function ecartsNotables(prevu: FlowTotals, reel: FlowTotals): Ecart[] {
  return FLOW_ORDER.map((flow) => ({
    flow,
    prevu: prevu[flow],
    reel: reel[flow],
    ecart: reel[flow] - prevu[flow],
  }))
    .filter((e) => e.prevu > 0 && Math.abs(e.ecart) >= 50 && Math.abs(e.ecart) >= e.prevu * 0.2)
    .sort((a, b) => Math.abs(b.ecart) - Math.abs(a.ecart))
}

/**
 * Un écart est-il bon signe ? Il l'est quand il va dans le sens du flux :
 * plus de revenus ou d'épargne que prévu, moins de charges ou d'envies.
 */
export function favorable(flow: Flow, ecart: number): boolean {
  return flow === 'income' || flow === 'saving' ? ecart >= 0 : ecart <= 0
}
