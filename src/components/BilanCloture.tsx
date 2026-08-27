import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useApp } from '../store/useApp'
import { Button } from './ui/primitives'
import { Icon } from './Icon'
import { Mascot } from './Mascot'
import { TONE } from './ui/tone'
import { BADGE_BY_ID } from '../domain/challenges'
import { GROWTH_STAGES, levelFromXp, stageForLevel } from '../domain/gamification'
import { summarize } from '../domain/budget'
import { euro, monthLabel } from '../lib/format'

/**
 * Cérémonie de fin de mois.
 *
 * Clôturer est le geste le plus engageant de l'application : il fige un mois.
 * Il méritait mieux qu'une bulle de notification. L'écran se déroule en trois
 * temps — la plante pousse, la progression se remplit, les badges tombent un
 * par un — et ne s'ouvre que juste après le geste, jamais autrement.
 *
 * Le déroulé est piloté par une horloge et non par un enchaînement de
 * `onAnimationComplete` : une animation coupée par « réduire les animations »
 * ne doit pas laisser la cérémonie bloquée à mi-chemin.
 */
const TEMPS = { pousse: 900, progression: 1500, badges: 2200 }

export function BilanCloture() {
  const bilan = useApp((s) => s.bilan)
  // La cérémonie est montée à la clôture et démontée à sa fermeture : son
  // déroulé repart donc de zéro sans avoir à le remettre à zéro.
  return bilan ? <Ceremonie key={bilan.month} /> : null
}

function Ceremonie() {
  const bilan = useApp((s) => s.bilan)!
  const clearBilan = useApp((s) => s.clearBilan)
  const budgets = useApp((s) => s.budgets)
  const profile = useApp((s) => s.profile)

  const [acte, setActe] = useState(0)

  useEffect(() => {
    const minuteries = [
      setTimeout(() => setActe(1), TEMPS.pousse),
      setTimeout(() => setActe(2), TEMPS.progression),
      setTimeout(() => setActe(3), TEMPS.badges),
    ]
    return () => minuteries.forEach(clearTimeout)
  }, [])

  const budget = budgets.find((b) => b.month === bilan.month)
  const resume = summarize(budget, bilan.month)
  const niveau = levelFromXp(profile.xp)

  const stageApres = stageForLevel(bilan.niveauApres)
  const stageAvant = stageForLevel(bilan.niveauAvant)
  const indexApres = GROWTH_STAGES.findIndex((s) => s.id === stageApres.id)
  const indexAvant = GROWTH_STAGES.findIndex((s) => s.id === stageAvant.id)
  const aGrandi = indexApres > indexAvant

  const chiffres = [
    { label: 'Épargné', valeur: resume.totals.saving, tone: 'amber' as const, icon: 'PiggyBank' },
    { label: 'Reste', valeur: resume.endOfMonth, tone: 'mint' as const, icon: 'Wallet' },
  ]

  return (
    <AnimatePresence>
      <motion.div
        className="pad-safe-top pad-safe-x pad-safe-bottom [--pad-x:1.25rem] [--pad-bottom:1.25rem] fixed inset-0 z-[70] flex flex-col overflow-y-auto bg-bg/95 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-label={`Bilan de ${monthLabel(bilan.month)}`}
      >
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 py-6">
          <div className="text-center">
            <p className="eyebrow">{monthLabel(bilan.month)} · clôturé</p>
            <h1 className="mt-1.5 font-display text-[1.9rem] leading-tight text-ink">
              {aGrandi ? 'Votre plante a grandi.' : 'Un mois de plus au compteur.'}
            </h1>
          </div>

          {/* Acte 1 — la plante pousse */}
          <motion.div
            className="flex justify-center"
            initial={{ scale: 0.86, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <motion.div
              // Le sursaut ne se joue que si le palier a réellement changé :
              // sinon l'écran promettrait une croissance qui n'a pas eu lieu.
              animate={aGrandi && acte >= 1 ? { scale: [1, 1.08, 1] } : undefined}
              transition={{ duration: 0.9, ease: 'easeInOut' }}
            >
              <Mascot stageIndex={acte >= 1 ? indexApres : indexAvant} size={170} />
            </motion.div>
          </motion.div>

          <p className="text-center text-[0.85rem] text-ink-soft">
            {stageApres.label} · niveau {bilan.niveauApres}
            {aGrandi && <span className="ml-1 font-semibold text-mint-deep">nouveau palier</span>}
          </p>

          {/* Acte 2 — la progression vers le palier suivant */}
          <div>
            <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
              <motion.span
                className="block h-full rounded-full bg-brand"
                initial={{ width: 0 }}
                animate={{ width: acte >= 1 ? `${niveau.progress * 100}%` : 0 }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <p className="tabular mt-2 flex items-center justify-between text-[0.76rem] text-ink-muted">
              <span>
                {niveau.xpInLevel} / {niveau.xpForLevel} XP
              </span>
              <motion.span
                className="font-semibold text-brand-deep"
                initial={{ opacity: 0, y: 6 }}
                animate={acte >= 1 ? { opacity: 1, y: 0 } : undefined}
              >
                +{bilan.xpGagne} XP ce mois-ci
              </motion.span>
            </p>
          </div>

          {/* Les deux chiffres du mois, sans le tableau de bord complet. */}
          <motion.div
            className="grid grid-cols-2 gap-3"
            initial={{ opacity: 0, y: 12 }}
            animate={acte >= 2 ? { opacity: 1, y: 0 } : undefined}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          >
            {chiffres.map((c) => (
              <div key={c.label} className={`rounded-2xl border p-3.5 ${TONE[c.tone].bg} ${TONE[c.tone].border}`}>
                <p className="flex items-center gap-1.5 text-[0.7rem] uppercase tracking-widest text-ink-muted">
                  <Icon name={c.icon} size={13} />
                  {c.label}
                </p>
                <p className={`tabular mt-1 font-display text-2xl leading-none ${TONE[c.tone].deep}`}>
                  {euro(c.valeur)}
                </p>
              </div>
            ))}
          </motion.div>

          {/* Acte 3 — les badges, un par un */}
          {bilan.badges.length > 0 && (
            <div>
              <p className="eyebrow mb-2 text-center">
                {bilan.badges.length === 1 ? 'Badge débloqué' : `${bilan.badges.length} badges débloqués`}
              </p>
              <div className="flex flex-wrap justify-center gap-2.5">
                {bilan.badges.map((id, index) => {
                  const badge = BADGE_BY_ID[id]
                  if (!badge) return null
                  const tone = TONE[badge.tone]
                  return (
                    <motion.div
                      key={id}
                      className={`flex items-center gap-2 rounded-full border px-3 py-2 ${tone.bg} ${tone.border}`}
                      initial={{ opacity: 0, scale: 0.4, y: 14 }}
                      animate={acte >= 3 ? { opacity: 1, scale: 1, y: 0 } : undefined}
                      transition={{
                        type: 'spring',
                        stiffness: 320,
                        damping: 18,
                        // Chaque pastille attend son tour : c'est l'égrenage
                        // qui fait la récompense, pas l'apparition groupée.
                        delay: index * 0.22,
                      }}
                    >
                      <span className={`grid size-7 place-items-center rounded-full bg-surface ${tone.deep}`}>
                        <Icon name={badge.icon} size={15} />
                      </span>
                      <span className={`text-[0.82rem] font-semibold ${tone.deep}`}>{badge.label}</span>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          <Button size="lg" full iconRight="ArrowRight" onClick={clearBilan}>
            Continuer
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
