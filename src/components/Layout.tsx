import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import { useApp } from '../store/useApp'
import { Icon } from './Icon'
import { Toaster } from './Toaster'
import { levelFromXp, stageForLevel, GROWTH_STAGES, seasonForMonth } from '../domain/gamification'
import { Ambient, Progress } from './ui/primitives'
import { Logo } from './Logo'
import { Mascot } from './Mascot'
import { useCascade } from '../lib/useCascade'
import { monthKey } from '../lib/format'
import { reglerBarresSysteme } from '../lib/native'
import { objectifManquant, sectionsOuvertes, type SectionId } from '../domain/progression'

/**
 * Ordre de lecture des écrans : il donne la direction des transitions. Aller
 * vers un écran plus à droite dans la barre fait glisser le contenu vers la
 * gauche, et inversement — le mouvement raconte la navigation.
 */
const ROUTE_ORDER = ['/', '/mois', '/objectifs', '/quetes', '/annee', '/jardin', '/profil', '/admin']

const ECRAN = {
  enter: (direction: number) => ({ opacity: 0, x: 44 * direction, scale: 0.985 }),
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.26, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: -38 * direction,
    scale: 0.985,
    transition: { duration: 0.15, ease: 'easeIn' as const },
  }),
}

/*
 * Destinations, dans l'ordre de lecture. Objectifs passe avant Quêtes : on se
 * donne un cap avant de recevoir des défis qui servent ce cap.
 *
 * Chaque entrée porte sa section : celles qui ne sont pas encore ouvertes
 * disparaissent de la barre. Un compte neuf n'affiche donc que l'accueil, la
 * saisie et les objectifs — le reste apparaît à mesure qu'il prend son sens.
 */
const NAV: { to: string; label: string; icon: string; end?: boolean; section: SectionId }[] = [
  { to: '/', label: 'Accueil', icon: 'LayoutDashboard', end: true, section: 'accueil' },
  { to: '/mois', label: 'Mon mois', icon: 'PenLine', section: 'mois' },
  { to: '/objectifs', label: 'Objectifs', icon: 'Target', section: 'objectifs' },
  { to: '/quetes', label: 'Quêtes', icon: 'ListChecks', section: 'quetes' },
  { to: '/jardin', label: 'Jardin', icon: 'Sprout', section: 'jardin' },
  { to: '/annee', label: 'Mon année', icon: 'CalendarRange', section: 'annee' },
]

/**
 * Pastille d'appel, empruntée aux jeux : un point d'exclamation qui bat sur
 * l'onglet où quelque chose attend. Elle ne s'affiche que sur Objectifs, et
 * seulement tant qu'aucun objectif n'existe.
 */
function Pastille({ className }: { className?: string }) {
  return (
    <motion.span
      className={clsx(
        'pointer-events-none grid size-4 place-items-center rounded-full bg-berry text-[0.6rem] font-bold text-on-accent',
        className,
      )}
      animate={{ scale: [1, 1.22, 1] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      aria-hidden
    >
      !
    </motion.span>
  )
}

/**
 * Applique le choix de thème sur l'élément racine, et accorde les barres
 * système de l'application native à ce même thème.
 */
function useThemeAttribute() {
  const theme = useApp((s) => s.theme)
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)

    // En mode « système », c'est la préférence du navigateur qui tranche ;
    // elle peut changer pendant que l'application tourne.
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const appliquer = () => {
      void reglerBarresSysteme(theme === 'dark' || (theme === 'system' && media.matches))
    }
    appliquer()
    media.addEventListener('change', appliquer)
    return () => media.removeEventListener('change', appliquer)
  }, [theme])
}

function LevelSummary({ compact = false }: { compact?: boolean }) {
  const xp = useApp((s) => s.profile.xp)
  const level = levelFromXp(xp)
  const stage = stageForLevel(level.level)
  const stageIndex = GROWTH_STAGES.findIndex((s) => s.id === stage.id)

  // Chaque gain d'XP fait pulser la barre et flotter le montant gagné :
  // l'effort tenu se voit à l'endroit même où la progression s'accumule.
  const [gain, setGain] = useState({ coup: 0, delta: 0 })
  const previousXp = useRef(xp)
  useEffect(() => {
    if (xp > previousXp.current) {
      const delta = xp - previousXp.current
      setGain((g) => ({ coup: g.coup + 1, delta }))
    }
    previousXp.current = xp
  }, [xp])

  return (
    <div className={clsx('rounded-2xl border border-line bg-surface-2 p-3', compact && 'flex items-center gap-3')}>
      <div className={clsx('flex items-center gap-3', !compact && 'mb-2')}>
        <motion.span
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface"
          whileHover={{ scale: 1.12, rotate: -6 }}
          transition={{ type: 'spring', stiffness: 340, damping: 14 }}
        >
          <Mascot stageIndex={stageIndex} size={38} animate={false} />
        </motion.span>
        <div className="min-w-0">
          <p className="truncate font-display text-[0.95rem] leading-tight text-ink">
            Niveau {level.level} · {stage.label}
          </p>
          <p className="tabular text-[0.72rem] text-ink-muted">
            {level.xpInLevel} / {level.xpForLevel} XP
          </p>
        </div>
      </div>
      {!compact && (
        <div className="relative">
          {gain.coup > 0 && (
            <motion.span
              key={gain.coup}
              className="tabular pointer-events-none absolute -top-5 right-0 text-[0.72rem] font-bold text-amber-deep"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: [0, 1, 1, 0], y: -12 }}
              transition={{ duration: 1.6, ease: 'easeOut' }}
            >
              +{gain.delta} XP
            </motion.span>
          )}
          <motion.div
            key={`pulse-${gain.coup}`}
            animate={
              gain.coup > 0
                ? {
                    scale: [1, 1.06, 1],
                    filter: [
                      'drop-shadow(0 0 0px var(--c-amber))',
                      'drop-shadow(0 0 7px var(--c-amber))',
                      'drop-shadow(0 0 0px var(--c-amber))',
                    ],
                  }
                : undefined
            }
            transition={{ duration: 0.9, ease: 'easeInOut' }}
          >
            <Progress value={level.progress} tone="amber" height={6} label="Progression du niveau" />
          </motion.div>
        </div>
      )}
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

  const budgets = useApp((s) => s.budgets)
  const goals = useApp((s) => s.goals)
  const pockets = useApp((s) => s.pockets)
  const profile = useApp((s) => s.profile)
  const activeMonth = useApp((s) => s.activeMonth)
  const ouvertes = sectionsOuvertes({ budgets, goals, profile, activeMonth })

  /*
   * Les quêtes se recalculent après chaque changement de données, où qu'il
   * ait eu lieu. Le faire ici plutôt que dans chaque action du magasin évite
   * d'oublier un chemin : toute modification finit par repasser par un rendu
   * de la mise en page.
   */
  const syncQuetes = useApp((s) => s.syncQuetes)
  useEffect(() => {
    syncQuetes()
  }, [budgets, goals, pockets, syncQuetes])
  const reclame = objectifManquant({ goals })

  const visibles = NAV.filter((item) => ouvertes.has(item.section))
  const nav = role === 'admin'
    ? [...visibles, { to: '/admin', label: 'Admin', icon: 'Shield', section: 'profil' as SectionId }]
    : visibles

  const navRef = useCascade<HTMLElement>(':scope > a', [], { fromY: 10, step: 40 })

  // Ajustement d'état pendant le rendu : à chaque changement d'écran, la
  // direction est dérivée de l'écran quitté, avant que la transition ne parte.
  const routeIndex = ROUTE_ORDER.indexOf(location.pathname)
  const [trace, setTrace] = useState({ index: routeIndex, direction: 0 })
  if (trace.index !== routeIndex) {
    setTrace({
      index: routeIndex,
      direction: routeIndex === -1 || trace.index === -1 ? 0 : Math.sign(routeIndex - trace.index),
    })
  }
  const direction = trace.direction

  // Le routeur par ancre ne remet pas le défilement à zéro : arriver sur un
  // écran en plein milieu de page désoriente, on repart toujours du haut.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <>
      <Ambient />
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[1400px]">
      {/* Navigation latérale — écrans larges */}
      {/* La marge intérieure tient les blocs à distance du trait de séparation. */}
      <aside className="pad-safe-x sticky top-0 hidden h-dvh w-[19.5rem] shrink-0 flex-col gap-5 border-r border-line bg-bg/80 px-6 py-6 backdrop-blur-xl lg:flex">
        <Logo size="md" />

        <nav ref={navRef} className="flex flex-col gap-1">
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
                  {item.to === '/objectifs' && reclame && <Pastille className="ml-auto" />}
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
        <header className="pad-safe-top pad-safe-x sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-bg/90 px-4 pb-3 backdrop-blur-xl lg:hidden">
          {/* La signature ne tient pas à côté des commandes sur un écran étroit. */}
          <Logo size="sm" tagline={false} />
          <div className="flex shrink-0 items-center gap-2">
            <span className="chip bg-berry-soft text-berry-deep">
              <motion.span
                animate={{ scale: [1, 1.18, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Icon name="Flame" size={13} />
              </motion.span>
              {streak}
            </span>
            {/*
              La barre d'onglets n'a de place que pour les cinq destinations du
              quotidien : la console d'administration passe par l'en-tête.
            */}
            {role === 'admin' && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  clsx(
                    'grid size-9 place-items-center rounded-full border border-line transition',
                    isActive ? 'bg-brand-soft text-brand-deep' : 'text-ink-soft',
                  )
                }
                aria-label="Console d'administration"
              >
                <Icon name="Shield" size={17} />
              </NavLink>
            )}
            <NavLink
              to="/profil"
              className="grid size-9 place-items-center rounded-full bg-brand text-[0.85rem] font-bold text-on-accent"
              aria-label="Profil"
            >
              {name.slice(0, 1).toUpperCase()}
            </NavLink>
          </div>
        </header>

        <main className="space-for-tabbar min-w-0 flex-1 px-4 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={location.pathname}
              custom={direction}
              variants={ECRAN}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Navigation basse — écrans étroits */}
        <nav className="pad-safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 backdrop-blur-xl lg:hidden">
          <div className="pad-safe-x mx-auto flex max-w-lg items-stretch justify-between px-2 py-1.5">
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
                    <span className={clsx('relative grid size-8 place-items-center rounded-lg', isActive && 'bg-brand-soft')}>
                      <Icon name={item.icon} size={17} />
                      {item.to === '/objectifs' && reclame && <Pastille className="absolute -right-1 -top-0.5" />}
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
