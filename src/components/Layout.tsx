import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { useEffect } from 'react'
import { useApp } from '../store/useApp'
import { Icon } from './Icon'
import { Toaster } from './Toaster'
import { levelFromXp, stageForLevel, GROWTH_STAGES, seasonForMonth } from '../domain/gamification'
import { Ambient, Progress } from './ui/primitives'
import { Mascot } from './Mascot'
import { monthKey } from '../lib/format'

const NAV = [
  { to: '/', label: 'Accueil', icon: 'LayoutDashboard', end: true },
  { to: '/mois', label: 'Mon mois', icon: 'PenLine' },
  { to: '/quetes', label: 'Quêtes', icon: 'ListChecks' },
  { to: '/objectifs', label: 'Objectifs', icon: 'Target' },
  { to: '/jardin', label: 'Jardin', icon: 'Sprout' },
]

/** Applique le choix de thème sur l'élément racine. */
function useThemeAttribute() {
  const theme = useApp((s) => s.theme)
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
  }, [theme])
}

function LevelSummary({ compact = false }: { compact?: boolean }) {
  const xp = useApp((s) => s.profile.xp)
  const level = levelFromXp(xp)
  const stage = stageForLevel(level.level)
  const stageIndex = GROWTH_STAGES.findIndex((s) => s.id === stage.id)

  return (
    <div className={clsx('rounded-2xl border border-line bg-surface-2 p-3', compact && 'flex items-center gap-3')}>
      <div className={clsx('flex items-center gap-3', !compact && 'mb-2')}>
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface">
          <Mascot stageIndex={stageIndex} size={38} animate={false} />
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-[0.95rem] leading-tight text-ink">
            Niveau {level.level} · {stage.label}
          </p>
          <p className="tabular text-[0.72rem] text-ink-muted">
            {level.xpInLevel} / {level.xpForLevel} XP
          </p>
        </div>
      </div>
      {!compact && <Progress value={level.progress} tone="amber" height={6} label="Progression du niveau" />}
    </div>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <motion.span
        className="grid size-9 place-items-center rounded-xl brand-gradient text-on-accent shadow-soft"
        whileHover={{ rotate: -10, scale: 1.1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 12 }}
      >
        <Icon name="Sprout" size={19} />
      </motion.span>
      <span className="leading-none">
        <span className="block font-display text-[1.25rem] font-semibold tracking-tight text-ink">Budgette</span>
        <span className="block font-hand text-[0.9rem] text-ink-muted">votre budget, en douceur</span>
      </span>
    </div>
  )
}

export function Layout() {
  useThemeAttribute()
  const location = useLocation()
  const role = useApp((s) => s.profile.role)
  const name = useApp((s) => s.profile.displayName)
  const streak = useApp((s) => s.profile.streak.current)
  const season = seasonForMonth(monthKey(new Date()))

  const nav = role === 'admin' ? [...NAV, { to: '/admin', label: 'Admin', icon: 'Shield' }] : NAV

  return (
    <>
      <Ambient />
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[1400px]">
      {/* Navigation latérale — écrans larges */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-5 border-r border-line px-5 py-6 lg:flex">
        <Brand />

        <nav className="flex flex-col gap-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                clsx(
                  'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.9rem] font-medium transition',
                  isActive ? 'text-brand-deep' : 'text-ink-soft hover:bg-surface-2 hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 -z-10 rounded-xl bg-brand-soft"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <Icon name={item.icon} size={18} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-3">
          <div className="flex items-center gap-2 rounded-2xl border border-line bg-surface-2 px-3 py-2.5">
            <Icon name={season.theme.icon} size={16} className="text-mint" />
            <span className="min-w-0">
              <span className="block text-[0.78rem] font-semibold leading-tight text-ink">{season.label}</span>
              <span className="block truncate text-[0.7rem] text-ink-muted">{season.theme.blurb}</span>
            </span>
          </div>
          <LevelSummary />
          <NavLink
            to="/profil"
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-2xl border border-line px-3 py-2.5 transition hover:bg-surface-2',
                isActive && 'bg-surface-2',
              )
            }
          >
            <span className="grid size-8 place-items-center rounded-full bg-brand text-[0.8rem] font-bold text-on-accent">
              {name.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[0.85rem] font-semibold leading-tight text-ink">{name}</span>
              <span className="flex items-center gap-1 text-[0.72rem] text-ink-muted">
                <Icon name="Flame" size={11} className="text-berry" />
                {streak} jours de série
              </span>
            </span>
          </NavLink>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barre supérieure — écrans étroits */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-bg/85 px-4 py-3 backdrop-blur lg:hidden">
          <Brand />
          <div className="flex items-center gap-2">
            <span className="chip bg-berry-soft text-berry-deep">
              <motion.span
                animate={{ scale: [1, 1.18, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Icon name="Flame" size={13} />
              </motion.span>
              {streak}
            </span>
            <NavLink
              to="/profil"
              className="grid size-9 place-items-center rounded-full bg-brand text-[0.85rem] font-bold text-on-accent"
              aria-label="Profil"
            >
              {name.slice(0, 1).toUpperCase()}
            </NavLink>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </main>

        {/* Navigation basse — écrans étroits */}
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-lg items-stretch justify-between px-2 py-1.5">
            {nav.slice(0, 5).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  clsx(
                    'flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[0.68rem] font-semibold transition',
                    isActive ? 'text-brand-deep' : 'text-ink-muted',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={clsx('grid size-8 place-items-center rounded-lg', isActive && 'bg-brand-soft')}>
                      <Icon name={item.icon} size={17} />
                    </span>
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>

      <Toaster />
      </div>
    </>
  )
}
