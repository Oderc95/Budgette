import clsx from 'clsx'
import { motion } from 'framer-motion'
import type { Challenge } from '../domain/types'
import { useApp, useChallengeState } from '../store/useApp'
import { Icon } from './Icon'
import { TONE } from './ui/tone'
import { DIFFICULTY_META, streakMultiplier } from '../domain/gamification'

/** Carte de défi, cochable. La progression partielle reste visible. */
export function ChallengeCard({ challenge, compact = false }: { challenge: Challenge; compact?: boolean }) {
  const progress = useChallengeState(challenge.id)
  const toggle = useApp((s) => s.toggleChallenge)
  const streak = useApp((s) => s.profile.streak.current)
  const done = progress?.completed ?? false
  const value = progress?.value ?? 0
  const ratio = Math.min(1, value / challenge.target)
  const multiplier = streakMultiplier(streak)
  const tone = TONE[challenge.tone]

  return (
    <motion.button
      type="button"
      onClick={() => toggle(challenge.id)}
      whileTap={{ scale: 0.985 }}
      aria-pressed={done}
      className={clsx(
        'group relative flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition',
        done ? clsx(tone.bg, tone.border) : 'border-line bg-surface hover:border-line-strong hover:bg-surface-2',
      )}
    >
      <span
        className={clsx(
          'grid size-10 shrink-0 place-items-center rounded-xl transition',
          done ? clsx(tone.solid, 'text-[#fffcf7]') : clsx(tone.bg, tone.text),
        )}
      >
        <Icon name={done ? 'Check' : challenge.icon} size={19} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span
            className={clsx(
              'block font-display text-[1rem] leading-tight transition',
              done ? clsx(tone.text, 'line-through decoration-1 decoration-current/40') : 'text-ink',
            )}
          >
            {challenge.title}
          </span>
          <span className={clsx('tabular chip shrink-0', done ? 'bg-gold-soft text-gold' : 'bg-surface-2 text-ink-muted')}>
            +{Math.round(challenge.xp * (done ? 1 : multiplier))} XP
          </span>
        </span>

        {!compact && (
          <span className="mt-1 block text-[0.82rem] leading-snug text-ink-muted">{challenge.description}</span>
        )}

        <span className="mt-2.5 flex items-center gap-3">
          <span className="flex items-center gap-1" aria-label={`Difficulté ${DIFFICULTY_META[challenge.difficulty].label}`}>
            {Array.from({ length: 4 }).map((_, index) => (
              <span
                key={index}
                className={clsx(
                  'size-1.5 rounded-full',
                  index < DIFFICULTY_META[challenge.difficulty].dots ? tone.solid : 'bg-surface-3',
                )}
              />
            ))}
          </span>
          <span className="text-[0.72rem] text-ink-muted">{DIFFICULTY_META[challenge.difficulty].label}</span>
          {challenge.target > 1 && (
            <span className="tabular ml-auto text-[0.72rem] font-semibold text-ink-soft">
              {Math.round(value * 10) / 10} / {challenge.target} {challenge.unit}
            </span>
          )}
        </span>

        {challenge.target > 1 && (
          <span className="mt-2 block h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
            <motion.span
              className={clsx('block h-full rounded-full', tone.solid)}
              initial={{ width: 0 }}
              animate={{ width: `${ratio * 100}%` }}
              transition={{ type: 'spring', stiffness: 90, damping: 18 }}
            />
          </span>
        )}
      </span>
    </motion.button>
  )
}
