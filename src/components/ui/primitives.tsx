import clsx from 'clsx'
import type { ReactNode, ButtonHTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '../Icon'
import type { Tone } from '../../domain/types'
import { TONE } from './tone'

export function Card({
  children,
  className,
  as = 'section',
}: {
  children: ReactNode
  className?: string
  as?: 'section' | 'div' | 'article'
}) {
  const Tag = as
  return <Tag className={clsx('card relative overflow-hidden', className)}>{children}</Tag>
}

export function CardHeader({
  title,
  hint,
  icon,
  tone = 'sage',
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
      <div className="flex items-start gap-3 min-w-0">
        {icon && (
          <span className={clsx('grid size-9 shrink-0 place-items-center rounded-xl', TONE[tone].bg, TONE[tone].text)}>
            <Icon name={icon} size={18} />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-[1.05rem] leading-tight text-ink">{title}</h2>
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
    <button
      {...rest}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition',
        'disabled:cursor-not-allowed disabled:opacity-45',
        size === 'sm' && 'px-3.5 py-1.5 text-[0.8rem]',
        size === 'md' && 'px-5 py-2.5 text-[0.875rem]',
        size === 'lg' && 'px-7 py-3.5 text-[0.95rem]',
        full && 'w-full',
        variant === 'primary' && 'bg-sage-deep text-[#fffcf7] hover:bg-sage active:scale-[0.98] shadow-soft',
        variant === 'soft' && 'bg-sage-soft text-sage-deep hover:bg-sage/25',
        variant === 'outline' && 'border border-line-strong text-ink hover:bg-surface-2',
        variant === 'ghost' && 'text-ink-soft hover:bg-surface-2 hover:text-ink',
        variant === 'danger' && 'bg-clay text-[#fffcf7] hover:opacity-90',
        className,
      )}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 14 : 16} />}
    </button>
  )
}

export function Chip({
  children,
  tone = 'sage',
  icon,
  className,
}: {
  children: ReactNode
  tone?: Tone
  icon?: string
  className?: string
}) {
  return (
    <span className={clsx('chip', TONE[tone].bg, TONE[tone].text, className)}>
      {icon && <Icon name={icon} size={13} />}
      {children}
    </span>
  )
}

/** Barre de progression. `value` est un ratio entre 0 et 1. */
export function Progress({
  value,
  tone = 'sage',
  height = 8,
  label,
  animate = true,
}: {
  value: number
  tone?: Tone
  height?: number
  label?: string
  animate?: boolean
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
        className={clsx('h-full rounded-full', TONE[tone].solid)}
        initial={animate ? { width: 0 } : false}
        animate={{ width: `${clamped * 100}%` }}
        transition={{ type: 'spring', stiffness: 90, damping: 18 }}
      />
    </div>
  )
}

/** Jauge circulaire, utilisée pour le score de santé budgétaire. */
export function Dial({
  value,
  size = 132,
  tone = 'sage',
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
  const strokeColor = {
    sage: 'var(--c-sage)',
    sky: 'var(--c-sky)',
    clay: 'var(--c-clay)',
    gold: 'var(--c-gold)',
    plum: 'var(--c-plum)',
  }[tone]

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--c-surface-3)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - clamped) }}
          transition={{ type: 'spring', stiffness: 60, damping: 16 }}
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
  tone = 'sage',
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
    <div
      className={clsx(
        'rounded-2xl border p-4',
        emphasis ? clsx(TONE[tone].bg, TONE[tone].border) : 'border-line bg-surface-2',
      )}
    >
      <div className="flex items-center gap-2">
        {icon && <Icon name={icon} size={14} className={TONE[tone].text} />}
        <span className="eyebrow">{label}</span>
      </div>
      <p className={clsx('tabular mt-1.5 font-display text-2xl leading-none', emphasis ? TONE[tone].text : 'text-ink')}>
        {value}
      </p>
      {hint && <p className="mt-1.5 text-[0.75rem] leading-snug text-ink-muted">{hint}</p>}
    </div>
  )
}

export function EmptyState({ icon, title, hint, action }: { icon: string; title: string; hint: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-surface-2 text-ink-muted">
        <Icon name={icon} size={22} />
      </span>
      <p className="font-display text-lg text-ink">{title}</p>
      <p className="max-w-sm text-sm text-ink-muted">{hint}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
