import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import { useApp } from '../store/useApp'
import { CATEGORIES, CATEGORY_BY_ID, FLOW_META } from '../domain/categories'
import { summarize } from '../domain/budget'
import type { PlannedItem } from '../domain/types'
import { Button, Card, CardHeader } from '../components/ui/primitives'
import { TONE } from '../components/ui/tone'
import { Icon } from '../components/Icon'
import { useCascade } from '../lib/useCascade'
import { burst } from '../lib/wow'
import { newId } from '../lib/id'
import { addMonths, euro, euroSigned, monthKey, monthLabel } from '../lib/format'

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MOIS_COURTS = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.']

/** Les catégories qui se planifient : tout sauf le report automatique. */
const PLANIFIABLES = CATEGORIES.filter((c) => c.id !== 'inc_carryover')

/**
 * Mon année : la vue d'ensemble, et le calendrier qui prépare les mois.
 *
 * Le récap annuel aligne les douze mois ; le calendrier, façon agenda, pose
 * des charges, dettes ou versements à une date — récurrents ou ponctuels —
 * que l'écran de saisie propose ensuite de préremplir d'un geste.
 */
export function Year() {
  const budgets = useApp((s) => s.budgets)
  const planned = useApp((s) => s.planned)
  const removePlanned = useApp((s) => s.removePlanned)

  const live = monthKey(new Date())
  const [month, setMonth] = useState(live)
  const [creating, setCreating] = useState<number | null>(null)

  const annee = Number(month.slice(0, 4))
  const moisIndex = Number(month.slice(5, 7)) - 1
  const moisRef = useCascade<HTMLDivElement>(':scope > *', [], { step: 30 })

  /* --- Le calendrier du mois affiché --- */
  const premierJour = new Date(annee, moisIndex, 1)
  const joursDansMois = new Date(annee, moisIndex + 1, 0).getDate()
  // Lundi = 0 : la grille commence le lundi, comme un agenda européen.
  const decalage = (premierJour.getDay() + 6) % 7

  const itemsDuJour = (day: number) =>
    planned.filter(
      (item) => item.day === day && (item.recurrence === 'monthly' || item.month === month),
    )

  /* --- Le récap des douze mois de l'année affichée --- */
  const parMois = Array.from({ length: 12 }, (_, index) => {
    const key = `${annee}-${String(index + 1).padStart(2, '0')}`
    const budget = budgets.find((b) => b.month === key)
    return { key, index, budget, summary: summarize(budget, key) }
  })
  const suivis = parMois.filter((m) => m.budget && m.budget.lines.length > 0)
  const totalEpargne = suivis.reduce((sum, m) => sum + m.summary.totals.saving, 0)
  const resteMoyen = suivis.length > 0 ? suivis.reduce((sum, m) => sum + m.summary.livingAllowance, 0) / suivis.length : 0
  const maxEpargne = Math.max(1, ...parMois.map((m) => m.summary.totals.saving))

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Mon année</p>
          <h1 className="mt-1 font-display text-[2rem] leading-tight text-ink">Vue d'ensemble {annee}</h1>
          <p className="mt-1 max-w-2xl text-[0.9rem] leading-relaxed text-ink-soft">
            Les douze mois d'un coup d'œil, et le calendrier qui prépare les suivants.
          </p>
        </div>
      </header>

      {/* Récap annuel : un bâton d'épargne par mois */}
      <Card>
        <CardHeader title="Récap annuel" hint="L'épargne posée, mois par mois" icon="CalendarRange" tone="amber" />
        <div className="px-5 pb-5">
          <div ref={moisRef} className="grid grid-cols-6 gap-2 sm:grid-cols-12">
            {parMois.map((m) => {
              const actif = m.index === moisIndex
              const hauteur = Math.round((m.summary.totals.saving / maxEpargne) * 52)
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMonth(m.key)}
                  aria-pressed={actif}
                  aria-label={`${MOIS_COURTS[m.index]} : ${euro(m.summary.totals.saving)} épargnés`}
                  className={clsx(
                    'flex flex-col items-center gap-1.5 rounded-xl border px-1 pb-2 pt-3 transition',
                    actif ? 'border-brand bg-brand-soft' : 'border-transparent hover:bg-surface-2',
                  )}
                >
                  <span className="flex h-[56px] items-end">
                    <span
                      className={clsx(
                        'w-4 rounded-t-md',
                        m.summary.totals.saving > 0 ? 'bg-amber' : 'bg-surface-3',
                      )}
                      style={{ height: `${Math.max(4, hauteur)}px` }}
                    />
                  </span>
                  <span className={clsx('text-[0.66rem] font-semibold', actif ? 'text-brand-deep' : 'text-ink-muted')}>
                    {MOIS_COURTS[m.index]}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4">
            <div>
              <p className="eyebrow">Total épargné</p>
              <p className="tabular mt-1 font-display text-xl text-amber-deep">{euro(totalEpargne)}</p>
            </div>
            <div>
              <p className="eyebrow">Reste à vivre moyen</p>
              <p className="tabular mt-1 font-display text-xl text-ink">{euro(resteMoyen)} / mois</p>
            </div>
            <div>
              <p className="eyebrow">Mois suivis</p>
              <p className="tabular mt-1 font-display text-xl text-ink">{suivis.length} / 12</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* Calendrier du mois */}
        <Card className="min-w-0">
          <CardHeader
            title={monthLabel(month)}
            hint="Cliquez un jour pour planifier une charge, une dette ou un versement"
            icon="CalendarDays"
            tone="indigo"
            action={
              <span className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setMonth(addMonths(month, -1))}
                  aria-label="Mois précédent"
                  className="grid size-8 place-items-center rounded-lg border border-line text-ink-soft transition hover:bg-surface-2"
                >
                  <Icon name="ChevronLeft" size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setMonth(addMonths(month, 1))}
                  aria-label="Mois suivant"
                  className="grid size-8 place-items-center rounded-lg border border-line text-ink-soft transition hover:bg-surface-2"
                >
                  <Icon name="ChevronRight" size={15} />
                </button>
              </span>
            }
          />
          <div className="px-3 pb-4 sm:px-5">
            <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-line bg-line">
              {JOURS.map((jour) => (
                <div key={jour} className="bg-surface-2 px-1 py-1.5 text-center text-[0.66rem] font-bold uppercase tracking-wider text-ink-muted">
                  {jour}
                </div>
              ))}
              {Array.from({ length: decalage }).map((_, i) => (
                <div key={`v-${i}`} className="min-h-16 bg-surface opacity-50 sm:min-h-20" />
              ))}
              {Array.from({ length: joursDansMois }, (_, i) => i + 1).map((day) => {
                const items = itemsDuJour(day)
                const aujourdHui = month === live && day === new Date().getDate()
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setCreating(day)}
                    aria-label={`Planifier le ${day} ${monthLabel(month)}`}
                    className={clsx(
                      'group flex min-h-16 flex-col items-stretch gap-0.5 bg-surface p-1 text-left transition hover:bg-surface-2 sm:min-h-20 sm:p-1.5',
                      aujourdHui && 'bg-brand-soft/50',
                    )}
                  >
                    <span
                      className={clsx(
                        'tabular self-start rounded-md px-1 text-[0.7rem] leading-5',
                        aujourdHui ? 'bg-brand font-bold text-on-accent' : 'text-ink-muted',
                      )}
                    >
                      {day}
                    </span>
                    {items.slice(0, 2).map((item) => {
                      const tone = TONE[FLOW_META[CATEGORY_BY_ID[item.categoryId]?.flow ?? 'fixed'].tone]
                      return (
                        <span
                          key={item.id}
                          className={clsx('truncate rounded px-1 py-px text-[0.62rem] font-medium', tone.bg, tone.deep)}
                          title={`${item.label} — ${euro(item.amount)}`}
                        >
                          {item.label}
                        </span>
                      )
                    })}
                    {items.length > 2 && (
                      <span className="px-1 text-[0.6rem] text-ink-muted">+{items.length - 2}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </Card>

        {/* Les éléments planifiés du mois */}
        <Card className="min-w-0">
          <CardHeader
            title="Planifié ce mois-ci"
            hint="Préremplissable depuis « Mon mois »"
            icon="CalendarCheck"
            tone="mint"
          />
          <ul className="flex flex-col gap-2 px-5 pb-5">
            {planned
              .filter((item) => item.recurrence === 'monthly' || item.month === month)
              .sort((a, b) => a.day - b.day)
              .map((item) => {
                const category = CATEGORY_BY_ID[item.categoryId]
                const tone = TONE[FLOW_META[category?.flow ?? 'fixed'].tone]
                return (
                  <li key={item.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 px-3 py-2">
                    <span className={clsx('grid size-8 shrink-0 place-items-center rounded-lg', tone.bg, tone.deep)}>
                      <Icon name={category?.icon ?? 'CalendarDays'} size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.85rem] font-medium text-ink">{item.label}</span>
                      <span className="block text-[0.7rem] text-ink-muted">
                        Le {item.day} · {item.recurrence === 'monthly' ? 'chaque mois' : monthLabel(item.month ?? month)}
                      </span>
                    </span>
                    <span className="tabular shrink-0 text-[0.85rem] font-semibold text-ink">{euro(item.amount)}</span>
                    <button
                      type="button"
                      onClick={() => removePlanned(item.id)}
                      aria-label={`Supprimer ${item.label}`}
                      className="grid size-7 shrink-0 place-items-center rounded-lg text-ink-muted transition hover:bg-berry-soft hover:text-berry-deep"
                    >
                      <Icon name="X" size={13} />
                    </button>
                  </li>
                )
              })}
            {planned.filter((item) => item.recurrence === 'monthly' || item.month === month).length === 0 && (
              <li className="rounded-xl bg-surface-2 px-4 py-3 text-[0.85rem] text-ink-muted">
                Rien de planifié : cliquez un jour du calendrier.
              </li>
            )}
          </ul>

          {/* Le mois sélectionné, en chiffres */}
          <div className="border-t border-line px-5 py-4">
            <p className="eyebrow mb-2">Récap {monthLabel(month)}</p>
            <dl className="flex flex-col gap-1.5">
              {(() => {
                const s = parMois[moisIndex]?.summary
                if (!s || s.totals.income === 0)
                  return <dd className="text-[0.82rem] text-ink-muted">Pas encore de saisie pour ce mois.</dd>
                return (
                  <>
                    {[
                      { label: 'Revenus', value: euro(s.totals.income), cls: 'text-mint-deep' },
                      { label: 'Épargne', value: euro(s.totals.saving), cls: 'text-amber-deep' },
                      { label: 'Reste à vivre', value: euro(s.livingAllowance), cls: 'text-ink' },
                      { label: 'Fin de mois', value: euroSigned(s.endOfMonth), cls: s.endOfMonth >= 0 ? 'text-mint-deep' : 'text-berry-deep' },
                    ].map((ligne) => (
                      <div key={ligne.label} className="flex items-baseline justify-between text-[0.85rem]">
                        <dt className="text-ink-soft">{ligne.label}</dt>
                        <dd className={clsx('tabular font-semibold', ligne.cls)}>{ligne.value}</dd>
                      </div>
                    ))}
                  </>
                )
              })()}
            </dl>
          </div>
        </Card>
      </div>

      <AnimatePresence>
        {creating !== null && (
          <PlanDialog day={creating} month={month} onClose={() => setCreating(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}

/** Planifier un élément : intitulé, montant, catégorie, récurrence. */
function PlanDialog({ day, month, onClose }: { day: number; month: string; onClose: () => void }) {
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
        <h2 className="font-display text-2xl text-ink">
          Le {day} {monthLabel(month)}
        </h2>
        <p className="mt-1 text-[0.85rem] text-ink-muted">
          Cet élément préremplira la saisie du ou des mois concernés.
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
            <span className="text-[0.85rem] font-semibold text-ink">Récurrence</span>
            <select
              value={recurrence}
              onChange={(event) => setRecurrence(event.target.value as PlannedItem['recurrence'])}
              className="mt-1.5 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[0.9rem] text-ink outline-none focus:border-brand"
            >
              <option value="monthly">Chaque mois</option>
              <option value="once">Une seule fois</option>
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
                day,
                recurrence,
                month: recurrence === 'once' ? month : undefined,
              })
              pushToast({ title: 'Planifié !', detail: `${label.trim()} · le ${day}`, tone: 'indigo', icon: 'CalendarCheck' })
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
