import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import { useApp } from '../store/useApp'
import { GOAL_CATALOG, STRATEGIES, applyRule, emergencyFundTarget } from '../domain/strategy'
import type { GoalKind } from '../domain/types'
import { Ambient, Button, Chip, Progress } from '../components/ui/primitives'
import { TONE } from '../components/ui/tone'
import { Icon } from '../components/Icon'
import { newId } from '../lib/id'
import { Logo } from '../components/Logo'
import { Mascot } from '../components/Mascot'
import { addMonths, euro, monthKey, monthLabel } from '../lib/format'

const STEPS = ['Vous', 'Objectif', 'Cible', 'Stratégie'] as const

export function Onboarding() {
  const completeOnboarding = useApp((s) => s.completeOnboarding)
  const currentName = useApp((s) => s.profile.displayName)

  const [step, setStep] = useState(0)
  const [name, setName] = useState(currentName)
  const [kind, setKind] = useState<GoalKind | null>(null)
  const [income, setIncome] = useState(2200)
  const [fixed, setFixed] = useState(1100)
  const [amount, setAmount] = useState(3000)
  const [months, setMonths] = useState(12)

  const catalogEntry = kind ? GOAL_CATALOG.find((g) => g.kind === kind)! : null
  const strategy = kind ? STRATEGIES[kind] : null
  const suggestedAmount = useMemo(() => {
    if (!catalogEntry) return 3000
    if (catalogEntry.suggestedAmount !== null) return catalogEntry.suggestedAmount
    if (kind === 'emergency') return emergencyFundTarget(fixed, 0, 3)
    if (kind === 'debt_exit') return 1500
    return 3000
  }, [catalogEntry, kind, fixed])

  const monthlyEffort = amount / Math.max(1, months)
  const allocation = strategy ? applyRule(strategy, income) : null
  const effortShare = income > 0 ? monthlyEffort / income : 0
  const deadline = addMonths(monthKey(new Date()), months)

  const canContinue = step === 0 ? name.trim().length > 0 : step === 1 ? kind !== null : true

  function next() {
    if (step === 1 && kind) {
      setAmount(suggestedAmount)
      setMonths(GOAL_CATALOG.find((g) => g.kind === kind)!.suggestedMonths)
    }
    setStep((value) => Math.min(STEPS.length - 1, value + 1))
  }

  function finish() {
    if (!kind || !strategy || !catalogEntry) return
    completeOnboarding({
      strategyId: strategy.id,
      displayName: name,
      goal: {
        id: newId('goal'),
        kind,
        label: catalogEntry.label,
        targetAmount: Math.round(amount),
        savedAmount: 0,
        deadline,
        createdAt: new Date().toISOString(),
      },
    })
  }

  return (
    <>
      <Ambient />
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-5 py-8">
      <header className="mb-8">
        <Logo size="md" className="mb-5" />

        <div className="flex items-center gap-2">
          {STEPS.map((label, index) => (
            <div key={label} className="flex flex-1 flex-col gap-1.5">
              <Progress value={index <= step ? 1 : 0} tone={index <= step ? 'mint' : 'mint'} height={4} animate={false} />
              <span className={clsx('text-[0.7rem] font-semibold', index <= step ? 'text-brand-deep' : 'text-ink-muted')}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </header>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step0" {...anim}>
              <div className="mb-6 flex justify-center">
                <Mascot stageIndex={0} size={140} />
              </div>
              <h1 className="text-center font-display text-3xl leading-tight text-ink">Bienvenue. On commence par vous.</h1>
              <p className="mx-auto mt-2 max-w-md text-center text-[0.92rem] leading-relaxed text-ink-soft">
                Budgette ne vous demandera jamais vos identifiants bancaires. Vous saisissez ce que vous voulez, quand
                vous le voulez.
              </p>
              <label className="mx-auto mt-8 flex max-w-sm flex-col gap-1.5">
                <span className="text-[0.8rem] font-semibold text-ink-soft">Comment doit-on vous appeler ?</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Votre prénom"
                  className="rounded-xl border border-line bg-surface px-4 py-3 text-center font-display text-lg text-ink outline-none transition focus:border-brand"
                />
              </label>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step1" {...anim}>
              <h1 className="text-center font-display text-3xl leading-tight text-ink">Quel est votre objectif ?</h1>
              <p className="mx-auto mt-2 max-w-md text-center text-[0.92rem] text-ink-soft">
                Il détermine toute la stratégie. Vous pourrez en ajouter d’autres ensuite.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {GOAL_CATALOG.map((goal) => {
                  const selected = kind === goal.kind
                  return (
                    <button
                      key={goal.kind}
                      type="button"
                      onClick={() => setKind(goal.kind)}
                      className={clsx(
                        'flex items-start gap-3 rounded-2xl border p-4 text-left transition',
                        selected
                          ? 'border-brand bg-brand-soft shadow-soft'
                          : 'border-line bg-surface hover:border-line-strong hover:bg-surface-2',
                      )}
                    >
                      <span
                        className={clsx(
                          'grid size-10 shrink-0 place-items-center rounded-xl transition',
                          selected ? 'bg-brand text-on-accent' : 'bg-surface-2 text-ink-soft',
                        )}
                      >
                        <Icon name={goal.icon} size={19} />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-display text-[1.02rem] leading-tight text-ink">{goal.label}</span>
                        <span className="mt-0.5 block text-[0.8rem] leading-snug text-ink-muted">{goal.tagline}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}

          {step === 2 && catalogEntry && (
            <motion.div key="step2" {...anim}>
              <h1 className="text-center font-display text-3xl leading-tight text-ink">{catalogEntry.label} : on chiffre.</h1>
              <p className="mx-auto mt-2 max-w-md text-center text-[0.92rem] text-ink-soft">
                Ces montants restent modifiables à tout moment. Approximatif suffit pour démarrer.
              </p>

              <div className="mx-auto mt-8 flex max-w-md flex-col gap-6">
                <Field
                  label="Revenu net mensuel"
                  value={income}
                  onChange={setIncome}
                  min={0}
                  max={8000}
                  step={50}
                  suffix="€"
                />
                <Field
                  label="Charges fixes mensuelles"
                  hint="Loyer, énergie, téléphone, courses, assurances…"
                  value={fixed}
                  onChange={setFixed}
                  min={0}
                  max={6000}
                  step={50}
                  suffix="€"
                />
                <Field
                  label="Montant à atteindre"
                  hint={
                    kind === 'emergency'
                      ? `Trois mois de charges, soit environ ${euro(emergencyFundTarget(fixed, 0, 3))}`
                      : undefined
                  }
                  value={amount}
                  onChange={setAmount}
                  min={100}
                  max={kind === 'home' || kind === 'retirement' || kind === 'freedom' ? 200000 : 30000}
                  step={100}
                  suffix="€"
                />
                <Field
                  label="En combien de mois ?"
                  value={months}
                  onChange={setMonths}
                  min={1}
                  max={240}
                  step={1}
                  suffix="mois"
                  hint={`Échéance : ${monthLabel(deadline)}`}
                />
              </div>
            </motion.div>
          )}

          {step === 3 && strategy && allocation && (
            <motion.div key="step3" {...anim}>
              <div className="mb-5 flex justify-center">
                <Mascot stageIndex={2} size={120} />
              </div>
              <p className="text-center">
                <Chip tone="amber" icon="Sparkles">
                  Stratégie recommandée
                </Chip>
              </p>
              <h1 className="mt-3 text-center font-display text-3xl leading-tight text-ink">{strategy.name}</h1>
              <p className="mx-auto mt-3 max-w-lg text-center text-[0.92rem] leading-relaxed text-ink-soft">
                {strategy.rationale}
              </p>

              <div className="mt-7 rounded-2xl border border-line bg-surface p-5">
                <p className="eyebrow mb-3">Votre effort mensuel</p>
                <div className="flex items-end justify-between gap-4">
                  <p className="tabular font-display text-4xl leading-none text-mint-deep">{euro(monthlyEffort)}</p>
                  <p className="text-right text-[0.8rem] leading-snug text-ink-muted">
                    par mois pendant {months} mois
                    <br />
                    soit {Math.round(effortShare * 100)} % de votre revenu
                  </p>
                </div>
                <div className="mt-4">
                  <Progress value={effortShare} tone={effortShare > 0.35 ? 'berry' : 'mint'} />
                  <p className="mt-2 text-[0.78rem] leading-snug text-ink-muted">
                    {effortShare > 0.35
                      ? "C'est un effort très soutenu. Allonger le délai de quelques mois le rendra tenable — et un plan tenu vaut mieux qu'un plan parfait abandonné."
                      : 'Un rythme réaliste : vous devriez pouvoir le tenir sans vous priver de tout.'}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {(
                  [
                    { key: 'needs', label: 'Besoins', value: allocation.needs, pct: strategy.rule.needs, tone: 'indigo' as const },
                    { key: 'wants', label: 'Envies', value: allocation.wants, pct: strategy.rule.wants, tone: 'orchid' as const },
                    { key: 'future', label: 'Avenir', value: allocation.future, pct: strategy.rule.future, tone: 'amber' as const },
                  ]
                ).map((slice) => (
                  <div key={slice.key} className={clsx('rounded-2xl border p-4', TONE[slice.tone].bg, TONE[slice.tone].border)}>
                    <p className="eyebrow">{slice.label}</p>
                    <p className={clsx('tabular mt-1 font-display text-2xl leading-none', TONE[slice.tone].text)}>
                      {euro(slice.value)}
                    </p>
                    <p className="mt-1 text-[0.75rem] text-ink-muted">{slice.pct} % du revenu</p>
                  </div>
                ))}
              </div>

              <ul className="mt-4 flex flex-col gap-2 rounded-2xl border border-line bg-surface-2 p-4">
                <p className="eyebrow mb-1">Vos trois priorités</p>
                {strategy.priorities.map((priority) => (
                  <li key={priority} className="flex items-start gap-2 text-[0.85rem] leading-snug text-ink-soft">
                    <Icon name="Check" size={15} className="mt-0.5 shrink-0 text-mint" />
                    {priority}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="mt-8 flex items-center justify-between gap-3">
        <Button variant="ghost" icon="ArrowLeft" onClick={() => setStep((v) => Math.max(0, v - 1))} disabled={step === 0}>
          Retour
        </Button>
        {step < STEPS.length - 1 ? (
          <Button size="lg" iconRight="ArrowRight" onClick={next} disabled={!canContinue}>
            Continuer
          </Button>
        ) : (
          <Button size="lg" iconRight="Sparkles" onClick={finish}>
            C’est parti
          </Button>
        )}
      </footer>
      </div>
    </>
  )
}

const anim = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.25, ease: 'easeOut' as const },
}

function Field({
  label,
  hint,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
}: {
  label: string
  hint?: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step: number
  suffix: string
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-[0.85rem] font-semibold text-ink">{label}</span>
        <span className="tabular font-display text-xl text-brand-deep">
          {value.toLocaleString('fr-FR')} {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full"
        aria-label={label}
      />
      {hint && <p className="mt-1.5 text-[0.78rem] leading-snug text-ink-muted">{hint}</p>}
    </div>
  )
}
