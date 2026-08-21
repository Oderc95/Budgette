import clsx from 'clsx'
import { motion } from 'framer-motion'
import { useApp } from '../store/useApp'
import { BADGES } from '../domain/challenges'
import {
  GROWTH_STAGES,
  RARITY_META,
  SEASON_THEMES,
  cumulativeXpFor,
  levelFromXp,
  nextStage,
  seasonForMonth,
  stageForLevel,
} from '../domain/gamification'
import { Card, CardHeader, Chip, Progress, Stat } from '../components/ui/primitives'
import { TONE } from '../components/ui/tone'
import { Icon } from '../components/Icon'
import { Mascot } from '../components/Mascot'
import { dateLabel, monthKey } from '../lib/format'

export function Garden() {
  const profile = useApp((s) => s.profile)
  const unlocked = useApp((s) => s.unlocked)
  const budgets = useApp((s) => s.budgets)

  const level = levelFromXp(profile.xp)
  const stage = stageForLevel(level.level)
  const stageIndex = GROWTH_STAGES.findIndex((s) => s.id === stage.id)
  const upcoming = nextStage(level.level)
  const season = seasonForMonth(monthKey(new Date()))
  const unlockedMap = new Map(unlocked.map((u) => [u.badgeId, u.unlockedAt]))
  const closedMonths = budgets.filter((b) => b.closed).length

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="eyebrow">Jardin</p>
        <h1 className="mt-1 font-display text-[2rem] leading-tight text-ink">Votre progression</h1>
        <p className="mt-1 max-w-2xl text-[0.9rem] leading-relaxed text-ink-soft">
          La plante grandit avec votre régularité, pas avec vos revenus. Douze paliers, puis des saisons qui
          s’enchaînent sans fin.
        </p>
      </header>

      {/* Palier courant */}
      <Card>
        <div className="grid gap-6 p-6 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center">
          <div className="flex justify-center">
            <Mascot stageIndex={stageIndex} size={220} />
          </div>
          <div>
            <Chip tone="amber" icon="Sparkles">
              Palier {stageIndex + 1} sur {GROWTH_STAGES.length}
            </Chip>
            <h2 className="mt-3 font-display text-3xl leading-tight text-ink">{stage.label}</h2>
            <p className="mt-2 max-w-lg text-[0.92rem] leading-relaxed text-ink-soft">{stage.blurb}</p>

            <div className="mt-5 max-w-md">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-[0.85rem] font-semibold text-ink">Niveau {level.level}</span>
                <span className="tabular text-[0.8rem] text-ink-muted">
                  {level.xpInLevel} / {level.xpForLevel} XP
                </span>
              </div>
              <Progress value={level.progress} tone="amber" height={10} />
              {upcoming && (
                <p className="mt-2 text-[0.8rem] text-ink-muted">
                  Prochain palier : <span className="font-semibold text-ink">{upcoming.label}</span> au niveau{' '}
                  {upcoming.fromLevel} — encore{' '}
                  <span className="tabular font-semibold text-ink">
                    {Math.max(0, cumulativeXpFor(upcoming.fromLevel) - profile.xp)} XP
                  </span>
                  .
                </p>
              )}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              <Stat label="XP totale" value={profile.xp.toLocaleString('fr-FR')} icon="Sparkles" tone="amber" />
              <Stat label="Badges" value={`${unlocked.length}/${BADGES.length}`} icon="Trophy" tone="orchid" />
              <Stat label="Mois clôturés" value={String(closedMonths)} icon="BookCheck" tone="mint" />
              <Stat label="Meilleure série" value={`${profile.streak.best} j`} icon="Flame" tone="berry" />
            </div>
          </div>
        </div>
      </Card>

      {/* Chemin des paliers */}
      <Card>
        <CardHeader title="Le chemin complet" hint="Du grain à la canopée" icon="Sprout" tone="mint" />
        <div className="overflow-x-auto px-5 pb-5">
          <ol className="flex min-w-max items-stretch gap-2">
            {GROWTH_STAGES.map((item, index) => {
              const reached = level.level >= item.fromLevel
              const current = index === stageIndex
              return (
                <li key={item.id} className="w-36 shrink-0">
                  <div
                    className={clsx(
                      'flex h-full flex-col items-center gap-2 rounded-2xl border p-3 text-center transition',
                      current
                        ? 'border-brand bg-brand-soft'
                        : reached
                          ? 'border-line bg-surface-2'
                          : 'border-line bg-surface opacity-55',
                    )}
                  >
                    <Mascot stageIndex={index} size={62} animate={false} />
                    <span className={clsx('text-[0.82rem] font-semibold leading-tight', current ? 'text-brand-deep' : 'text-ink')}>
                      {item.label}
                    </span>
                    <span className="tabular text-[0.7rem] text-ink-muted">Niveau {item.fromLevel}</span>
                    {reached && <Icon name="Check" size={13} className="text-mint" />}
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader
          title="Vos badges"
          hint={`${unlocked.length} débloqué(s) sur ${BADGES.length}`}
          icon="Trophy"
          tone="amber"
        />
        <div className="grid gap-3 px-5 pb-5 sm:grid-cols-2 lg:grid-cols-3">
          {BADGES.map((badge) => {
            const at = unlockedMap.get(badge.id)
            const isUnlocked = Boolean(at)
            return (
              <motion.article
                key={badge.id}
                whileHover={isUnlocked ? { y: -2 } : undefined}
                className={clsx(
                  'flex gap-3 rounded-2xl border p-4 transition',
                  isUnlocked ? clsx(TONE[badge.tone].bg, TONE[badge.tone].border) : 'border-line bg-surface',
                )}
              >
                <span
                  className={clsx(
                    'grid size-11 shrink-0 place-items-center rounded-xl ring-2',
                    isUnlocked ? clsx(TONE[badge.tone].solid, 'text-on-accent', RARITY_META[badge.rarity].ring) : 'bg-surface-2 text-ink-muted ring-transparent',
                  )}
                >
                  <Icon name={isUnlocked ? badge.icon : 'Lock'} size={19} />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className={clsx('font-display text-[1rem] leading-tight', isUnlocked ? TONE[badge.tone].text : 'text-ink-soft')}>
                      {badge.label}
                    </h3>
                    <span className="chip bg-surface-2 text-ink-muted">{RARITY_META[badge.rarity].label}</span>
                  </div>
                  <p className="mt-1 text-[0.8rem] leading-snug text-ink-muted">
                    {isUnlocked ? badge.description : badge.criteria}
                  </p>
                  <p className="tabular mt-1.5 text-[0.72rem] font-semibold text-ink-muted">
                    {isUnlocked ? `Obtenu le ${dateLabel(at!)}` : `+${badge.xp} XP à débloquer`}
                  </p>
                </div>
              </motion.article>
            )
          })}
        </div>
      </Card>

      {/* Saisons */}
      <Card>
        <CardHeader
          title="Les saisons"
          hint="Un cycle de trois mois, puis on recommence avec un autre thème"
          icon={season.theme.icon}
          tone="indigo"
        />
        <div className="grid gap-3 px-5 pb-5 sm:grid-cols-2 lg:grid-cols-4">
          {SEASON_THEMES.map((theme) => {
            const active = theme.id === season.theme.id
            return (
              <div
                key={theme.id}
                className={clsx(
                  'rounded-2xl border p-4',
                  active ? 'border-brand bg-brand-soft' : 'border-line bg-surface-2',
                )}
              >
                <span className={clsx('grid size-9 place-items-center rounded-xl bg-surface', active ? 'text-brand-deep' : 'text-ink-muted')}>
                  <Icon name={theme.icon} size={17} />
                </span>
                <p className={clsx('mt-2.5 font-display text-[1.02rem]', active ? 'text-brand-deep' : 'text-ink')}>{theme.label}</p>
                <p className="mt-1 text-[0.8rem] leading-snug text-ink-muted">{theme.blurb}</p>
                {active && (
                  <p className="mt-2 text-[0.72rem] font-semibold text-brand-deep">Saison {season.index} · en cours</p>
                )}
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
