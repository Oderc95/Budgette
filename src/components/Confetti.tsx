import { motion } from 'framer-motion'

const COLORS = ['var(--c-mint)', 'var(--c-amber)', 'var(--c-berry)', 'var(--c-indigo)', 'var(--c-orchid)']

/**
 * Pluie de confettis, purement décorative.
 * Les positions sont dérivées de l'indice, sans aléatoire, pour rester stable
 * entre deux rendus.
 */
export function Confetti({ count = 36 }: { count?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: count }).map((_, index) => {
        const left = ((index * 37) % 100) + ((index % 3) - 1) * 1.5
        const delay = (index % 9) * 0.08
        const duration = 1.6 + ((index * 13) % 10) / 10
        const size = 5 + (index % 4) * 2
        return (
          <motion.span
            key={index}
            className="absolute top-0 block rounded-[2px]"
            style={{ left: `${left}%`, width: size, height: size * 1.6, background: COLORS[index % COLORS.length] }}
            initial={{ y: -20, opacity: 0, rotate: 0 }}
            animate={{ y: '110%', opacity: [0, 1, 1, 0], rotate: index % 2 ? 320 : -280 }}
            transition={{ duration, delay, ease: 'easeIn' }}
          />
        )
      })}
    </div>
  )
}
