import type { ChallengeCadence, GrowthStage } from './types'

/**
 * Progression.
 *
 * La courbe est volontairement sans plafond : le coût d'un niveau croît de
 * façon régulière, ce qui garde un rythme de récompense lisible même très
 * loin dans le jeu. Les paliers de croissance suivent une métaphore végétale,
 * accordée à l'univers visuel de l'app.
 */

/** XP nécessaire pour passer du niveau `level` au suivant. */
export function xpToNextLevel(level: number): number {
  return Math.round(110 * Math.pow(level, 1.15))
}

/** XP cumulée requise pour atteindre `level` en partant du niveau 1. */
export function cumulativeXpFor(level: number): number {
  let total = 0
  for (let l = 1; l < level; l += 1) total += xpToNextLevel(l)
  return total
}

export interface LevelState {
  level: number
  /** XP acquise à l'intérieur du niveau courant. */
  xpInLevel: number
  xpForLevel: number
  progress: number
  totalXp: number
}

export function levelFromXp(totalXp: number): LevelState {
  let level = 1
  let remaining = Math.max(0, totalXp)
  let need = xpToNextLevel(level)
  while (remaining >= need) {
    remaining -= need
    level += 1
    need = xpToNextLevel(level)
  }
  return { level, xpInLevel: remaining, xpForLevel: need, progress: remaining / need, totalXp }
}

/**
 * Paliers de croissance. Au-delà du dernier, on entre dans les « saisons »,
 * qui rendent la progression réellement sans fin.
 */
export const GROWTH_STAGES: GrowthStage[] = [
  { id: 'seed', label: 'Graine', fromLevel: 1, blurb: 'Tout part de là. Vous avez ouvert le sujet.' },
  { id: 'sprout', label: 'Germe', fromLevel: 3, blurb: 'Les premières habitudes percent la surface.' },
  { id: 'shoot', label: 'Pousse', fromLevel: 6, blurb: 'Le suivi devient un réflexe.' },
  { id: 'plant', label: 'Jeune plant', fromLevel: 10, blurb: 'Votre budget tient debout tout seul.' },
  { id: 'bush', label: 'Arbuste', fromLevel: 15, blurb: 'Les imprévus ne vous renversent plus.' },
  { id: 'tree', label: 'Arbre', fromLevel: 22, blurb: 'Vos racines sont solides : le matelas existe.' },
  { id: 'fruit', label: 'Arbre fruitier', fromLevel: 30, blurb: 'Votre épargne commence à produire.' },
  { id: 'orchard', label: 'Verger', fromLevel: 40, blurb: 'Plusieurs poches, plusieurs projets, en parallèle.' },
  { id: 'grove', label: 'Bosquet', fromLevel: 55, blurb: 'Vous arbitrez sans y penser.' },
  { id: 'forest', label: 'Forêt', fromLevel: 70, blurb: 'Votre horizon se compte en années.' },
  { id: 'oldgrowth', label: 'Forêt ancienne', fromLevel: 90, blurb: 'La liberté financière n’est plus abstraite.' },
  { id: 'canopy', label: 'Canopée', fromLevel: 120, blurb: 'Vous êtes au sommet. Les saisons prennent le relais.' },
]

export function stageForLevel(level: number): GrowthStage {
  let current = GROWTH_STAGES[0]
  for (const stage of GROWTH_STAGES) {
    if (level >= stage.fromLevel) current = stage
  }
  return current
}

export function nextStage(level: number): GrowthStage | null {
  return GROWTH_STAGES.find((stage) => stage.fromLevel > level) ?? null
}

/**
 * Saisons : cycles de trois mois qui recyclent le catalogue de défis autour
 * d'un thème. Elles s'enchaînent indéfiniment, ce qui donne un horizon de
 * progression sans limite une fois la canopée atteinte.
 */
export const SEASON_THEMES = [
  {
    id: 'racines',
    label: 'Racines',
    blurb: 'On consolide les fondations : charges fixes, matelas de sécurité.',
    icon: 'Sprout',
  },
  {
    id: 'floraison',
    label: 'Floraison',
    blurb: 'On fait grandir l’épargne et on ouvre de nouvelles poches.',
    icon: 'Flower2',
  },
  {
    id: 'recolte',
    label: 'Récolte',
    blurb: 'On concrétise : un objectif atteint, une dette éteinte.',
    icon: 'Wheat',
  },
  {
    id: 'repos',
    label: 'Repos',
    blurb: 'On allège, on résilie, on prépare l’année suivante.',
    icon: 'Snowflake',
  },
] as const

export interface Season {
  index: number
  theme: (typeof SEASON_THEMES)[number]
  label: string
  startMonth: string
  endMonth: string
}

/** Saison couvrant un mois donné, numérotée depuis le lancement de l'app. */
export function seasonForMonth(monthKey: string, epoch = '2026-01'): Season {
  const [year, month] = monthKey.split('-').map(Number)
  const [ey, em] = epoch.split('-').map(Number)
  const monthsSinceEpoch = (year - ey) * 12 + (month - em)
  const index = Math.floor(monthsSinceEpoch / 3)
  const theme = SEASON_THEMES[((index % 4) + 4) % 4]
  const startIdx = index * 3
  const toKey = (offset: number) => {
    const total = ey * 12 + (em - 1) + offset
    return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`
  }
  return {
    index: index + 1,
    theme,
    label: `Saison ${index + 1} · ${theme.label}`,
    startMonth: toKey(startIdx),
    endMonth: toKey(startIdx + 2),
  }
}

/** Multiplicateur d'XP lié à la série en cours. Plafonné pour rester juste. */
export function streakMultiplier(streakDays: number): number {
  if (streakDays >= 90) return 2
  if (streakDays >= 30) return 1.5
  if (streakDays >= 14) return 1.25
  if (streakDays >= 7) return 1.1
  return 1
}

export const CADENCE_META: Record<
  ChallengeCadence,
  { label: string; plural: string; icon: string; resetHint: string }
> = {
  unique: {
    label: 'Découverte',
    plural: 'À faire une fois',
    icon: 'Sparkles',
    resetHint: 'Ne se rejoue pas',
  },
  monthly: {
    label: 'Ce mois-ci',
    plural: 'Quêtes du mois',
    icon: 'CalendarRange',
    resetHint: 'Se rejoue chaque mois',
  },
  yearly: {
    label: 'Cette année',
    plural: 'Quêtes de l’année',
    icon: 'Trophy',
    resetHint: 'Se compte sur l’année civile',
  },
}

export const DIFFICULTY_META = {
  douce: { label: 'Douce', dots: 1 },
  moyenne: { label: 'Moyenne', dots: 2 },
  costaude: { label: 'Costaude', dots: 3 },
  héroïque: { label: 'Héroïque', dots: 4 },
} as const

export const RARITY_META = {
  commun: { label: 'Commun', ring: 'ring-line-strong' },
  rare: { label: 'Rare', ring: 'ring-indigo' },
  épique: { label: 'Épique', ring: 'ring-orchid' },
  légendaire: { label: 'Légendaire', ring: 'ring-amber' },
} as const
