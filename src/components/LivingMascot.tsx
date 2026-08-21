import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Mascot } from './Mascot'

/**
 * La mascotte du jardin, version vivante.
 *
 * La plante réagit au tapotement, et sa compagnie s'étoffe avec les paliers :
 * un papillon vient butiner à partir du palier « Jeune plant », des oiseaux
 * se posent à partir de « Arbre fruitier ». Tapoter la plante la secoue — et fait fuir
 * les visiteurs, qui reviennent d'eux-mêmes quelques secondes plus tard.
 *
 * Tout est déterministe : mêmes positions et mêmes trajectoires à chaque
 * rendu, seul le moment du tapotement appartient à la personne.
 */

const BUTTERFLY_STAGE = 3
const BIRDS_STAGE = 6

/** Un oiseau simple, deux tons, qui se lit à 24 px. */
function Bird({ tint }: { tint: string }) {
  return (
    <svg viewBox="0 0 24 20" width="24" height="20" aria-hidden>
      <ellipse cx="11" cy="12" rx="7" ry="5.4" fill={tint} />
      <circle cx="17.5" cy="8" r="3.6" fill={tint} />
      <path d="M21 7.4 L 24 8.4 L 21 9.6 Z" fill="var(--c-amber)" />
      <path d="M4.5 11 C 7 8.5, 11 8.2, 13.5 10.4 C 11 13, 7 13.2, 4.5 11 Z" fill="var(--c-bg)" opacity="0.5" />
      <circle cx="18.6" cy="7.2" r="0.8" fill="var(--c-bg)" />
    </svg>
  )
}

function Butterfly() {
  return (
    <motion.svg
      viewBox="0 0 20 16"
      width="20"
      height="16"
      aria-hidden
      animate={{ scaleX: [1, 0.45, 1] }}
      transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <ellipse cx="7" cy="7" rx="5" ry="4.4" fill="var(--c-orchid)" opacity="0.9" />
      <ellipse cx="13" cy="7" rx="5" ry="4.4" fill="var(--c-orchid)" opacity="0.7" />
      <rect x="9.4" y="3" width="1.2" height="10" rx="0.6" fill="var(--c-text)" opacity="0.6" />
    </motion.svg>
  )
}

/** Positions perchées et trajectoires de fuite, une par oiseau. */
const BIRDS = [
  { tint: 'var(--c-berry)', at: { left: '8%', top: '16%' }, idle: 0, flee: { x: -150, y: -120, rotate: -18 } },
  { tint: 'var(--c-indigo)', at: { right: '4%', top: '8%' }, idle: 0.6, flee: { x: 160, y: -140, rotate: 14 } },
  { tint: 'var(--c-amber)', at: { right: '14%', top: '38%' }, idle: 1.1, flee: { x: 130, y: -90, rotate: 22 } },
]

export function LivingMascot({ stageIndex, size = 220 }: { stageIndex: number; size?: number }) {
  const [fleeing, setFleeing] = useState(false)
  const [shake, setShake] = useState(0)
  const retour = useRef<number | undefined>(undefined)

  const hasButterfly = stageIndex >= BUTTERFLY_STAGE
  const hasBirds = stageIndex >= BIRDS_STAGE

  const tapoter = () => {
    setShake((s) => s + 1)
    if (hasBirds || hasButterfly) {
      setFleeing(true)
      window.clearTimeout(retour.current)
      retour.current = window.setTimeout(() => setFleeing(false), 4200)
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.button
        type="button"
        onClick={tapoter}
        aria-label="Tapoter la plante"
        className="relative cursor-pointer select-none rounded-3xl outline-none"
        whileTap={{ scale: 0.96 }}
      >
        {/* La secousse : une rotation amortie, relancée à chaque tapotement. */}
        <motion.div
          key={shake}
          animate={shake > 0 ? { rotate: [0, -5, 4, -2, 0] } : undefined}
          transition={{ duration: 0.55, ease: 'easeInOut' }}
        >
          <Mascot stageIndex={stageIndex} size={size} />
        </motion.div>

        {hasBirds &&
          BIRDS.map((bird, index) => (
            <motion.span
              key={index}
              className="pointer-events-none absolute"
              style={bird.at}
              animate={
                fleeing
                  ? { ...bird.flee, opacity: 0, transition: { duration: 0.7, ease: 'easeIn' } }
                  : {
                      x: 0,
                      rotate: 0,
                      opacity: 1,
                      y: [0, -3, 0],
                      transition: {
                        opacity: { duration: 0.8, delay: 0.4 + index * 0.5 },
                        y: { duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: bird.idle },
                      },
                    }
              }
            >
              <Bird tint={bird.tint} />
            </motion.span>
          ))}

        {hasButterfly && (
          <motion.span
            className="pointer-events-none absolute left-[6%] top-[30%]"
            animate={
              fleeing
                ? { x: -120, y: -110, opacity: 0, transition: { duration: 0.6, ease: 'easeIn' } }
                : {
                    opacity: 1,
                    x: [0, 26, 10, 32, 0],
                    y: [0, -16, -30, -10, 0],
                    transition: {
                      opacity: { duration: 0.6, delay: 0.6 },
                      x: { duration: 9, repeat: Infinity, ease: 'easeInOut' },
                      y: { duration: 9, repeat: Infinity, ease: 'easeInOut' },
                    },
                  }
            }
          >
            <Butterfly />
          </motion.span>
        )}

        {/* Quelques feuilles s'échappent à chaque secousse. */}
        <AnimatePresence>
          {shake > 0 && (
            <motion.span key={shake} className="pointer-events-none absolute inset-0" aria-hidden>
              {[
                { left: '30%', dx: -26 },
                { left: '55%', dx: 18 },
                { left: '44%', dx: 34 },
              ].map((leaf, index) => (
                <motion.span
                  key={index}
                  className="absolute top-[35%]"
                  style={{ left: leaf.left }}
                  initial={{ opacity: 0.9, y: 0, x: 0, rotate: 0 }}
                  animate={{ opacity: 0, y: 70, x: leaf.dx, rotate: leaf.dx * 3 }}
                  transition={{ duration: 1.1, delay: index * 0.08, ease: 'easeIn' }}
                >
                  <svg viewBox="0 0 12 8" width="12" height="8">
                    <path d="M0 4 C 3 0.5, 9 0.5, 12 4 C 9 7.5, 3 7.5, 0 4 Z" fill="var(--c-mint)" opacity="0.85" />
                  </svg>
                </motion.span>
              ))}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <p className="text-[0.75rem] text-ink-muted">Tapote la plante 👆</p>
    </div>
  )
}
