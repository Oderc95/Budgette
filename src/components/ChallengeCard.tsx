import clsx from 'clsx'
import { motion } from 'framer-motion'
import type { Challenge } from '../domain/types'
import { useApp } from '../store/useApp'
import { avancement, estReussie, mesurer } from '../domain/challenges'
import { Icon } from './Icon'
import { TONE } from './ui/tone'
import { DIFFICULTY_META } from '../domain/gamification'

/**
 * Carte de quête.
 *
 * Elle n'est plus cochable. Une quête se gagne en saisissant son mois, pas en
 * déclarant l'avoir gagnée : l'application mesure, affiche l'écart au but, et
 * crédite l'expérience d'elle-même. Ce qui s'affiche ici est donc toujours le
 * reflet des chiffres, jamais une intention.
 */
export function ChallengeCard({
  challenge,
  compact = false,
  featured = false,
}: {
  challenge: Challenge
  compact?: boolean
  featured?: boolean
}) {
  const budgets = useApp((s) => s.budgets)
  const pockets = useApp((s) => s.pockets)
  const goals = useApp((s) => s.goals)
  const month = useApp((s) => s.activeMonth)

  const ctx = { budgets, month, pockets, goals }
  const valeur = mesurer(challenge, ctx)
  const done = estReussie(challenge, valeur, ctx)
  const ratio = avancement(challenge, valeur, ctx)
  const tone = TONE[challenge.tone]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className={clsx(
        'group relative flex w-full items-start gap-3 overflow-hidden rounded-2xl border p-4 text-left',
        done ? clsx(tone.bg, tone.border) : 'border-line bg-surface',
      )}
    >
      <span
        className={clsx(
          'grid size-10 shrink-0 place-items-center rounded-xl transition',
          done ? clsx('bg-surface', tone.deep) : 'bg-surface-2 text-ink-muted',
        )}
      >
        <Icon name={done ? 'Check' : challenge.icon} size={19} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2">
          <span className={clsx('text-[0.92rem] font-semibold leading-tight', done ? tone.deep : 'text-ink')}>
            {challenge.title}
          </span>
          {featured && !done && (
            <span className="chip bg-brand-soft text-brand-deep">Conseillée</span>
          )}
        </p>

        {!compact && (
          <p className="mt-1 text-[0.8rem] leading-snug text-ink-muted">{challenge.description}</p>
        )}

        {/* Mesure : la valeur relevée, face à la cible. */}
        <div className="mt-2.5">
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
            <motion.span
              className={clsx('block h-full rounded-full', done ? tone.solid : 'bg-line-strong')}
              initial={{ width: 0 }}
              animate={{ width: `${ratio * 100}%` }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <p className="tabular mt-1.5 flex items-center justify-between text-[0.72rem] text-ink-muted">
            <span>
              {valeur} / {challenge.target} {challenge.unit}
            </span>
            <span className="flex items-center gap-2">
              <span className="flex items-center gap-0.5" title={DIFFICULTY_META[challenge.difficulty].label}>
                {Array.from({ length: 4 }).map((_, index) => (
                  <span
                    key={index}
                    className={clsx(
                      'block size-1 rounded-full',
                      index < DIFFICULTY_META[challenge.difficulty].dots ? 'bg-ink-muted' : 'bg-line',
                    )}
                  />
                ))}
              </span>
              <span className={done ? tone.deep : undefined}>+{challenge.xp} XP</span>
            </span>
          </p>
        </div>
      </div>
    </motion.div>
  )
}
