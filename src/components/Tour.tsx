import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import type { Tone } from '../domain/types'
import { useApp } from '../store/useApp'
import { Icon } from './Icon'
import { Mascot } from './Mascot'
import { TONE } from './ui/tone'
import { Button } from './ui/primitives'

/**
 * Visite guidée de la première arrivée.
 *
 * La mascotte présente les cinq destinations, une carte par écran, une phrase
 * par carte : le but est qu'on comprenne l'app avant d'avoir lu quoi que ce
 * soit d'autre. Elle ne se montre qu'une fois — l'état est persisté — et se
 * rejoue depuis le profil via « Réinitialiser la démonstration ».
 */
const ETAPES: { icon: string; tone: Tone; titre: string; texte: string }[] = [
  { icon: 'LayoutDashboard', tone: 'brand', titre: 'Ton accueil', texte: 'Ce qu’il te reste ce mois-ci, en un coup d’œil.' },
  { icon: 'PenLine', tone: 'indigo', titre: 'Mon mois', texte: 'Note tes dépenses. Une fois par mois suffit.' },
  { icon: 'ListChecks', tone: 'berry', titre: 'Les quêtes', texte: 'Des défis à cocher, de l’XP à gagner.' },
  { icon: 'Target', tone: 'orchid', titre: 'Tes objectifs', texte: 'Tes projets, chiffrés et datés.' },
  { icon: 'Sprout', tone: 'mint', titre: 'Ton jardin', texte: 'Ta plante pousse quand tu es régulier. Prends-en soin !' },
]

export function Tour() {
  const tourDone = useApp((s) => s.tourDone)
  const completeTour = useApp((s) => s.completeTour)
  const pushToast = useApp((s) => s.pushToast)
  const [etape, setEtape] = useState(0)

  if (tourDone) return null

  const derniere = etape === ETAPES.length - 1
  const actuelle = ETAPES[etape]
  const tone = TONE[actuelle.tone]

  const terminer = () => {
    completeTour()
    pushToast({ title: 'À toi de jouer !', detail: 'Ton jardin n’attend que toi.', tone: 'mint', icon: 'Sprout' })
  }

  return (
    <motion.div
      className="fixed inset-0 z-[60] grid place-items-center bg-bg/70 p-5 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      role="dialog"
      aria-modal="true"
      aria-label="Visite guidée"
    >
      <motion.div
        className="card w-full max-w-sm overflow-hidden text-center"
        initial={{ scale: 0.9, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
      >
        {/* La mascotte guide : elle se balance en attendant qu'on avance. */}
        <div className="flex justify-center pt-6">
          <motion.div
            animate={{ rotate: [0, -3, 3, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Mascot stageIndex={2} size={96} animate={false} />
          </motion.div>
        </div>

        <div className="px-6 pb-6 pt-2">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={etape}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            >
              <motion.span
                className={clsx('mx-auto grid size-12 place-items-center rounded-2xl', tone.bg, tone.deep)}
                initial={{ rotate: -12, scale: 0.7 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 340, damping: 14 }}
              >
                <Icon name={actuelle.icon} size={22} />
              </motion.span>
              <h2 className="mt-3 font-display text-2xl text-ink">{actuelle.titre}</h2>
              <p className="mt-1.5 text-[0.95rem] leading-snug text-ink-soft">{actuelle.texte}</p>
            </motion.div>
          </AnimatePresence>

          {/* Progression : un point par étape, celui en cours s'étire. */}
          <div className="mt-5 flex justify-center gap-1.5" aria-hidden>
            {ETAPES.map((_, index) => (
              <motion.span
                key={index}
                className={clsx(
                  'h-1.5 rounded-full transition-colors',
                  index === etape ? tone.solid : 'bg-surface-3',
                )}
                animate={{ width: index === etape ? 22 : 6 }}
                transition={{ type: 'spring', stiffness: 400, damping: 26 }}
              />
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={terminer}
              className="text-[0.82rem] font-medium text-ink-muted transition hover:text-ink"
            >
              Passer
            </button>
            <Button
              icon={derniere ? 'Sparkles' : undefined}
              iconRight={derniere ? undefined : 'ArrowRight'}
              onClick={() => (derniere ? terminer() : setEtape((e) => e + 1))}
            >
              {derniere ? 'C’est parti !' : 'Suivant'}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
