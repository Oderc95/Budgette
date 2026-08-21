import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useApp } from '../store/useApp'
import { Mascot } from './Mascot'

/**
 * La mascotte du jardin, version vivante.
 *
 * La plante réagit au tapotement, et sa compagnie s'étoffe avec les paliers :
 * une coccinelle dès « Germe », un papillon dès « Jeune plant », des lucioles
 * la nuit dès « Arbuste », des oiseaux dès « Arbre fruitier », un écureuil
 * dès « Verger ». Tapoter la plante la secoue — et fait fuir les visiteurs,
 * qui reviennent d'eux-mêmes quelques secondes plus tard.
 *
 * Tout est déterministe : mêmes positions et mêmes trajectoires à chaque
 * rendu, seul le moment du tapotement appartient à la personne.
 */

const LADYBUG_STAGE = 1
const BUTTERFLY_STAGE = 3
const FIREFLIES_STAGE = 4
const BIRDS_STAGE = 6
const SQUIRREL_STAGE = 7

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

function Ladybug() {
  return (
    <svg viewBox="0 0 14 12" width="14" height="12" aria-hidden>
      <circle cx="7" cy="7" r="4.6" fill="var(--c-berry)" />
      <rect x="6.6" y="2.6" width="0.8" height="8.8" rx="0.4" fill="var(--c-text)" opacity="0.55" />
      <circle cx="7" cy="3" r="1.8" fill="var(--c-text)" opacity="0.75" />
      <circle cx="4.9" cy="6" r="0.8" fill="var(--c-text)" opacity="0.6" />
      <circle cx="9.1" cy="6.4" r="0.8" fill="var(--c-text)" opacity="0.6" />
      <circle cx="5.4" cy="8.6" r="0.8" fill="var(--c-text)" opacity="0.6" />
    </svg>
  )
}

function Squirrel() {
  return (
    <svg viewBox="0 0 30 26" width="30" height="26" aria-hidden>
      <path d="M6 22 C 0 20, 0 8, 8 7 C 5 12, 6 17, 11 19 Z" fill="var(--c-brand)" opacity="0.85" />
      <ellipse cx="16" cy="18" rx="7" ry="6" fill="var(--c-brand)" />
      <circle cx="22" cy="12" r="4.4" fill="var(--c-brand)" />
      <path d="M20.5 8.5 L 21.5 5.5 L 23.5 8 Z" fill="var(--c-brand)" />
      <circle cx="23.4" cy="11.4" r="0.9" fill="var(--c-bg)" />
      <ellipse cx="16" cy="20.5" rx="4" ry="2.4" fill="var(--c-bg)" opacity="0.35" />
    </svg>
  )
}

/** Dérives lentes des lucioles, une par point lumineux. */
const FIREFLIES = [
  { at: { left: '18%', top: '18%' }, dx: 18, dy: -12, delay: 0 },
  { at: { right: '12%', top: '26%' }, dx: -22, dy: 10, delay: 0.9 },
  { at: { left: '30%', top: '42%' }, dx: 14, dy: -18, delay: 1.7 },
  { at: { right: '26%', top: '10%' }, dx: -12, dy: 14, delay: 2.4 },
]

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

  // Les lucioles ne sortent que la nuit : thème sombre choisi, ou préférence
  // système sombre quand le thème suit le système.
  const theme = useApp((s) => s.theme)
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  )
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])
  const night = theme === 'dark' || (theme === 'system' && systemDark)

  const hasLadybug = stageIndex >= LADYBUG_STAGE
  const hasButterfly = stageIndex >= BUTTERFLY_STAGE
  const hasFireflies = night && stageIndex >= FIREFLIES_STAGE
  const hasBirds = stageIndex >= BIRDS_STAGE
  const hasSquirrel = stageIndex >= SQUIRREL_STAGE

  const tapoter = () => {
    setShake((s) => s + 1)
    setFleeing(true)
    window.clearTimeout(retour.current)
    retour.current = window.setTimeout(() => setFleeing(false), 4200)
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

        {hasLadybug && (
          <motion.span
            className="pointer-events-none absolute bottom-[10%] left-[38%]"
            animate={
              fleeing
                ? { y: 26, opacity: 0, transition: { duration: 0.35, ease: 'easeIn' } }
                : {
                    y: 0,
                    opacity: 1,
                    x: [0, 14, 6, 16, 0],
                    transition: {
                      opacity: { duration: 0.5, delay: 0.9 },
                      x: { duration: 11, repeat: Infinity, ease: 'easeInOut' },
                    },
                  }
            }
          >
            <Ladybug />
          </motion.span>
        )}

        {hasSquirrel && (
          <motion.span
            className="pointer-events-none absolute bottom-[6%] right-[8%]"
            animate={
              fleeing
                ? { x: 150, y: [0, -14, 0, -10, 0], opacity: 0, transition: { duration: 0.55, ease: 'easeIn' } }
                : {
                    x: 0,
                    opacity: 1,
                    rotate: [0, 0, -4, 0],
                    transition: {
                      opacity: { duration: 0.6, delay: 1.2 },
                      rotate: { duration: 3.4, repeat: Infinity, ease: 'easeInOut' },
                    },
                  }
            }
          >
            <Squirrel />
          </motion.span>
        )}

        {hasFireflies &&
          FIREFLIES.map((fly, index) => (
            <motion.span
              key={index}
              className="pointer-events-none absolute size-1.5 rounded-full"
              style={{
                ...fly.at,
                background: 'var(--c-amber)',
                boxShadow: '0 0 8px 2px var(--c-amber)',
              }}
              animate={
                fleeing
                  ? { opacity: 0, transition: { duration: 0.3 } }
                  : {
                      x: [0, fly.dx, 0],
                      y: [0, fly.dy, 0],
                      opacity: [0.15, 0.9, 0.15],
                      transition: {
                        duration: 4.6,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: fly.delay,
                      },
                    }
              }
            />
          ))}

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
