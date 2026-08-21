import type { MonthBudget, MonthKey, Tone } from './types'
import { averageFlow, breakdown, summarize, totalsByFlow } from './budget'
import { euro } from '../lib/format'

export interface Insight {
  id: string
  title: string
  body: string
  tone: Tone
  icon: string
  /** Une action concrète, pas un simple constat. */
  action?: string
  /** Priorité d'affichage, la plus haute d'abord. */
  weight: number
}

/**
 * Analyses affichées à l'utilisateur.
 *
 * Chaque analyse est descriptive et pédagogique : elle explique un chiffre et
 * propose un geste budgétaire. Aucune ne constitue un conseil en
 * investissement ni une recommandation de produit financier.
 */
export function buildInsights(budgets: MonthBudget[], month: MonthKey): Insight[] {
  const current = budgets.find((b) => b.month === month)
  const summary = summarize(current, month)
  const closed = budgets.filter((b) => b.closed && b.month !== month)
  const insights: Insight[] = []

  if (!current || current.lines.length === 0) {
    return [
      {
        id: 'empty',
        title: 'Le mois est encore vierge',
        body: "Saisissez vos revenus et vos charges fixes : deux minutes suffisent pour obtenir une première photo.",
        tone: 'sage',
        icon: 'PenLine',
        action: 'Commencer la saisie',
        weight: 100,
      },
    ]
  }

  // Retraits d'espèces : poste souvent invisible, et facturé hors réseau.
  const cash = breakdown(current, 'discretionary').find((b) => b.categoryId === 'dis_cash')
  if (cash && cash.amount > 100) {
    insights.push({
      id: 'cash',
      title: `${euro(cash.amount)} retirés en espèces`,
      body: "L'argent liquide échappe au suivi : une fois retiré, impossible de savoir où il est passé. Les retraits hors réseau sont en plus facturés à l'unité.",
      tone: 'clay',
      icon: 'Banknote',
      action: 'Relever le défi « Mois sans distributeur »',
      weight: 90,
    })
  }

  // Livraison de repas : le poste le plus élastique des budgets urbains.
  const delivery = breakdown(current, 'discretionary').find((b) => b.categoryId === 'dis_delivery')
  const avgDelivery = closed.length
    ? closed.slice(-3).reduce((sum, b) => sum + (b.lines.find((l) => l.categoryId === 'dis_delivery')?.amount ?? 0), 0) /
      Math.min(3, closed.length)
    : 0
  if (delivery && delivery.amount > 60) {
    const delta = avgDelivery > 0 ? delivery.amount - avgDelivery : 0
    insights.push({
      id: 'delivery',
      title: `${euro(delivery.amount)} de livraison de repas`,
      body:
        delta < -10
          ? `C'est ${euro(Math.abs(delta))} de moins que votre moyenne des trois derniers mois. La tendance est bonne.`
          : `Soit environ ${euro(delivery.amount / 4)} par semaine. Deux repas cuisinés de plus par semaine libèrent souvent une centaine d'euros par mois.`,
      tone: delta < -10 ? 'sage' : 'plum',
      icon: 'Bike',
      action: delta < -10 ? undefined : 'Relever le défi « Semaine sans livraison »',
      weight: 80,
    })
  }

  // Poids des charges contraintes.
  if (summary.fixedRate > 0.5) {
    insights.push({
      id: 'fixed',
      title: `Vos charges fixes pèsent ${Math.round(summary.fixedRate * 100)} % du revenu`,
      body: "Au-delà de 50 %, la marge de manœuvre devient très mince et le moindre imprévu se paie à découvert. Les charges fixes sont pourtant les plus faciles à renégocier : assurance, téléphonie, énergie.",
      tone: 'sky',
      icon: 'House',
      action: 'Passer les charges fixes en revue',
      weight: 85,
    })
  }

  // Effort d'épargne.
  if (summary.savingRate >= 0.1) {
    insights.push({
      id: 'saving_good',
      title: `${Math.round(summary.savingRate * 100)} % du revenu mis de côté`,
      body: "Au-dessus de 10 %, vous construisez réellement. C'est le pourcentage, pas le montant, qui fait la différence sur la durée.",
      tone: 'gold',
      icon: 'PiggyBank',
      weight: 70,
    })
  } else if (summary.totals.income > 0) {
    insights.push({
      id: 'saving_low',
      title: "L'épargne du mois reste faible",
      body: "Le réflexe qui marche : virer le montant dès la paie, avant de dépenser. Même 25 € par mois installent l'habitude, et c'est l'habitude qui compte.",
      tone: 'gold',
      icon: 'PiggyBank',
      action: 'Programmer un virement automatique',
      weight: 88,
    })
  }

  // Frais bancaires : signal d'alerte direct.
  const fees = breakdown(current, 'fixed').find((b) => b.categoryId === 'fix_bank_fees')
  if (fees && fees.amount > 15) {
    insights.push({
      id: 'fees',
      title: `${euro(fees.amount)} de frais bancaires`,
      body: "Commissions d'intervention, agios, retraits déplacés : ces frais se déclenchent presque toujours à cause d'un découvert ou d'un retrait hors réseau. Ils sont entièrement évitables.",
      tone: 'clay',
      icon: 'Landmark',
      action: 'Identifier la ligne à l’origine des frais',
      weight: 95,
    })
  }

  // Fin de mois négative.
  if (summary.endOfMonth < 0) {
    insights.push({
      id: 'negative',
      title: `Le mois se termine à ${euro(summary.endOfMonth)}`,
      body: "Repérez le poste qui a dérapé plutôt que de rogner partout : un seul poste explique en général l'essentiel de l'écart.",
      tone: 'clay',
      icon: 'TrendingDown',
      weight: 99,
    })
  }

  // Comparaison au trimestre écoulé.
  if (closed.length >= 3) {
    const avgDiscretionary = averageFlow(closed, 'discretionary', 3)
    const delta = totalsByFlow(current).discretionary - avgDiscretionary
    if (Math.abs(delta) > 40) {
      insights.push({
        id: 'trend',
        title:
          delta < 0
            ? `${euro(Math.abs(delta))} de dépenses plaisir en moins`
            : `${euro(delta)} de dépenses plaisir en plus`,
        body:
          delta < 0
            ? 'Par rapport à votre moyenne des trois derniers mois. Ce sont exactement ces euros-là qui alimentent vos objectifs.'
            : "Par rapport à votre moyenne des trois derniers mois. Rien de grave si c'était prévu ; à surveiller si ça ne l'était pas.",
        tone: delta < 0 ? 'sage' : 'plum',
        icon: delta < 0 ? 'TrendingDown' : 'TrendingUp',
        weight: 60,
      })
    }
  }

  return insights.sort((a, b) => b.weight - a.weight)
}
