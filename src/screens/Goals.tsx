import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import { useApp } from '../store/useApp'
import { pocketBalance, projectGoal, summarize, totalsByFlow } from '../domain/budget'
import { GOAL_CATALOG, STRATEGIES, emergencyFundTarget } from '../domain/strategy'
import { Button, Card, CardHeader, EmptyState, Progress } from '../components/ui/primitives'
import { TONE } from '../components/ui/tone'
import { Icon } from '../components/Icon'
import { newId } from '../lib/id'
import { addMonths, euro, monthKey, monthLabel, monthsBetween } from '../lib/format'
import type { GoalKind } from '../domain/types'

export function Goals() {
  const goals = useApp((s) => s.goals)
  const pockets = useApp((s) => s.pockets)
  const budgets = useApp((s) => s.budgets)
  const addGoal = useApp((s) => s.addGoal)
  const removeGoal = useApp((s) => s.removeGoal)
  const pushToast = useApp((s) => s.pushToast)

  const live = monthKey(new Date())
  const month = budgets.some((b) => b.month === live) ? live : (budgets[budgets.length - 1]?.month ?? live)
  const summary = summarize(budgets.find((b) => b.month === month), month)

  const [creating, setCreating] = useState(false)

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Objectifs</p>
          <h1 className="mt-1 font-display text-[2rem] leading-tight text-ink">Où vous voulez arriver</h1>
          <p className="mt-1 max-w-2xl text-[0.9rem] leading-relaxed text-ink-soft">
            Chiffré et daté, un objectif aboutit. Chacun a sa poche d’épargne.
          </p>
        </div>
        <Button icon="Plus" onClick={() => setCreating(true)}>
          Nouvel objectif
        </Button>
      </header>

      {/* Objectifs */}
      {goals.length === 0 ? (
        <Card>
          <EmptyState
            icon="Target"
            title="Aucun objectif pour l’instant"
            hint="Commencez simple : un mois de charges en fonds d’urgence."
            action={
              <Button icon="Plus" onClick={() => setCreating(true)}>
                Définir un objectif
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {goals.map((goal) => {
            const pocket = goal.pocketId ? pockets.find((p) => p.id === goal.pocketId) : undefined
            const saved = pocket ? pocketBalance(pocket, budgets) : 0
            const projection = projectGoal(goal.targetAmount, saved, goal.deadline, month, summary.livingAllowance)
            const ratio = Math.min(1, saved / goal.targetAmount)
            const catalogEntry = GOAL_CATALOG.find((g) => g.kind === goal.kind)
            const strategy = STRATEGIES[goal.kind]

            return (
              <Card key={goal.id}>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-deep">
                        <Icon name={catalogEntry?.icon ?? 'Target'} size={20} />
                      </span>
                      <div className="min-w-0">
                        <h2 className="font-display text-[1.15rem] leading-tight text-ink">{goal.label}</h2>
                        <p className="mt-0.5 text-[0.78rem] text-ink-muted">
                          Échéance {monthLabel(goal.deadline)} · stratégie {strategy.name}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        removeGoal(goal.id)
                        pushToast({ title: 'Objectif retiré', detail: goal.label, tone: 'berry', icon: 'X' })
                      }}
                      className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-muted transition hover:bg-surface-2 hover:text-berry"
                      aria-label={`Retirer l'objectif ${goal.label}`}
                    >
                      <Icon name="X" size={15} />
                    </button>
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex items-baseline justify-between gap-3">
                      <span className="tabular font-display text-2xl text-mint-deep">{euro(saved)}</span>
                      <span className="tabular text-[0.85rem] text-ink-muted">sur {euro(goal.targetAmount)}</span>
                    </div>
                    <Progress value={ratio} tone="mint" height={10} />
                    <p className="mt-1.5 text-[0.75rem] text-ink-muted">{Math.round(ratio * 100)} % du chemin parcouru</p>
                  </div>

                  <dl className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-surface-2 p-3">
                      <dt className="eyebrow">Par mois</dt>
                      <dd className="tabular mt-1 font-display text-lg text-ink">{euro(projection.monthlyEffort)}</dd>
                    </div>
                    <div className="rounded-xl bg-surface-2 p-3">
                      <dt className="eyebrow">Restant</dt>
                      <dd className="tabular mt-1 font-display text-lg text-ink">{euro(projection.shortfall)}</dd>
                    </div>
                    <div className="rounded-xl bg-surface-2 p-3">
                      <dt className="eyebrow">Mois</dt>
                      <dd className="tabular mt-1 font-display text-lg text-ink">{projection.monthsRemaining}</dd>
                    </div>
                  </dl>

                  <p
                    className={clsx(
                      'mt-3 flex items-start gap-2 rounded-xl p-3 text-[0.8rem] leading-snug',
                      projection.feasible ? 'bg-mint-soft text-mint-deep' : 'bg-berry-soft text-berry-deep',
                    )}
                  >
                    <Icon name={projection.feasible ? 'Check' : 'Info'} size={15} className="mt-0.5 shrink-0" />
                    {projection.feasible
                      ? `Réaliste : l'effort représente ${Math.round((projection.monthlyEffort / Math.max(1, summary.livingAllowance)) * 100)} % de votre reste à vivre.`
                      : "L'effort dépasse ce que votre reste à vivre permet aujourd'hui. Allongez l'échéance ou revoyez le montant."}
                  </p>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Poches d'épargne */}
      <Card>
        <CardHeader
          title="Vos poches d’épargne"
          hint="Un euro rangé ne se dépense pas sans y penser"
          icon="PiggyBank"
          tone="amber"
        />
        <div className="grid gap-3 px-5 pb-5 sm:grid-cols-2 lg:grid-cols-4">
          {pockets.map((pocket) => {
            const balance = pocketBalance(pocket, budgets)
            const ratio = pocket.target ? Math.min(1, balance / pocket.target) : 0
            return (
              <div key={pocket.id} className={clsx('rounded-2xl border p-4', TONE[pocket.tone].bg, TONE[pocket.tone].border)}>
                <span className={clsx('grid size-9 place-items-center rounded-xl bg-surface', TONE[pocket.tone].text)}>
                  <Icon name={pocket.icon} size={17} />
                </span>
                <p className="mt-2.5 text-[0.85rem] font-semibold text-ink">{pocket.label}</p>
                <p className={clsx('tabular mt-1 font-display text-2xl leading-none', TONE[pocket.tone].text)}>
                  {euro(balance)}
                </p>
                {pocket.target ? (
                  <>
                    <div className="mt-2.5">
                      <Progress value={ratio} tone={pocket.tone} height={5} />
                    </div>
                    <p className="tabular mt-1.5 text-[0.72rem] text-ink-muted">
                      Objectif {euro(pocket.target)} · {Math.round(ratio * 100)} %
                    </p>
                  </>
                ) : (
                  <p className="mt-2.5 text-[0.72rem] text-ink-muted">Sans plafond — horizon long</p>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      <Simulators fixedMonthly={totalsByFlow(budgets.find((b) => b.month === month)).fixed} />

      <AnimatePresence>
        {creating && (
          <GoalDialog
            onClose={() => setCreating(false)}
            onCreate={(goal) => {
              addGoal(goal)
              setCreating(false)
              pushToast({ title: 'Objectif créé', detail: goal.label, tone: 'mint', icon: 'Flag' })
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/** Simulateurs repris du classeur : fonds d’urgence, effort mensuel, projection. */
function Simulators({ fixedMonthly }: { fixedMonthly: number }) {
  const [months, setMonths] = useState(3)
  const [monthly, setMonthly] = useState(150)
  const [duration, setDuration] = useState(24)

  const target = useMemo(() => emergencyFundTarget(fixedMonthly, 0, months), [fixedMonthly, months])
  const perMonth = target / 12
  const projected = monthly * duration

  return (
    <Card>
      <CardHeader
        title="Simulateurs"
        hint="Pour décider en deux calculs"
        icon="Telescope"
        tone="indigo"
      />
      <div className="grid gap-4 px-5 pb-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface-2 p-4">
          <p className="font-display text-[1.05rem] text-ink">Quel fonds d’urgence viser ?</p>
          <p className="mt-1 text-[0.8rem] leading-snug text-ink-muted">
            Le repère courant : entre trois et six mois de charges contraintes.
          </p>
          <div className="mt-4 flex items-center gap-2">
            {[1, 3, 6].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMonths(value)}
                className={clsx(
                  'flex-1 rounded-xl border px-3 py-2 text-[0.82rem] font-semibold transition',
                  months === value ? 'border-brand bg-brand-soft text-brand-deep' : 'border-line bg-surface text-ink-soft',
                )}
              >
                {value} mois
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-xl bg-surface p-4">
            <p className="eyebrow">Montant cible</p>
            <p className="tabular mt-1 font-display text-3xl leading-none text-mint-deep">{euro(target)}</p>
            <p className="mt-2 text-[0.8rem] text-ink-muted">
              Soit {euro(perMonth)} par mois pour y arriver en un an.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface-2 p-4">
          <p className="font-display text-[1.05rem] text-ink">Si je mets de côté chaque mois…</p>
          <p className="mt-1 text-[0.8rem] leading-snug text-ink-muted">
            Projection à taux zéro : seul l’effort d’épargne est compté, aucun rendement n’est simulé.
          </p>
          <label className="mt-4 block">
            <span className="flex items-baseline justify-between text-[0.82rem] font-semibold text-ink">
              Montant mensuel
              <span className="tabular font-display text-lg text-brand-deep">{euro(monthly)}</span>
            </span>
            <input
              type="range"
              min={10}
              max={800}
              step={10}
              value={monthly}
              onChange={(event) => setMonthly(Number(event.target.value))}
              className="mt-2 w-full"
            />
          </label>
          <label className="mt-3 block">
            <span className="flex items-baseline justify-between text-[0.82rem] font-semibold text-ink">
              Pendant
              <span className="tabular font-display text-lg text-brand-deep">{duration} mois</span>
            </span>
            <input
              type="range"
              min={3}
              max={120}
              step={1}
              value={duration}
              onChange={(event) => setDuration(Number(event.target.value))}
              className="mt-2 w-full"
            />
          </label>
          <div className="mt-4 rounded-xl bg-surface p-4">
            <p className="eyebrow">Vous auriez</p>
            <p className="tabular mt-1 font-display text-3xl leading-none text-amber">{euro(projected)}</p>
            <p className="mt-2 text-[0.8rem] text-ink-muted">
              En {monthLabel(addMonths(monthKey(new Date()), duration))}.
            </p>
          </div>
        </div>
      </div>
      <p className="border-t border-line px-5 py-3 text-[0.75rem] leading-relaxed text-ink-muted">
        Ces simulateurs sont des outils de calcul budgétaire. Ils ne constituent ni une offre, ni une recommandation
        personnalisée de placement.
      </p>
    </Card>
  )
}

function GoalDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (goal: import('../domain/types').Goal) => void }) {
  const [kind, setKind] = useState<GoalKind>('emergency')
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState(1000)
  const [months, setMonths] = useState(12)
  const entry = GOAL_CATALOG.find((g) => g.kind === kind)!
  const deadline = addMonths(monthKey(new Date()), months)

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-[rgb(0_0_0/0.45)] p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="card max-h-[88dvh] w-full max-w-lg overflow-y-auto p-6"
        initial={{ scale: 0.95, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0 }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Nouvel objectif"
      >
        <h2 className="font-display text-2xl text-ink">Nouvel objectif</h2>

        <p className="mt-5 text-[0.85rem] font-semibold text-ink">Quelle famille ?</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {GOAL_CATALOG.map((item) => (
            <button
              key={item.kind}
              type="button"
              onClick={() => {
                setKind(item.kind)
                setAmount(item.suggestedAmount ?? 1000)
                setMonths(item.suggestedMonths)
              }}
              className={clsx(
                'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-[0.82rem] font-medium transition',
                kind === item.kind ? 'border-brand bg-brand-soft text-brand-deep' : 'border-line bg-surface text-ink-soft',
              )}
            >
              <Icon name={item.icon} size={15} />
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>

        <label className="mt-5 block">
          <span className="text-[0.85rem] font-semibold text-ink">Nom de l’objectif</span>
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder={entry.label}
            className="mt-1.5 w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-[0.9rem] text-ink outline-none focus:border-brand"
          />
        </label>

        <label className="mt-4 block">
          <span className="flex items-baseline justify-between text-[0.85rem] font-semibold text-ink">
            Montant à atteindre
            <span className="tabular font-display text-lg text-brand-deep">{euro(amount)}</span>
          </span>
          <input
            type="range"
            min={100}
            max={50000}
            step={100}
            value={amount}
            onChange={(event) => setAmount(Number(event.target.value))}
            className="mt-2 w-full"
          />
        </label>

        <label className="mt-3 block">
          <span className="flex items-baseline justify-between text-[0.85rem] font-semibold text-ink">
            Échéance
            <span className="tabular font-display text-lg text-brand-deep capitalize">{monthLabel(deadline)}</span>
          </span>
          <input
            type="range"
            min={1}
            max={180}
            step={1}
            value={months}
            onChange={(event) => setMonths(Number(event.target.value))}
            className="mt-2 w-full"
          />
        </label>

        <div className="mt-4 rounded-xl bg-surface-2 p-4">
          <p className="eyebrow">Effort mensuel</p>
          <p className="tabular mt-1 font-display text-2xl text-ink">{euro(amount / Math.max(1, months))}</p>
          <p className="mt-1 text-[0.78rem] text-ink-muted">
            Sur {monthsBetween(monthKey(new Date()), deadline)} mois, stratégie {STRATEGIES[kind].name}.
          </p>
        </div>

        <div className="mt-5 flex gap-2">
          <Button variant="ghost" full onClick={onClose}>
            Annuler
          </Button>
          <Button
            full
            icon="Flag"
            onClick={() =>
              onCreate({
                id: newId('goal'),
                kind,
                label: label.trim() || entry.label,
                targetAmount: amount,
                deadline,
                createdAt: new Date().toISOString(),
              })
            }
          >
            Créer
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
