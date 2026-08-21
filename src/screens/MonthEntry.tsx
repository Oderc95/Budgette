import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import { useApp } from '../store/useApp'
import { CATEGORIES, CATEGORY_BY_ID, FLOW_META, FLOW_ORDER, categoriesOf } from '../domain/categories'
import { summarize, totalsByFlow } from '../domain/budget'
import { Button, Card, Chip } from '../components/ui/primitives'
import { TONE } from '../components/ui/tone'
import { Icon } from '../components/Icon'
import { Confetti } from '../components/Confetti'
import { addMonths, euro, euroSigned, monthKey, monthLabel } from '../lib/format'
import type { Flow } from '../domain/types'

const MOODS: { value: 1 | 2 | 3 | 4 | 5; label: string; icon: string }[] = [
  { value: 1, label: 'Très tendu', icon: 'TrendingDown' },
  { value: 2, label: 'Serré', icon: 'Scale' },
  { value: 3, label: 'Correct', icon: 'Leaf' },
  { value: 4, label: 'Confortable', icon: 'Sun' },
  { value: 5, label: 'Serein', icon: 'Sparkles' },
]

export function MonthEntry() {
  const budgets = useApp((s) => s.budgets)
  const setLine = useApp((s) => s.setLine)
  const ensureMonth = useApp((s) => s.ensureMonth)
  const closeMonth = useApp((s) => s.closeMonth)
  const reopenMonth = useApp((s) => s.reopenMonth)
  const pushToast = useApp((s) => s.pushToast)

  const live = monthKey(new Date())
  const fallback = budgets.some((b) => b.month === live) ? live : (budgets[budgets.length - 1]?.month ?? live)
  const [month, setMonth] = useState(fallback)
  const [openFlow, setOpenFlow] = useState<Flow | null>('income')
  const [closing, setClosing] = useState(false)
  const [celebrate, setCelebrate] = useState(false)

  const budget = budgets.find((b) => b.month === month)
  const summary = summarize(budget, month)
  const previous = budgets.find((b) => b.month === addMonths(month, -1))
  const locked = budget?.closed ?? false

  const amountOf = (categoryId: string) =>
    budget?.lines.find((line) => line.categoryId === categoryId)?.amount ?? 0

  const filledCount = budget?.lines.length ?? 0

  function copyPrevious() {
    if (!previous || locked) return
    ensureMonth(month)
    let copied = 0
    for (const line of previous.lines) {
      const category = CATEGORY_BY_ID[line.categoryId]
      if (!category) continue
      // On ne reconduit que ce qui est stable d'un mois sur l'autre.
      if (category.flow === 'discretionary') continue
      if (amountOf(line.categoryId) > 0) continue
      setLine(month, line.categoryId, line.amount)
      copied += 1
    }
    pushToast({
      title: `${copied} lignes reprises`,
      detail: `Depuis ${monthLabel(previous.month)} — ajustez ce qui a changé`,
      tone: 'mint',
      icon: 'Undo2',
    })
  }

  function handleClose(mood: 1 | 2 | 3 | 4 | 5) {
    closeMonth(month, mood)
    setClosing(false)
    setCelebrate(true)
    window.setTimeout(() => setCelebrate(false), 2600)
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Saisie mensuelle</p>
          <div className="mt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMonth(addMonths(month, -1))}
              className="grid size-8 place-items-center rounded-lg border border-line text-ink-soft transition hover:bg-surface-2"
              aria-label="Mois précédent"
            >
              <Icon name="ChevronLeft" size={16} />
            </button>
            <h1 className="min-w-[9.5rem] text-center font-display text-[1.7rem] capitalize leading-tight text-ink">
              {monthLabel(month)}
            </h1>
            <button
              type="button"
              onClick={() => {
                const target = addMonths(month, 1)
                setMonth(target)
                ensureMonth(target)
              }}
              className="grid size-8 place-items-center rounded-lg border border-line text-ink-soft transition hover:bg-surface-2"
              aria-label="Mois suivant"
            >
              <Icon name="ChevronRight" size={16} />
            </button>
            {locked ? (
              <Chip tone="mint" icon="Lock">
                Clôturé
              </Chip>
            ) : (
              <Chip tone="amber" icon="PenLine">
                En cours
              </Chip>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {previous && !locked && (
            <Button variant="outline" icon="Undo2" onClick={copyPrevious}>
              Reprendre {monthLabel(previous.month).split(' ')[0]}
            </Button>
          )}
          {locked ? (
            <Button variant="ghost" icon="RotateCcw" onClick={() => reopenMonth(month)}>
              Rouvrir
            </Button>
          ) : (
            <Button icon="BookCheck" onClick={() => setClosing(true)} disabled={filledCount === 0}>
              Clôturer le mois
            </Button>
          )}
        </div>
      </header>

      {/* Synthèse permanente */}
      <div className="sticky top-[3.75rem] z-20 lg:top-3">
        <Card className="relative">
          {celebrate && <Confetti />}
          <div className="grid gap-px overflow-hidden rounded-[inherit] bg-line sm:grid-cols-4">
            {[
              { label: 'Revenus', value: euro(summary.totals.income), tone: 'mint' as const },
              { label: 'Charges + dettes', value: euro(summary.totals.fixed + summary.totals.debt), tone: 'indigo' as const },
              { label: 'Reste à vivre', value: euro(summary.livingAllowance), tone: 'amber' as const },
              {
                label: 'Fin de mois',
                value: euroSigned(summary.endOfMonth),
                tone: summary.endOfMonth >= 0 ? ('mint' as const) : ('berry' as const),
              },
            ].map((cell) => (
              <div key={cell.label} className="bg-surface px-4 py-3.5">
                <p className="eyebrow">{cell.label}</p>
                <p className={clsx('tabular mt-1 font-display text-xl leading-none', TONE[cell.tone].text)}>{cell.value}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Sections de saisie */}
      <div className="flex flex-col gap-3">
        {FLOW_ORDER.map((flow) => {
          const meta = FLOW_META[flow]
          const total = totalsByFlow(budget)[flow]
          const isOpen = openFlow === flow
          const categories = categoriesOf(flow)
          const visible = categories.filter((c) => amountOf(c.id) > 0 || c.recurring)
          const hidden = categories.filter((c) => !visible.includes(c))

          return (
            <Card key={flow}>
              <button
                type="button"
                onClick={() => setOpenFlow(isOpen ? null : flow)}
                className="flex w-full items-center gap-3 px-5 py-4 text-left"
                aria-expanded={isOpen}
              >
                <span className={clsx('grid size-10 shrink-0 place-items-center rounded-xl', TONE[meta.tone].bg, TONE[meta.tone].text)}>
                  <Icon name={meta.icon} size={19} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[1.05rem] leading-tight text-ink">{meta.label}</span>
                  <span className="block text-[0.78rem] text-ink-muted">
                    {visible.filter((c) => amountOf(c.id) > 0).length} ligne(s) saisie(s)
                  </span>
                </span>
                <span className={clsx('tabular font-display text-xl', TONE[meta.tone].text)}>{euro(total)}</span>
                <Icon name={isOpen ? 'ChevronDown' : 'ChevronRight'} size={17} className="ml-1 text-ink-muted" />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-line px-5 py-4">
                      <ul className="flex flex-col gap-1">
                        {visible.map((category) => (
                          <li key={category.id} className="flex items-center gap-3 py-1.5">
                            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-ink-soft">
                              <Icon name={category.icon} size={15} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <label htmlFor={`in-${category.id}`} className="block truncate text-[0.88rem] font-medium text-ink">
                                {category.label}
                              </label>
                              {category.hint && (
                                <span className="block truncate text-[0.72rem] text-ink-muted">{category.hint}</span>
                              )}
                            </span>
                            <span className="relative shrink-0">
                              <input
                                id={`in-${category.id}`}
                                type="number"
                                inputMode="decimal"
                                min={0}
                                step={1}
                                disabled={locked}
                                value={amountOf(category.id) || ''}
                                placeholder="0"
                                onChange={(event) => setLine(month, category.id, Math.max(0, Number(event.target.value)))}
                                className={clsx(
                                  'tabular w-28 rounded-xl border bg-surface px-3 py-2 pr-7 text-right text-[0.9rem] text-ink outline-none transition',
                                  'disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-ink-muted',
                                  amountOf(category.id) > 0 ? 'border-line-strong' : 'border-line',
                                  'focus:border-brand',
                                )}
                              />
                              <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-[0.85rem] text-ink-muted">
                                €
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>

                      {hidden.length > 0 && !locked && (
                        <div className="mt-3 border-t border-line pt-3">
                          <label className="flex items-center gap-2 text-[0.78rem] text-ink-muted">
                            <Icon name="Plus" size={14} />
                            Ajouter une ligne
                            <select
                              className="ml-auto rounded-lg border border-line bg-surface px-3 py-1.5 text-[0.82rem] text-ink outline-none focus:border-brand"
                              value=""
                              onChange={(event) => {
                                if (event.target.value) setLine(month, event.target.value, 1)
                              }}
                            >
                              <option value="">Choisir…</option>
                              {hidden.map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.label}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          )
        })}
      </div>

      <p className="px-1 text-[0.78rem] leading-relaxed text-ink-muted">
        {CATEGORIES.length} catégories disponibles. Les charges marquées comme récurrentes restent affichées d’un mois
        sur l’autre, même vides, pour que rien ne soit oublié.
      </p>

      {/* Clôture du mois */}
      <AnimatePresence>
        {closing && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-[rgb(0_0_0/0.45)] p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setClosing(false)}
          >
            <motion.div
              className="card w-full max-w-md p-6"
              initial={{ scale: 0.94, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Clôturer le mois"
            >
              <h2 className="font-display text-2xl text-ink">Clôturer {monthLabel(month)}</h2>
              <p className="mt-1.5 text-[0.88rem] leading-relaxed text-ink-soft">
                Le mois sera figé et rejoindra votre historique. Vous pourrez toujours le rouvrir si vous avez oublié une
                ligne.
              </p>

              <dl className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-surface-2 p-3">
                  <dt className="eyebrow">Épargné</dt>
                  <dd className="tabular mt-1 font-display text-xl text-amber">{euro(summary.totals.saving)}</dd>
                </div>
                <div className="rounded-xl bg-surface-2 p-3">
                  <dt className="eyebrow">Fin de mois</dt>
                  <dd
                    className={clsx(
                      'tabular mt-1 font-display text-xl',
                      summary.endOfMonth >= 0 ? 'text-mint-deep' : 'text-berry',
                    )}
                  >
                    {euroSigned(summary.endOfMonth)}
                  </dd>
                </div>
              </dl>

              <p className="mt-5 text-[0.85rem] font-semibold text-ink">Comment avez-vous vécu ce mois ?</p>
              <div className="mt-2.5 grid grid-cols-5 gap-2">
                {MOODS.map((mood) => (
                  <button
                    key={mood.value}
                    type="button"
                    onClick={() => handleClose(mood.value)}
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-line bg-surface p-2.5 transition hover:border-brand hover:bg-brand-soft"
                  >
                    <Icon name={mood.icon} size={18} className="text-ink-soft" />
                    <span className="text-center text-[0.65rem] leading-tight text-ink-muted">{mood.label}</span>
                  </button>
                ))}
              </div>

              <Button variant="ghost" full className="mt-4" onClick={() => setClosing(false)}>
                Annuler
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
