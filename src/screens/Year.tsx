import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import { useApp } from '../store/useApp'
import { EcartAnnuel } from '../components/EcartAnnuel'
import { CATEGORIES, CATEGORY_BY_ID, FLOW_META } from '../domain/categories'
import { summarize } from '../domain/budget'
import type { MonthKey, PlannedItem } from '../domain/types'
import { Button, Card } from '../components/ui/primitives'
import { TONE } from '../components/ui/tone'
import { Icon } from '../components/Icon'
import { useCascade } from '../lib/useCascade'
import { burst } from '../lib/wow'
import { newId } from '../lib/id'
import { euro, euroSigned, monthKey, monthLabel } from '../lib/format'

const MOIS_PLEINS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

/** Les catégories qui se planifient : tout sauf le report automatique. */
const PLANIFIABLES = CATEGORIES.filter((c) => c.id !== 'inc_carryover')

/**
 * Mon année : le calendrier géant, un mois par case.
 *
 * La vue est mensuelle, jamais journalière : douze grandes cases qui montrent,
 * pour chaque mois, ce qui est prévu — les charges fixes répétées toute
 * l'année, les dépenses ponctuelles posées sur leur mois, les charges à venir
 * préparées à l'avance. On clique une case pour y planifier un élément ; la
 * saisie du mois (« Mon mois ») retrouve ensuite le détail de ce qui était
 * prévu, montants compris, et le pose d'un geste.
 */
export function Year() {
  const budgets = useApp((s) => s.budgets)
  const planned = useApp((s) => s.planned)
  const removePlanned = useApp((s) => s.removePlanned)

  const live = monthKey(new Date())
  const [annee, setAnnee] = useState(Number(live.slice(0, 4)))
  const [creating, setCreating] = useState<MonthKey | null>(null)
  const grille = useCascade<HTMLDivElement>(':scope > *', [annee], { step: 25 })

  const parMois = Array.from({ length: 12 }, (_, index) => {
    const key = `${annee}-${String(index + 1).padStart(2, '0')}`
    const budget = budgets.find((b) => b.month === key)
    // Les récurrents d'abord — l'ossature du mois — puis les ponctuels.
    const items = planned
      .filter((item) => item.recurrence === 'monthly' || item.month === key)
      .sort((a, b) =>
        a.recurrence === b.recurrence
          ? a.label.localeCompare(b.label, 'fr')
          : a.recurrence === 'monthly'
            ? -1
            : 1,
      )
    return { key, index, budget, items, summary: summarize(budget, key) }
  })
  const suivis = parMois.filter((m) => m.budget && m.budget.lines.length > 0)
  const totalEpargne = suivis.reduce((sum, m) => sum + m.summary.totals.saving, 0)
  const resteMoyen =
    suivis.length > 0 ? suivis.reduce((sum, m) => sum + m.summary.livingAllowance, 0) / suivis.length : 0

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow">Mon année</p>
          <div className="mt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAnnee(annee - 1)}
              className="grid size-8 place-items-center rounded-lg border border-line text-ink-soft transition hover:bg-surface-2"
              aria-label="Année précédente"
            >
              <Icon name="ChevronLeft" size={16} />
            </button>
            <h1 className="text-center font-display text-[1.55rem] leading-tight text-ink sm:text-[2rem]">
              Calendrier {annee}
            </h1>
            <button
              type="button"
              onClick={() => setAnnee(annee + 1)}
              className="grid size-8 place-items-center rounded-lg border border-line text-ink-soft transition hover:bg-surface-2"
              aria-label="Année suivante"
            >
              <Icon name="ChevronRight" size={16} />
            </button>
          </div>
          <p className="mt-1.5 max-w-2xl text-[0.9rem] leading-relaxed text-ink-soft">
            Cliquez un mois pour y planifier une charge fixe — répétée chaque mois —, une dépense
            ponctuelle ou une charge à venir. « Mon mois » proposera de tout préremplir.
          </p>
        </div>
      </header>

      {/* Le récap annuel, en trois chiffres */}
      {/* L'écart aux prévisions, avant le détail mois par mois : c'est la
          lecture d'ensemble qu'on vient chercher sur cet écran. */}
      <EcartAnnuel annee={annee} />

      <Card>
        <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:grid-cols-3">
          <div className="min-w-0">
            <p className="eyebrow">Total épargné</p>
            <p className="tabular mt-1 font-display text-lg text-amber-deep sm:text-xl">{euro(totalEpargne)}</p>
          </div>
          <div className="min-w-0">
            <p className="eyebrow">Reste à vivre moyen</p>
            <p className="tabular mt-1 font-display text-lg text-ink sm:text-xl">{euro(resteMoyen)} / mois</p>
          </div>
          <div className="min-w-0">
            <p className="eyebrow">Mois suivis</p>
            <p className="tabular mt-1 font-display text-lg text-ink sm:text-xl">{suivis.length} / 12</p>
          </div>
        </div>
      </Card>

      {/* Le calendrier géant : une grande case par mois, cliquable */}
      <div ref={grille} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {parMois.map((m) => {
          const courant = m.key === live
          const suivi = !!m.budget && m.budget.lines.length > 0
          const totalPrevu = m.items.reduce((sum, item) => sum + item.amount, 0)
          return (
            <div
              key={m.key}
              role="button"
              tabIndex={0}
              onClick={() => setCreating(m.key)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setCreating(m.key)
                }
              }}
              aria-label={`Planifier un élément en ${MOIS_PLEINS[m.index]} ${annee}`}
              className={clsx(
                'card group flex min-h-[12rem] cursor-pointer flex-col p-3.5 text-left transition hover:-translate-y-0.5',
                courant && 'ring-2 ring-brand/35',
              )}
            >
              <header className="flex items-center gap-2">
                <span
                  className={clsx(
                    'font-display text-[1.05rem] leading-none',
                    courant ? 'text-brand-deep' : 'text-ink',
                  )}
                >
                  {MOIS_PLEINS[m.index]}
                </span>
                {courant && (
                  <span className="chip bg-brand-soft px-1.5 py-0 text-[0.62rem] text-brand-deep">en cours</span>
                )}
                <span
                  className="ml-auto grid size-7 shrink-0 place-items-center rounded-lg border border-line text-ink-muted transition group-hover:border-brand group-hover:bg-brand-soft group-hover:text-brand-deep"
                  aria-hidden
                >
                  <Icon name="Plus" size={14} />
                </span>
              </header>

              <ul className="mt-2.5 flex flex-1 flex-col gap-1">
                {m.items.map((item) => {
                  const tone = TONE[FLOW_META[CATEGORY_BY_ID[item.categoryId]?.flow ?? 'fixed'].tone]
                  return (
                    <li key={item.id} className={clsx('flex items-center gap-1.5 rounded-lg px-2 py-1', tone.bg)}>
                      {item.recurrence === 'monthly' && (
                        <Icon name="Repeat" size={10} className={clsx('shrink-0', tone.deep)} aria-label="Chaque mois" />
                      )}
                      <span className={clsx('min-w-0 flex-1 truncate text-[0.72rem] font-medium', tone.deep)}>
                        {item.label}
                      </span>
                      <span className={clsx('tabular shrink-0 text-[0.72rem] font-semibold', tone.deep)}>
                        {euro(item.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          removePlanned(item.id)
                        }}
                        aria-label={`Supprimer ${item.label}`}
                        title={item.recurrence === 'monthly' ? 'Supprimer — tous les mois' : 'Supprimer'}
                        className="zone-appui grid size-5 shrink-0 place-items-center rounded text-ink-muted transition hover:text-berry-deep"
                      >
                        <Icon name="X" size={11} />
                      </button>
                    </li>
                  )
                })}
                {m.items.length === 0 && (
                  <li className="rounded-lg border border-dashed border-line px-2 py-1.5 text-[0.7rem] text-ink-muted">
                    Rien de prévu — cliquez pour planifier
                  </li>
                )}
              </ul>

              <footer className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 border-t border-line pt-2 text-[0.68rem] text-ink-muted">
                {totalPrevu > 0 && (
                  <span>
                    Prévu <span className="tabular font-semibold text-ink">{euro(totalPrevu)}</span>
                  </span>
                )}
                {suivi && (
                  <>
                    <span>
                      Épargne{' '}
                      <span className="tabular font-semibold text-amber-deep">{euro(m.summary.totals.saving)}</span>
                    </span>
                    <span>
                      Fin{' '}
                      <span
                        className={clsx(
                          'tabular font-semibold',
                          m.summary.endOfMonth >= 0 ? 'text-mint-deep' : 'text-berry-deep',
                        )}
                      >
                        {euroSigned(m.summary.endOfMonth)}
                      </span>
                    </span>
                  </>
                )}
                {totalPrevu === 0 && !suivi && <span>Mois libre</span>}
              </footer>
            </div>
          )
        })}
      </div>

      <AnimatePresence>
        {creating !== null && <PlanDialog month={creating} onClose={() => setCreating(null)} />}
      </AnimatePresence>
    </div>
  )
}

/** Planifier un élément sur un mois : intitulé, montant, catégorie, portée. */
function PlanDialog({ month, onClose }: { month: MonthKey; onClose: () => void }) {
  const addPlanned = useApp((s) => s.addPlanned)
  const pushToast = useApp((s) => s.pushToast)
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState(0)
  const [categoryId, setCategoryId] = useState('fix_other')
  const [recurrence, setRecurrence] = useState<PlannedItem['recurrence']>('monthly')

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-[rgb(0_0_0/0.45)] p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="card w-full max-w-md p-6"
        initial={{ scale: 0.95, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0 }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Planifier un élément"
      >
        <h2 className="font-display text-2xl capitalize text-ink">{monthLabel(month)}</h2>
        <p className="mt-1 text-[0.85rem] text-ink-muted">
          Une charge fixe se répète chaque mois de l'année ; une dépense ponctuelle ne touche que ce
          mois. La saisie du mois proposera de tout préremplir.
        </p>

        <label className="mt-4 block">
          <span className="text-[0.85rem] font-semibold text-ink">Intitulé</span>
          <input
            autoFocus
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Loyer, assurance, cadeau…"
            className="mt-1.5 w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-[0.9rem] text-ink outline-none focus:border-brand"
          />
        </label>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[0.85rem] font-semibold text-ink">Montant</span>
            <span className="relative mt-1.5 block">
              <input
                type="number"
                min={1}
                value={amount || ''}
                onChange={(event) => setAmount(Math.max(0, Number(event.target.value)))}
                className="tabular w-full rounded-xl border border-line bg-surface px-4 py-2.5 pr-8 text-right text-[0.9rem] text-ink outline-none focus:border-brand"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-[0.85rem] text-ink-muted">€</span>
            </span>
          </label>
          <label className="block">
            <span className="text-[0.85rem] font-semibold text-ink">Portée</span>
            <select
              value={recurrence}
              onChange={(event) => setRecurrence(event.target.value as PlannedItem['recurrence'])}
              className="mt-1.5 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[0.9rem] text-ink outline-none focus:border-brand"
            >
              <option value="monthly">Chaque mois</option>
              <option value="once">Ce mois uniquement</option>
            </select>
          </label>
        </div>

        <label className="mt-3 block">
          <span className="text-[0.85rem] font-semibold text-ink">Catégorie</span>
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[0.9rem] text-ink outline-none focus:border-brand"
          >
            {PLANIFIABLES.map((category) => (
              <option key={category.id} value={category.id}>
                {FLOW_META[category.flow].short} — {category.label}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button
            icon="CalendarCheck"
            disabled={!label.trim() || amount <= 0}
            onClick={(event) => {
              burst(event.currentTarget as HTMLElement, ['indigo', 'amber'])
              addPlanned({
                id: newId('plan'),
                label: label.trim(),
                categoryId,
                amount: Math.round(amount),
                day: 1,
                recurrence,
                month: recurrence === 'once' ? month : undefined,
              })
              pushToast({
                title: 'Planifié !',
                detail:
                  recurrence === 'monthly'
                    ? `${label.trim()} · chaque mois`
                    : `${label.trim()} · ${monthLabel(month)}`,
                tone: 'indigo',
                icon: 'CalendarCheck',
              })
              onClose()
            }}
          >
            Planifier
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
