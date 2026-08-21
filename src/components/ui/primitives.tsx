import clsx from 'clsx'
import { useEffect, useRef, useState, type ReactNode, type ButtonHTMLAttributes } from 'react'
import { motion, useReducedMotion, useSpring } from 'framer-motion'
import { Icon } from '../Icon'
import type { Tone } from '../../domain/types'
import { TONE, TONE_VAR } from './tone'

/** Halos colorés en fond de page. Purement décoratif. */
export function Ambient() {
  return (
    <div className="ambient" aria-hidden>
      <span />
      <span />
      <span />
    </div>
  )
}

/**
 * Carte de contenu.
 *
 * Elle se révèle à l'entrée dans le champ de vision : c'est ce qui donne à
 * l'ensemble des écrans leur rythme, sans avoir à animer chaque écran à la main.
 */
export function Card({
  children,
  className,
  hover = true,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  hover?: boolean
  delay?: number
}) {
  return (
    <motion.section
      className={clsx('card relative overflow-hidden', hover && 'card-hover', className)}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.section>
  )
}

export function CardHeader({
  title,
  hint,
  icon,
  tone = 'mint',
  action,
}: {
  title: string
  hint?: string
  icon?: string
  tone?: Tone
  action?: ReactNode
}) {
  return (
    <header className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <motion.span
            className={clsx('grid size-9 shrink-0 place-items-center rounded-xl', TONE[tone].bg, TONE[tone].deep)}
            whileHover={{ rotate: -8, scale: 1.08 }}
            transition={{ type: 'spring', stiffness: 400, damping: 14 }}
          >
            <Icon name={icon} size={18} />
          </motion.span>
        )}
        <div className="min-w-0">
          <h2 className="text-[1.08rem] leading-tight text-ink">{title}</h2>
          {hint && <p className="mt-0.5 text-[0.8rem] leading-snug text-ink-muted">{hint}</p>}
        </div>
      </div>
      {action}
    </header>
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'outline' | 'soft' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: string
  iconRight?: string
  full?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  full,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ y: -1.5 }}
      whileTap={{ scale: 0.96, y: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 26 }}
      {...(rest as object)}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors',
        'disabled:pointer-events-none disabled:opacity-45',
        size === 'sm' && 'px-3.5 py-1.5 text-[0.8rem]',
        size === 'md' && 'px-5 py-2.5 text-[0.875rem]',
        size === 'lg' && 'px-7 py-3.5 text-[0.95rem]',
        full && 'w-full',
        variant === 'primary' && 'brand-gradient sheen text-on-accent shadow-soft',
        variant === 'soft' && 'bg-brand-soft text-brand-deep hover:bg-brand/20',
        variant === 'outline' && 'border border-line-strong text-ink hover:bg-surface-2',
        variant === 'ghost' && 'text-ink-soft hover:bg-surface-2 hover:text-ink',
        variant === 'danger' && 'bg-berry text-on-accent hover:opacity-90',
        className,
      )}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 14 : 16} />}
    </motion.button>
  )
}

export function Chip({
  children,
  tone = 'mint',
  icon,
  className,
}: {
  children: ReactNode
  tone?: Tone
  icon?: string
  className?: string
}) {
  return (
    <span className={clsx('chip', TONE[tone].bg, TONE[tone].deep, className)}>
      {icon && <Icon name={icon} size={13} />}
      {children}
    </span>
  )
}

/** Barre de progression. `value` est un ratio entre 0 et 1. */
export function Progress({
  value,
  tone = 'mint',
  height = 8,
  label,
  animate = true,
  glow = false,
}: {
  value: number
  tone?: Tone
  height?: number
  label?: string
  animate?: boolean
  glow?: boolean
}) {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
  return (
    <div
      className="w-full overflow-hidden rounded-full bg-surface-3"
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(clamped * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <motion.div
        className={clsx('relative h-full rounded-full', TONE[tone].solid)}
        initial={animate ? { width: 0 } : false}
        whileInView={{ width: `${clamped * 100}%` }}
        viewport={{ once: true }}
        // Interpolation amortie, jamais un ressort : un ressort dépasse la
        // cible puis redescend, et une jauge qui recule ment sur sa valeur.
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      >
        {glow && <span className="shimmer absolute inset-0 rounded-full" />}
      </motion.div>
    </div>
  )
}

/** Jauge circulaire, utilisée pour le score de santé budgétaire. */
export function Dial({
  value,
  size = 132,
  tone = 'mint',
  children,
}: {
  value: number
  size?: number
  tone?: Tone
  children?: ReactNode
}) {
  const clamped = Math.max(0, Math.min(1, value))
  const stroke = 10
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--c-surface-3)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={TONE_VAR[tone]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: circumference * (1 - clamped) }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}

export function Stat({
  label,
  value,
  hint,
  tone = 'mint',
  icon,
  emphasis = false,
}: {
  label: string
  value: string
  hint?: string
  tone?: Tone
  icon?: string
  emphasis?: boolean
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 340, damping: 22 }}
      className={clsx(
        'rounded-2xl border p-4',
        emphasis ? clsx(TONE[tone].bg, TONE[tone].border) : 'border-line bg-surface-2',
      )}
    >
      <div className="flex items-center gap-2">
        {icon && <Icon name={icon} size={14} className={TONE[tone].text} />}
        <span className="eyebrow">{label}</span>
      </div>
      <p className={clsx('tabular mt-1.5 font-display text-2xl leading-none', emphasis ? TONE[tone].deep : 'text-ink')}>
        {value}
      </p>
      {hint && <p className="mt-1.5 text-[0.75rem] leading-snug text-ink-muted">{hint}</p>}
    </motion.div>
  )
}

/**
 * Nombre qui défile jusqu'à sa valeur.
 *
 * Le formatage passe par une référence : il change à chaque rendu, et
 * l'inscrire en dépendance relancerait l'abonnement en boucle.
 */
export function AnimatedNumber({
  value,
  format,
  className,
}: {
  value: number
  format: (value: number) => string
  className?: string
}) {
  const reduced = useReducedMotion()
  const formatRef = useRef(format)
  useEffect(() => {
    formatRef.current = format
  })

  const spring = useSpring(reduced ? value : 0, { stiffness: 55, damping: 20 })
  const [display, setDisplay] = useState(() => format(reduced ? value : 0))

  useEffect(() => {
    spring.set(value)
  }, [value, spring])

  useEffect(() => spring.on('change', (current) => setDisplay(formatRef.current(current))), [spring])

  return <span className={className}>{display}</span>
}

/** Révèle son contenu à l'entrée dans le champ de vision. */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

export function EmptyState({ icon, title, hint, action }: { icon: string; title: string; hint: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      <span className="animate-float grid size-12 place-items-center rounded-2xl bg-surface-2 text-ink-muted">
        <Icon name={icon} size={22} />
      </span>
      <p className="font-display text-lg text-ink">{title}</p>
      <p className="max-w-sm text-sm text-ink-muted">{hint}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
