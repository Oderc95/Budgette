import { useEffect, useId, useRef } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { createTimeline, eases } from 'animejs'
import { motionOK } from '../lib/wow'

/*
 * La pousse est toujours crème, dans les deux thèmes. Elle était auparavant
 * dessinée avec `--c-on-accent`, qui bascule au sombre en thème sombre : la
 * pousse devenait aubergine sur tuile orange, alors que la favicon — la
 * référence — la dessine crème. Même valeur que `public/favicon.svg`, à
 * modifier ensemble.
 */
const CREME = '#fffaf5'

/**
 * Marque de Budgette : une pousse.
 *
 * C'est la même image que la mascotte du jardin, réduite à une silhouette qui
 * tient encore à la taille d'une favicon. Le dessin reste volontairement nu :
 * tout ce qu'on ajoute sous la tige finit par se lire comme un pictogramme
 * existant plutôt que comme un socle.
 *
 * Les dégradés sont identifiés par `useId` : la marque est rendue plusieurs
 * fois sur une même page — barre latérale et en-tête mobile coexistent aux
 * changements de largeur — et des identifiants dupliqués feraient pointer
 * toutes les instances vers la première définition rencontrée.
 */
export function LogoMark({
  size = 44,
  className,
  draw = false,
}: {
  size?: number
  className?: string
  /** La pousse se dessine : la tige se trace, puis chaque feuille éclot. */
  draw?: boolean
}) {
  // Les identifiants produits par React contiennent des caractères que les
  // références `url(#…)` ne digèrent pas partout : on ne garde que l'alphabet.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const fill = `marque-fond-${uid}`
  const shine = `marque-reflet-${uid}`
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const svg = svgRef.current
    if (!draw || !svg || !motionOK()) return

    const tige = svg.querySelector<SVGPathElement>('[data-part="tige"]')
    const feuilles = svg.querySelectorAll<SVGPathElement>('[data-part="feuille"]')
    if (!tige) return

    // `pathLength=1` normalise le tracé : le trait se dessine en animant le
    // décalage du pointillé de 1 vers 0, sans mesurer la géométrie réelle.
    const timeline = createTimeline()
    timeline
      .add(tige, { strokeDashoffset: [1, 0], duration: 650, ease: 'outQuart' }, 250)
      .add(
        feuilles,
        { scale: [0, 1], opacity: [0, 1], duration: 700, ease: eases.outElastic(1.1, 0.55) },
        '-=250',
      )
    return () => {
      timeline.cancel()
    }
  }, [draw])

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label="Budgette"
    >
      <defs>
        <linearGradient id={fill} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--c-brand)" />
          <stop offset="1" stopColor="var(--c-berry)" />
        </linearGradient>
        <linearGradient id={shine} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.24" />
          <stop offset="0.55" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="48" height="48" rx="13" fill={`url(#${fill})`} />
      <rect width="48" height="48" rx="13" fill={`url(#${shine})`} />

      <path
        data-part="tige"
        d="M24 38 C 23.4 30, 23.7 23, 24 16.5"
        fill="none"
        stroke={CREME}
        strokeWidth="3.1"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={draw ? 1 : undefined}
        strokeDashoffset={draw ? 1 : undefined}
      />
      <path
        data-part="feuille"
        d="M22.9 26 C 16.2 26.2, 11.7 22.2, 11.5 15.5 C 18.2 15.7, 22.6 19.4, 22.9 26 Z"
        fill={CREME}
        opacity={draw ? 0 : undefined}
        style={draw ? { transformBox: 'fill-box', transformOrigin: '100% 100%' } : undefined}
      />
      <path
        data-part="feuille"
        d="M25.1 20.6 C 31.8 20.8, 36.3 16.6, 36.5 10 C 29.8 10.2, 25.4 14, 25.1 20.6 Z"
        fill={CREME}
        opacity={draw ? 0 : 0.86}
        style={draw ? { transformBox: 'fill-box', transformOrigin: '0% 100%' } : undefined}
      />
    </svg>
  )
}

/** Tailles retenues : la marque grandit avec la place dont elle dispose. */
const TAILLES = {
  sm: { mark: 40, title: 'text-[1.35rem]', tagline: 'text-[0.92rem]', gap: 'gap-2.5' },
  md: { mark: 52, title: 'text-[1.7rem]', tagline: 'text-[1.02rem]', gap: 'gap-3' },
  lg: { mark: 68, title: 'text-[2.4rem]', tagline: 'text-[1.3rem]', gap: 'gap-4' },
  xl: { mark: 96, title: 'text-[2.7rem]', tagline: 'text-[1.35rem]', gap: 'gap-4' },
} as const

/**
 * Marque complète : le symbole et le nom, sans autre ornement.
 *
 * `layout="column"` centre le symbole au-dessus du nom, pour les écrans où la
 * marque accueille plutôt qu'elle ne signale — l'écran de connexion. `tagline`
 * permet de retirer la devise là où la largeur manque.
 */
export function Logo({
  size = 'md',
  layout = 'row',
  tagline = true,
  draw = false,
  className,
}: {
  size?: keyof typeof TAILLES
  layout?: 'row' | 'column'
  tagline?: boolean
  draw?: boolean
  className?: string
}) {
  const t = TAILLES[size]
  const colonne = layout === 'column'

  return (
    <div
      className={clsx(
        'flex min-w-0 items-center',
        colonne ? 'flex-col text-center' : t.gap,
        colonne && 'gap-4',
        className,
      )}
    >
      <motion.span
        className="shrink-0 rounded-[0.9em] shadow-soft"
        whileHover={{ rotate: -8, scale: 1.06 }}
        transition={{ type: 'spring', stiffness: 400, damping: 14 }}
      >
        <LogoMark size={t.mark} className="block" draw={draw} />
      </motion.span>
      <span className={clsx('min-w-0 leading-none', colonne && 'flex flex-col items-center')}>
        <span
          className={clsx(
            'block truncate font-display font-semibold tracking-tight text-ink',
            t.title,
          )}
        >
          Budgette
        </span>
        {tagline && (
          <span className={clsx('mt-1 block truncate font-hand text-ink-muted', t.tagline)}>
            Faites pousser votre budget
          </span>
        )}
      </span>
    </div>
  )
}
