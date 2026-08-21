import type { GoalKind, Strategy } from './types'

/** Ce que l'onboarding propose, dans l'ordre d'affichage. */
export const GOAL_CATALOG: {
  kind: GoalKind
  label: string
  tagline: string
  icon: string
  /** Suggestion de montant, ajustable ; `null` quand il se calcule. */
  suggestedAmount: number | null
  suggestedMonths: number
}[] = [
  {
    kind: 'emergency',
    label: "Fonds d'urgence",
    tagline: '3 à 6 mois de dépenses pour absorber les imprévus sereinement.',
    icon: 'Umbrella',
    suggestedAmount: null,
    suggestedMonths: 12,
  },
  {
    kind: 'debt_exit',
    label: 'Sortir du rouge',
    tagline: 'Éteindre le découvert et les crédits, poste par poste.',
    icon: 'TrendingDown',
    suggestedAmount: null,
    suggestedMonths: 6,
  },
  {
    kind: 'travel',
    label: 'Voyage',
    tagline: 'Découvrir le monde en épargnant pour vos prochaines aventures.',
    icon: 'Plane',
    suggestedAmount: 2000,
    suggestedMonths: 12,
  },
  {
    kind: 'home',
    label: 'Appartement / maison',
    tagline: 'Constituer l’apport de votre futur chez-vous.',
    icon: 'HousePlus',
    suggestedAmount: 20000,
    suggestedMonths: 48,
  },
  {
    kind: 'study',
    label: 'Études / formation',
    tagline: 'Investir sur vous pour développer vos compétences.',
    icon: 'GraduationCap',
    suggestedAmount: 5000,
    suggestedMonths: 18,
  },
  {
    kind: 'purchase',
    label: 'Achat personnel',
    tagline: 'Voiture, matériel, équipement : préparer l’achat au lieu de le subir.',
    icon: 'ShoppingBag',
    suggestedAmount: 1500,
    suggestedMonths: 9,
  },
  {
    kind: 'retirement',
    label: 'Retraite',
    tagline: 'Préparer votre avenir et profiter pleinement de la retraite.',
    icon: 'Palmtree',
    suggestedAmount: 60000,
    suggestedMonths: 240,
  },
  {
    kind: 'freedom',
    label: 'Liberté financière',
    tagline: 'Gagner en autonomie et vivre la vie dont vous rêvez vraiment.',
    icon: 'Bird',
    suggestedAmount: 100000,
    suggestedMonths: 180,
  },
]

/**
 * Une stratégie par famille d'objectif.
 *
 * Les répartitions s'inspirent de la règle 50/30/20 popularisée par Elizabeth
 * Warren, ajustées selon l'urgence de l'objectif. Ce sont des repères
 * pédagogiques d'arbitrage budgétaire, pas des recommandations de placement.
 */
export const STRATEGIES: Record<GoalKind, Strategy> = {
  emergency: {
    id: 'bouclier',
    name: 'Le Bouclier',
    rationale:
      "Tant que le matelas de sécurité n'existe pas, le moindre imprévu se transforme en dette. On construit d'abord un mois de charges, puis trois, puis six.",
    rule: { needs: 50, wants: 20, future: 30 },
    priorities: [
      "Atteindre un mois de charges contraintes en fonds d'urgence",
      'Automatiser le virement le jour de la paie',
      'Plafonner les dépenses plaisir le temps de la construction',
    ],
    featuredChallenges: ['m_save_10', 'w_no_delivery', 'd_no_spend'],
  },
  debt_exit: {
    id: 'extincteur',
    name: "L'Extincteur",
    rationale:
      "Un découvert coûte des agios chaque mois où il dure : c'est le placement à rendement négatif garanti. On l'éteint en priorité, avant toute épargne au-delà d'un petit matelas.",
    rule: { needs: 55, wants: 10, future: 35 },
    priorities: [
      'Garder 500 € de matelas, puis tout envoyer sur la dette',
      'Attaquer la dette au taux le plus élevé en premier',
      'Supprimer les frais bancaires évitables (retraits hors réseau, incidents)',
    ],
    featuredChallenges: ['m_no_atm', 'm_no_overdraft', 'w_cash_only'],
  },
  travel: {
    id: 'boussole',
    name: 'La Boussole',
    rationale:
      "Un voyage se finance à l'avance ou se paie en crédit. On isole une poche dédiée pour que l'argent du départ ne serve jamais à autre chose.",
    rule: { needs: 50, wants: 25, future: 25 },
    priorities: [
      'Chiffrer le voyage poste par poste',
      'Virer le montant mensuel dès la paie sur une poche dédiée',
      'Convertir les économies du quotidien en jours de voyage',
    ],
    featuredChallenges: ['w_no_delivery', 'm_sub_audit', 'd_round_up'],
  },
  home: {
    id: 'fondations',
    name: 'Les Fondations',
    rationale:
      "Un apport se construit sur des années : la régularité pèse davantage que l'intensité. On sécurise l'effort mensuel plutôt que de viser des à-coups.",
    rule: { needs: 50, wants: 15, future: 35 },
    priorities: [
      "Fixer un effort mensuel tenable sur toute la durée",
      "Conserver le fonds d'urgence intact en parallèle",
      'Suivre la progression trimestre par trimestre',
    ],
    featuredChallenges: ['m_save_10', 'm_under_budget', 'y_save_15'],
  },
  study: {
    id: 'atelier',
    name: "L'Atelier",
    rationale:
      "Une formation est un investissement à échéance courte. On sanctuarise le montant sur une poche dédiée pour ne jamais avoir à y renoncer faute de trésorerie.",
    rule: { needs: 50, wants: 20, future: 30 },
    priorities: [
      'Chiffrer le coût total, frais annexes compris',
      "Vérifier les financements existants avant d'épargner le reste",
      "Étaler l'effort jusqu'à l'inscription",
    ],
    featuredChallenges: ['m_save_10', 'w_review', 'd_log'],
  },
  purchase: {
    id: 'etabli',
    name: "L'Établi",
    rationale:
      "Payer comptant un achat prévu coûte toujours moins cher qu'un paiement en plusieurs fois. On se donne le délai nécessaire pour éviter le crédit.",
    rule: { needs: 50, wants: 20, future: 30 },
    priorities: [
      "Reporter l'achat jusqu'à la constitution complète du montant",
      'Comparer le prix comptant au coût total du financement',
      'Recycler les revenus exceptionnels vers la poche projet',
    ],
    featuredChallenges: ['d_cart_pause', 'w_sell', 'm_under_budget'],
  },
  retirement: {
    id: 'horizon',
    name: "L'Horizon",
    rationale:
      "Sur un horizon long, c'est la durée qui fait le résultat, bien plus que le montant de départ. Commencer petit mais tôt bat commencer gros mais tard.",
    rule: { needs: 50, wants: 20, future: 30 },
    priorities: [
      "Estimer l'écart entre la pension attendue et le niveau de vie souhaité",
      'Verser un montant fixe tous les mois, sans interruption',
      'Réévaluer la cible une fois par an',
    ],
    featuredChallenges: ['y_save_15', 'm_save_10', 'y_12_closed'],
  },
  freedom: {
    id: 'envol',
    name: "L'Envol",
    rationale:
      "L'autonomie financière se mesure en mois de dépenses couverts sans revenu. Chaque euro de charge fixe supprimée compte double : il réduit la cible et augmente l'épargne.",
    rule: { needs: 45, wants: 15, future: 40 },
    priorities: [
      'Faire baisser le socle de charges contraintes',
      "Viser un taux d'épargne durablement supérieur à 25 %",
      'Suivre le nombre de mois de liberté déjà acquis',
    ],
    featuredChallenges: ['y_save_15', 'm_sub_audit', 'm_under_budget'],
  },
}

export const STRATEGY_BY_ID: Record<string, Strategy> = Object.fromEntries(
  Object.values(STRATEGIES).map((s) => [s.id, s]),
)

/**
 * Montant conseillé pour un fonds d'urgence : un nombre de mois de charges
 * contraintes, dettes comprises.
 */
export function emergencyFundTarget(monthlyFixed: number, monthlyDebt: number, months = 3): number {
  return Math.round((monthlyFixed + monthlyDebt) * months)
}

/** Traduit une règle de répartition en montants, pour un revenu donné. */
export function applyRule(
  strategy: Strategy,
  income: number,
): { needs: number; wants: number; future: number } {
  return {
    needs: (income * strategy.rule.needs) / 100,
    wants: (income * strategy.rule.wants) / 100,
    future: (income * strategy.rule.future) / 100,
  }
}
