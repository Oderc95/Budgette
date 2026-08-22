import { useApp } from '../store/useApp'
import { CATEGORY_BY_ID } from '../domain/categories'
import type { MonthKey } from '../domain/types'
import { Card, CardHeader, Progress } from './ui/primitives'
import { Icon } from './Icon'
import { euro, monthLabel } from '../lib/format'

/**
 * Comparaison au mois de référence.
 *
 * Le mois de référence — par défaut le dernier mois clôturé — dit ce qui est
 * « attendu » : ses charges contraintes et ses dettes, sauf les lignes
 * marquées ponctuelles et les catégories déclarées « plus d'actualité ». La
 * carte mesure l'avancement de la saisie contre cet attendu, et surtout pose
 * la bonne question pour chaque charge attendue mais absente : reprise, ou
 * plus d'actualité ?
 */
export function ReferenceCard({ month }: { month: MonthKey }) {
  const budgets = useApp((s) => s.budgets)
  const referenceMonth = useApp((s) => s.referenceMonth)
  const setReferenceMonth = useApp((s) => s.setReferenceMonth)
  const retired = useApp((s) => s.retired)
  const retireCategory = useApp((s) => s.retireCategory)
  const restoreCategory = useApp((s) => s.restoreCategory)
  const setLine = useApp((s) => s.setLine)
  const pushToast = useApp((s) => s.pushToast)

  const closedMonths = budgets.filter((b) => b.closed && b.month !== month).map((b) => b.month)
  const reference = budgets.find((b) => b.month === referenceMonth && b.month !== month && b.closed)
  const current = budgets.find((b) => b.month === month)

  const selecteur = closedMonths.length > 0 && (
    <select
      value={reference?.month ?? ''}
      onChange={(event) => setReferenceMonth(event.target.value || null)}
      className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[0.78rem] text-ink outline-none focus:border-brand"
      aria-label="Choisir le mois de référence"
    >
      <option value="">Aucune référence</option>
      {closedMonths.map((m) => (
        <option key={m} value={m}>
          {monthLabel(m)}
        </option>
      ))}
    </select>
  )

  if (!reference) {
    if (closedMonths.length === 0) return null
    return (
      <Card>
        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-indigo-soft text-indigo-deep">
            <Icon name="CalendarCheck" size={17} />
          </span>
          <p className="min-w-0 flex-1 text-[0.85rem] text-ink-soft">
            Choisissez un mois de référence : il dira ce qui est attendu chaque mois.
          </p>
          {selecteur}
        </div>
      </Card>
    )
  }

  const amountOf = (categoryId: string) =>
    current?.lines.find((l) => l.categoryId === categoryId)?.amount ?? 0

  /* Ce que la référence laisse attendre : charges et dettes, hors ponctuel
     et hors catégories retirées depuis. */
  const expected = reference.lines.filter((line) => {
    const category = CATEGORY_BY_ID[line.categoryId]
    if (!category || (category.flow !== 'fixed' && category.flow !== 'debt')) return false
    if (line.oneOff) return false
    return !retired[line.categoryId]
  })

  const expectedTotal = expected.reduce((sum, line) => sum + line.amount, 0)
  const enteredTotal = expected.reduce((sum, line) => sum + Math.min(amountOf(line.categoryId), line.amount), 0)
  const missing = expected.filter((line) => amountOf(line.categoryId) === 0)
  const retiredIds = Object.keys(retired)

  return (
    <Card>
      <CardHeader
        title={`Par rapport à ${monthLabel(reference.month)}`}
        hint="Votre mois de référence"
        icon="CalendarCheck"
        tone="indigo"
        action={selecteur}
      />
      <div className="px-5 pb-5">
        <div className="mb-1.5 flex items-baseline justify-between text-[0.8rem]">
          <span className="text-ink-soft">Charges attendues couvertes</span>
          <span className="tabular font-semibold text-ink">
            {euro(enteredTotal)} / {euro(expectedTotal)}
          </span>
        </div>
        <Progress
          value={expectedTotal > 0 ? enteredTotal / expectedTotal : 1}
          tone="indigo"
          height={8}
          label="Avancement par rapport au mois de référence"
        />

        {missing.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2">
            {missing.map((line) => {
              const category = CATEGORY_BY_ID[line.categoryId]
              return (
                <li
                  key={line.categoryId}
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-surface text-ink-soft">
                    <Icon name={category.icon} size={14} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.85rem] font-medium text-ink">{category.label}</span>
                    <span className="tabular block text-[0.72rem] text-ink-muted">
                      {euro(line.amount)} en {monthLabel(reference.month).split(' ')[0]}
                    </span>
                  </span>
                  <span className="flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setLine(month, line.categoryId, line.amount)}
                      className="chip bg-mint-soft text-mint-deep transition hover:brightness-95"
                    >
                      <Icon name="Undo2" size={12} />
                      Reprendre
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        retireCategory(line.categoryId, month)
                        pushToast({
                          title: 'Charge retirée',
                          detail: `${category.label} ne sera plus attendue.`,
                          tone: 'indigo',
                          icon: 'Check',
                        })
                      }}
                      className="chip border border-line bg-surface text-ink-muted transition hover:text-ink"
                    >
                      Plus d'actualité
                    </button>
                  </span>
                </li>
              )
            })}
          </ul>
        )}

        {missing.length === 0 && (
          <p className="mt-3 flex items-center gap-1.5 text-[0.8rem] text-mint-deep">
            <Icon name="CheckCircle2" size={14} />
            Toutes les charges attendues sont saisies.
          </p>
        )}

        {retiredIds.length > 0 && (
          <div className="mt-4 border-t border-line pt-3">
            <p className="mb-1.5 text-[0.72rem] font-semibold uppercase tracking-wider text-ink-muted">
              Retirées du suivi
            </p>
            <div className="flex flex-wrap gap-1.5">
              {retiredIds.map((categoryId) => (
                <button
                  key={categoryId}
                  type="button"
                  onClick={() => restoreCategory(categoryId)}
                  className="chip border border-line bg-surface text-ink-muted transition hover:text-ink"
                  title="Réactiver cette charge"
                >
                  {CATEGORY_BY_ID[categoryId]?.label ?? categoryId}
                  <Icon name="RotateCcw" size={11} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
