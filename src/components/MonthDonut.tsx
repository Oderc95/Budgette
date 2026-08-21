import { Cell, Pie, PieChart, Tooltip } from 'recharts'
import type { MonthSummary } from '../domain/budget'
import { euro } from '../lib/format'

/**
 * Répartition du revenu du mois en anneau compact, pour la synthèse de saisie.
 *
 * Les tranches suivent l'ordre et les teintes sémantiques des flux, les mêmes
 * que partout ailleurs dans l'app — la couleur suit le poste, jamais le rang.
 * L'écart entre l'ambre et la framboise étant court pour certaines visions des
 * couleurs, l'identité ne repose pas que sur la teinte : les tranches sont
 * séparées d'un liseré de fond, et les montants chiffrés sont étiquetés en
 * clair juste à côté de l'anneau.
 *
 * Le graphique reçoit sa taille en dur : le conteneur adaptatif de recharts
 * transmet des dimensions fantaisistes (voir TrendChart), et un anneau de
 * synthèse n'a de toute façon qu'une seule taille utile.
 */
export function MonthDonut({ summary, size = 92 }: { summary: MonthSummary; size?: number }) {
  const slices = [
    { name: 'Charges', value: summary.totals.fixed, fill: 'var(--c-indigo)' },
    { name: 'Dettes', value: summary.totals.debt, fill: 'var(--c-berry)' },
    { name: 'Épargne', value: summary.totals.saving, fill: 'var(--c-amber)' },
    { name: 'Plaisir', value: summary.totals.discretionary, fill: 'var(--c-orchid)' },
    { name: 'Non affecté', value: Math.max(0, summary.endOfMonth), fill: 'var(--c-surface-3)' },
  ].filter((slice) => slice.value > 0)

  if (slices.length === 0) return null

  return (
    <PieChart width={size} height={size} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
      <Pie
        data={slices}
        dataKey="value"
        nameKey="name"
        innerRadius={size * 0.3}
        outerRadius={size * 0.48}
        startAngle={90}
        endAngle={-270}
        stroke="var(--c-surface)"
        strokeWidth={2}
        isAnimationActive={false}
      >
        {slices.map((slice) => (
          <Cell key={slice.name} fill={slice.fill} />
        ))}
      </Pie>
      <Tooltip
        contentStyle={{
          background: 'var(--c-surface)',
          border: '1px solid var(--c-border)',
          borderRadius: 12,
          fontSize: 12,
          color: 'var(--c-text)',
          boxShadow: 'var(--shadow-soft)',
          padding: '6px 10px',
        }}
        itemStyle={{ color: 'var(--c-text)' }}
        formatter={(value, name) => [euro(Number(value)), String(name)]}
      />
    </PieChart>
  )
}
