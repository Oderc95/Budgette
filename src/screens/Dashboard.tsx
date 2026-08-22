import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { useApp } from '../store/useApp'
import { Button, Card, CardHeader, Chip, Dial, Progress } from '../components/ui/primitives'
import { TONE } from '../components/ui/tone'
import { CountUp } from '../components/CountUp'
import { useCascade } from '../lib/useCascade'
import { Icon } from '../components/Icon'
import { Mascot } from '../components/Mascot'
import { FlowBar } from '../components/FlowBar'
import { TrendChart } from '../components/TrendChart'
import { ChallengeCard } from '../components/ChallengeCard'
import { breakdown, healthScore, pocketBalance, projectGoal, summarize } from '../domain/budget'
import { buildInsights } from '../domain/insights'
import { CHALLENGES } from '../domain/challenges'
import { GROWTH_STAGES, levelFromXp, nextStage, stageForLevel } from '../domain/gamification'
import { STRATEGY_BY_ID } from '../domain/strategy'
import { euro, euroSigned, monthKey, monthLabel } from '../lib/format'

export function Dashboard() {
  const profile = useApp((s) => s.profile)
  const budgets = useApp((s) => s.budgets)
  const goals = useApp((s) => s.goals)
  const pockets = useApp((s) => s.pockets)

  const live = monthKey(new Date())
  const month = budgets.some((b) => b.month === live) ? live : (budgets[budgets.length - 1]?.month ?? live)
  const budget = budgets.find((b) => b.month === month)
  const summary = summarize(budget, month)
  const health = healthScore(summary, profile.streak.current)
  const insights = buildInsights(budgets, month)
  const level = levelFromXp(profile.xp)
  const stage = stageForLevel(level.level)
  const stageIndex = GROWTH_STAGES.findIndex((s) => s.id === stage.id)
  const upcoming = nextStage(level.level)
  const strategy = STRATEGY_BY_ID[profile.strategyId]

  const dailies = CHALLENGES.filter((c) => c.cadence === 'daily').slice(0, 4)
  const topSpending = [
    ...breakdown(budget, 'discretionary'),
    ...breakdown(budget, 'fixed'),
  ]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6)

  const mainGoal = goals[0]
  const mainPocket = mainGoal?.pocketId ? pockets.find((p) => p.id === mainGoal.pocketId) : undefined
  const saved = mainPocket ? pocketBalance(mainPocket, budgets) : 0
  const projection = mainGoal
    ? projectGoal(mainGoal.targetAmount, saved, mainGoal.deadline, month, summary.livingAllowance)
    : null

  const kpiRef = useCascade<HTMLDivElement>(':scope > *', [], { step: 60 })

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bel après-midi' : 'Bonsoir'
  const healthTone = health.total >= 80 ? 'mint' : health.total >= 60 ? 'indigo' : health.total >= 40 ? 'amber' : 'berry'

  return (
    <div className="flex flex-col gap-5">
      {/* En-tête */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{monthLabel(month)}{summary.closed ? ' · mois clôturé' : ' · en cours'}</p>
          <h1 className="mt-1 font-display text-[2rem] leading-tight text-ink">
            {greeting}, {profile.displayName}.
          </h1>
          <p className="mt-1 text-[0.9rem] text-ink-soft">
            {summary.endOfMonth >= 0 ? (
              <>
                Il vous reste{' '}
                <CountUp value={summary.endOfMonth} format={euro} className="tabular inline-block font-semibold text-mint-deep" />{' '}
                de marge ce mois-ci.
              </>
            ) : (
              <>
                Le mois est à{' '}
                <CountUp value={summary.endOfMonth} format={euro} className="tabular inline-block font-semibold text-berry-deep" />
                . On regarde ensemble d'où ça vient.
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Chip tone="berry" icon="Flame">
            {profile.streak.current} jours
          </Chip>
          <Link to="/mois">
            <Button icon="PenLine">Saisir le mois</Button>
          </Link>
        </div>
      </header>

      {/*
        La bande d'indicateurs : les quatre chiffres du mois, une seule fois.
        Ils vivaient éparpillés dans la carte de répartition — deux grandes
        tuiles plus trois petites qui répétaient les mêmes montants.
      */}
      <div ref={kpiRef} className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {[
          {
            label: 'Revenus',
            value: summary.totals.income,
            format: euro,
            tone: 'mint' as const,
            hint: 'Total du mois, report compris',
          },
          {
            label: 'Charges fixes',
            value: summary.totals.fixed,
            format: euro,
            tone: summary.fixedRate > 0.5 ? ('berry' as const) : ('indigo' as const),
            hint: summary.fixedRate > 0.5 ? 'Au-delà du repère de 50 %' : 'Sous le repère de 50 %',
          },
          {
            label: 'Épargne',
            value: summary.totals.saving,
            format: euro,
            tone: 'amber' as const,
            hint: `${Math.round(summary.savingRate * 100)} % de votre revenu`,
          },
          {
            label: 'Reste à vivre',
            value: summary.livingAllowance,
            format: euro,
            tone: 'mint' as const,
            hint: 'Après charges et dettes',
          },
          {
            label: 'Dettes',
            value: summary.totals.debt,
            format: euro,
            tone: summary.totals.debt > 0 ? ('berry' as const) : ('mint' as const),
            hint: summary.totals.debt > 0 ? `${Math.round(summary.debtRate * 100)} % de votre revenu` : 'Aucune dette ce mois-ci',
          },
          {
            label: 'Fin du mois',
            value: summary.endOfMonth,
            format: euroSigned,
            tone: summary.endOfMonth >= 0 ? ('mint' as const) : ('berry' as const),
            hint: 'Épargne et envies passées',
          },
        ].map((kpi) => (
          <div key={kpi.label} className={clsx('rounded-2xl border p-3.5 sm:p-4', TONE[kpi.tone].bg, TONE[kpi.tone].border)}>
            <p className="eyebrow text-[0.6rem] sm:text-[0.68rem]">{kpi.label}</p>
            <CountUp
              value={kpi.value}
              format={kpi.format}
              className={clsx('tabular mt-1 block font-display text-xl leading-none sm:text-[1.7rem]', TONE[kpi.tone].deep)}
            />
            <p className="mt-1.5 hidden text-[0.72rem] leading-snug text-ink-muted sm:block">{kpi.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          {/* Le mois en cours */}
          <Card>
            <CardHeader
              title="Où part mon argent"
              hint={`Sur ${euro(summary.totals.income)} de revenus`}
              icon="Wallet"
              action={
                <Link to="/mois" className="text-[0.8rem] font-semibold text-brand-deep hover:underline">
                  Détail
                </Link>
              }
            />
            <div className="px-5 pb-5">
              <FlowBar totals={summary.totals} />

              {/* Les postes les plus lourds du mois, sous la répartition
                  qu'ils composent : une seule carte raconte la dépense. */}
              <ul className="mt-5 flex flex-col gap-1 border-t border-line pt-4">
                {topSpending.map((item) => {
                  const share = summary.totals.income > 0 ? item.amount / summary.totals.income : 0
                  return (
                    <li key={item.categoryId} className="flex items-center gap-3 py-2">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-ink-soft">
                        <Icon name={item.icon} size={15} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="truncate text-[0.88rem] font-medium text-ink">{item.label}</span>
                          <span className="tabular shrink-0 text-[0.88rem] font-semibold text-ink">{euro(item.amount)}</span>
                        </span>
                        <span className="mt-1.5 block">
                          <Progress value={share} tone="orchid" height={5} label={item.label} />
                        </span>
                      </span>
                      <span className="tabular w-10 shrink-0 text-right text-[0.75rem] text-ink-muted">
                        {Math.round(share * 100)} %
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </Card>

          {/* Analyses */}
          <Card>
            <CardHeader title="Ce que disent vos chiffres" hint="Des constats, et un geste à essayer" icon="Telescope" tone="indigo" />
            <div className="grid gap-3 px-5 pb-5 sm:grid-cols-2">
              {insights.slice(0, 4).map((insight) => (
                <motion.article
                  key={insight.id}
                  whileHover={{ y: -3, scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                  className={clsx('rounded-2xl border p-4', TONE[insight.tone].bg, TONE[insight.tone].border)}
                >
                  <div className="flex items-start gap-2.5">
                    <Icon name={insight.icon} size={17} className={clsx('mt-0.5 shrink-0', TONE[insight.tone].text)} />
                    <div className="min-w-0">
                      <h3 className={clsx('font-display text-[0.98rem] leading-tight', TONE[insight.tone].deep)}>
                        {insight.title}
                      </h3>
                      <p className="mt-1.5 text-[0.82rem] leading-relaxed text-ink-soft">{insight.body}</p>
                      {insight.action && (
                        <p className="mt-2 flex items-center gap-1.5 text-[0.78rem] font-semibold text-ink">
                          <Icon name="ArrowRight" size={13} />
                          {insight.action}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </Card>

          {/* Trajectoire */}
          <Card>
            <CardHeader title="Votre trajectoire" hint="Mois après mois" icon="TrendingUp" tone="amber" />
            <div className="px-3 pb-4 sm:px-5">
              <TrendChart budgets={budgets} />
            </div>
          </Card>

          {/* Mon année : le pont vers la vue annuelle et le calendrier */}
          <Link
            to="/annee"
            className="card card-hover flex items-center gap-3 px-5 py-4"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-soft text-amber-deep">
              <Icon name="CalendarRange" size={17} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.95rem] font-semibold text-ink">Mon année</span>
              <span className="block truncate text-[0.78rem] text-ink-muted">
                Récap des douze mois et calendrier des charges à venir
              </span>
            </span>
            <Icon name="ArrowRight" size={16} className="shrink-0 text-ink-muted" />
          </Link>

          {/* Objectif principal */}
          {mainGoal && projection && (
            <Card>
              <CardHeader title="Votre objectif" hint={strategy ? `Stratégie ${strategy.name}` : undefined} icon="Target" tone="mint" />
              <div className="px-5 pb-5">
                <p className="font-display text-lg leading-tight text-ink">{mainGoal.label}</p>
                <p className="tabular mt-2 text-[0.85rem] text-ink-soft">
                  <span className="font-semibold text-mint-deep">{euro(saved)}</span> sur {euro(mainGoal.targetAmount)}
                </p>
                <div className="mt-2">
                  <Progress value={saved / mainGoal.targetAmount} tone="mint" />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-surface-2 p-3">
                    <dt className="eyebrow">Effort mensuel</dt>
                    <dd className="tabular mt-1 font-display text-lg text-ink">{euro(projection.monthlyEffort)}</dd>
                  </div>
                  <div className="rounded-xl bg-surface-2 p-3">
                    <dt className="eyebrow">Il reste</dt>
                    <dd className="tabular mt-1 font-display text-lg text-ink">{projection.monthsRemaining} mois</dd>
                  </div>
                </dl>
                <Link to="/objectifs" className="mt-4 block">
                  <Button variant="outline" full iconRight="ArrowRight">
                    Gérer mes objectifs
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>

        {/* Colonne latérale */}
        <div className="flex min-w-0 flex-col gap-5">
          {/* Jardin */}
          <Card>
            <div className="flex flex-col items-center px-5 pb-5 pt-6 text-center">
              <Mascot stageIndex={stageIndex} size={150} />
              <p className="eyebrow mt-3">{stage.label}</p>
              <p className="mt-1 font-display text-xl text-ink">Niveau {level.level}</p>
              <p className="mt-1.5 max-w-[24ch] text-[0.82rem] leading-snug text-ink-muted">{stage.blurb}</p>
              <div className="mt-4 w-full">
                <Progress value={level.progress} tone="amber" />
                <p className="tabular mt-2 text-[0.75rem] text-ink-muted">
                  {level.xpInLevel} / {level.xpForLevel} XP
                  {upcoming && ` · ${upcoming.label} au niveau ${upcoming.fromLevel}`}
                </p>
              </div>
              <Link to="/jardin" className="mt-4 w-full">
                <Button variant="soft" full iconRight="ArrowRight">
                  Voir le jardin
                </Button>
              </Link>
            </div>
          </Card>

          {/* Score de santé */}
          <Card>
            <CardHeader title="Santé budgétaire" hint="Un repère pédagogique, sur 100" icon="HeartPulse" tone={healthTone} />
            <div className="flex flex-col items-center px-5 pb-5">
              <Dial value={health.total / 100} tone={healthTone}>
                <span>
                  <CountUp
                    value={health.total}
                    format={(n: number) => String(Math.round(n))}
                    className={clsx('tabular block font-display text-3xl leading-none', TONE[healthTone].text)}
                  />
                  <span className="mt-1 block text-[0.72rem] font-semibold text-ink-muted">{health.grade}</span>
                </span>
              </Dial>
              <ul className="mt-4 w-full flex-col gap-2.5">
                {health.parts.map((part) => (
                  <li key={part.label} className="mb-2.5">
                    <span className="flex items-baseline justify-between gap-2 text-[0.8rem]">
                      <span className="text-ink-soft">{part.label}</span>
                      <span className="tabular font-semibold text-ink">
                        {part.score}/{part.max}
                      </span>
                    </span>
                    <span className="mt-1 block">
                      <Progress value={part.score / part.max} tone={healthTone} height={5} label={part.label} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          {/* Défis du jour */}
          <Card>
            <CardHeader
              title="Défis du jour"
              hint="Cochez ce que vous avez tenu"
              icon="Sun"
              tone="amber"
              action={
                <Link to="/quetes" className="text-[0.8rem] font-semibold text-brand-deep hover:underline">
                  Tout voir
                </Link>
              }
            />
            <div className="flex flex-col gap-2.5 px-5 pb-5">
              {dailies.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} compact />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
