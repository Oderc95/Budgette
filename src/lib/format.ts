import type { MonthKey } from '../domain/types'

const EUR = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const EUR_PRECISE = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Montant arrondi à l'euro : la lecture courante dans l'app. */
export function euro(value: number): string {
  return EUR.format(Math.round(value))
}

/** Montant au centime : réservé aux écrans de saisie et de contrôle. */
export function euroPrecise(value: number): string {
  return EUR_PRECISE.format(value)
}

/** Montant signé, avec un `+` explicite sur les valeurs positives. */
export function euroSigned(value: number): string {
  const rounded = Math.round(value)
  return `${rounded > 0 ? '+' : ''}${EUR.format(rounded)}`
}

export function percent(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits).replace('.', ',')} %`
}

const MONTH_NAMES = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

const MONTH_SHORT = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc']

export function monthKey(date: Date): MonthKey {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function parseMonth(key: MonthKey): { year: number; month: number } {
  const [year, month] = key.split('-').map(Number)
  return { year, month }
}

/** « juillet 2026 ». */
export function monthLabel(key: MonthKey): string {
  const { year, month } = parseMonth(key)
  return `${MONTH_NAMES[month - 1]} ${year}`
}

/** « juil. 26 », pour les axes de graphiques. */
export function monthShort(key: MonthKey): string {
  const { year, month } = parseMonth(key)
  return `${MONTH_SHORT[month - 1]} ${String(year).slice(2)}`
}

export function addMonths(key: MonthKey, delta: number): MonthKey {
  const { year, month } = parseMonth(key)
  const total = year * 12 + (month - 1) + delta
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`
}

/** Nombre de mois séparant deux clés, `to` exclu s'il est antérieur. */
export function monthsBetween(from: MonthKey, to: MonthKey): number {
  const a = parseMonth(from)
  const b = parseMonth(to)
  return (b.year - a.year) * 12 + (b.month - a.month)
}

/** Suite de mois inclusive, de `from` à `to`. */
export function monthRange(from: MonthKey, to: MonthKey): MonthKey[] {
  const out: MonthKey[] = []
  const span = monthsBetween(from, to)
  for (let i = 0; i <= span; i += 1) out.push(addMonths(from, i))
  return out
}

/** Clé de jour `AAAA-MM-JJ`. */
export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/** Clé de semaine ISO `AAAA-Wnn`. */
export function weekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNumber = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNumber)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

export function dateLabel(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`
}
