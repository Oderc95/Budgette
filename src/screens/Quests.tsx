import { useState } from 'react'
import { useCascade } from '../lib/useCascade'
import clsx from 'clsx'
import { useApp } from '../store/useApp'
import { CHALLENGES, estReussie, mesurer } from '../domain/challenges'
import { CADENCE_META, levelFromXp, seasonForMonth, streakMultiplier } from '../domain/gamification'
import { STRATEGY_BY_ID } from '../domain/strategy'
import { ChallengeCard } from '../components/ChallengeCard'
import { Card, CardHeader, Chip, Progress } from '../components/ui/primitives'
import { Icon } from '../components/Icon'
import { monthKey } from '../lib/format'
import type { ChallengeCadence } from '../domain/types'

const CADENCES: ChallengeCadence[] = ['unique', 'monthly', 'yearly']

export function Quests() {
  const profile = useApp((s) => s.profile)
  const budgets = useApp((s) => s.budgets)
  const pockets = useApp((s) => s.pockets)
  const goals = useApp((s) => s.goals)
  const month = useApp((s) => s.activeMonth)
  const ctx = { budgets, month, pockets, goals }
  const [cadence, setCadence] = useState<ChallengeCadence>('monthly')
  // Les cartes de défis tombent en cascade à chaque changement de cadence.
  const listeRef = useCascade<HTMLDivElement>('.group', [cadence])

  const season = seasonForMonth(monthKey(new Date()))
  const level = levelFromXp(profile.xp)
  const multiplier = streakMultiplier(profile.streak.current)
  const strategy = STRATEGY_BY_ID[profile.strategyId]
  const featured = new Set(strategy?.featuredChallenges ?? [])

  /*
   * Ordre d'affichage : ce qui reste à faire d'abord, en commençant par les
   * quêtes que la stratégie met en avant. Les quêtes déjà gagnées descendent :
   * elles ne demandent plus rien.
   */
  const list = CHALLENGES.filter((c) => c.cadence === cadence).sort((a, b) => {
    const aFait = estReussie(a, mesurer(a, ctx), ctx) ? 1 : 0
    const bFait = estReussie(b, mesurer(b, ctx), ctx) ? 1 : 0
    const aMisEnAvant = featured.has(a.id) ? 0 : 1
    const bMisEnAvant = featured.has(b.id) ? 0 : 1
    return aFait - bFait || aMisEnAvant - bMisEnAvant || a.xp - b.xp
  })

  // Le compteur relit la mesure : il ne peut pas afficher « 3/5 » alors que
  // les cartes en dessous en montrent deux de gagnées.
  const completedCount = (target: ChallengeCadence) =>
    CHALLENGES.filter((c) => c.cadence === target).filter((c) => estReussie(c, mesurer(c, ctx), ctx)).length

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="eyebrow">Quêtes</p>
        <h1 className="mt-1 font-display text-[2rem] leading-tight text-ink">Ce que votre saisie débloque</h1>
        <p className="mt-1 max-w-2xl text-[0.9rem] leading-relaxed text-ink-soft">
          Chaque quête se mesure sur les chiffres du mois. Rien à cocher : saisissez, elles se valident.
        </p>
      </header>

      {/* Saison en cours */}
      <Card>
        <div className="flex flex-wrap items-center gap-4 px-5 py-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand-deep">
            <Icon name={season.theme.icon} size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[1.1rem] leading-tight text-ink">{season.label}</p>
            <p className="text-[0.82rem] text-ink-muted">{season.theme.blurb}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone="amber" icon="Sparkles">
              Niveau {level.level}
            </Chip>
            <Chip tone="berry" icon="Flame">
              Série {profile.streak.current} j
            </Chip>
            {multiplier > 1 && (
              <Chip tone="orchid" icon="TrendingUp">
                XP ×{multiplier}
              </Chip>
            )}
          </div>
        </div>
        <div className="px-5 pb-4">
          <Progress value={level.progress} tone="amber" />
          <p className="tabular mt-2 text-[0.75rem] text-ink-muted">
            {level.xpInLevel} / {level.xpForLevel} XP avant le niveau {level.level + 1}
          </p>
        </div>
      </Card>

      {/* Sélecteur de cadence */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CADENCES.map((item) => {
          const active = cadence === item
          const total = CHALLENGES.filter((c) => c.cadence === item).length
          return (
            <button
              key={item}
              type="button"
              onClick={() => setCadence(item)}
              className={clsx(
                'flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-[0.85rem] font-semibold transition',
                active ? 'border-brand bg-brand-soft text-brand-deep' : 'border-line bg-surface text-ink-soft hover:bg-surface-2',
              )}
            >
              <Icon name={CADENCE_META[item].icon} size={15} />
              {CADENCE_META[item].label}
              <span className={clsx('tabular rounded-full px-1.5 text-[0.72rem]', active ? 'bg-brand text-on-accent' : 'bg-surface-2')}>
                {completedCount(item)}/{total}
              </span>
            </button>
          )
        })}
      </div>

      <Card>
        <CardHeader
          title={CADENCE_META[cadence].plural}
          hint={CADENCE_META[cadence].resetHint}
          icon={CADENCE_META[cadence].icon}
          tone="amber"
        />
        <div ref={listeRef} className="grid gap-3 px-5 pb-5 lg:grid-cols-2">
          {list.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} featured={featured.has(challenge.id)} />
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Comment ça compte" icon="Info" tone="indigo" />
        <ul className="flex flex-col gap-2.5 px-5 pb-5 text-[0.85rem] leading-relaxed text-ink-soft">
          <li className="flex gap-2">
            <Icon name="Check" size={15} className="mt-0.5 shrink-0 text-mint" />
            Rien ne se coche à la main : chaque quête se lit dans votre saisie du mois, et se valide toute seule.
          </li>
          <li className="flex gap-2">
            <Icon name="Check" size={15} className="mt-0.5 shrink-0 text-mint" />
            Corriger une saisie peut faire retomber une quête sous son seuil. L’expérience déjà gagnée, elle, reste acquise.
          </li>
          <li className="flex gap-2">
            <Icon name="Check" size={15} className="mt-0.5 shrink-0 text-mint" />
            Manquer une quête ne retire jamais d’expérience. On ne construit pas une habitude avec une punition.
          </li>
        </ul>
      </Card>
    </div>
  )
}
