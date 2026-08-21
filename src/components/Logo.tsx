import { useId } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

/**
 * Marque de Budgette : une pousse qui sort d'une pièce.
 *
 * Le disque évoque l'argent mis de côté, la pousse ce qu'il devient. C'est la
 * même image que la mascotte du jardin, réduite à une silhouette qui tient
 * encore à la taille d'une favicon.
 *
 * Les dégradés sont identifiés par `useId` : la marque est rendue plusieurs
 * fois sur une même page — barre latérale et en-tête mobile coexistent aux
 * changements de largeur — et des identifiants dupliqués feraient pointer
 * toutes les instances vers la première définition rencontrée.
 *
 * Le même dessin existe en dur dans `public/favicon.svg`, avec les couleurs du
 * thème clair écrites en toutes lettres : une favicon est chargée hors du
 * document et n'a accès à aucune variable de thème. Les deux fichiers doivent
 * donc être modifiés ensemble.
 */
export function LogoMark({ size = 44, className }: { size?: number; className?: string }) {
  // Les identifiants produits par React contiennent des caractères que les
  // références `url(#…)` ne digèrent pas partout : on ne garde que l'alphabet.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const fill = `marque-fond-${uid}`
  const shine = `marque-reflet-${uid}`

  return (
    <svg
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

      {/* La pièce, en retrait : elle porte la pousse sans lui disputer l'œil. */}
      <circle
        cx="24"
        cy="32.6"
        r="6.4"
        fill="none"
        stroke="var(--c-on-accent)"
        strokeWidth="2.4"
        opacity="0.55"
      />
      <path
        d="M24 26.4 C 23.5 22, 23.7 19, 24 15.4"
        fill="none"
        stroke="var(--c-on-accent)"
        strokeWidth="2.9"
        strokeLinecap="round"
      />
      <path
        d="M23.2 22.4 C 17.6 22.6, 13.8 19.2, 13.6 13.6 C 19.2 13.8, 22.9 17.2, 23.2 22.4 Z"
        fill="var(--c-on-accent)"
      />
      <path
        d="M24.8 18 C 30.4 18.2, 34.2 14.8, 34.4 9.2 C 28.8 9.4, 25.1 12.8, 24.8 18 Z"
        fill="var(--c-on-accent)"
        opacity="0.86"
      />
    </svg>
  )
}

/** Tailles retenues : la marque grandit avec la place dont elle dispose. */
const TAILLES = {
  sm: { mark: 40, title: 'text-[1.35rem]', tagline: 'text-[0.92rem]', gap: 'gap-2.5' },
  md: { mark: 52, title: 'text-[1.7rem]', tagline: 'text-[1.02rem]', gap: 'gap-3' },
  lg: { mark: 68, title: 'text-[2.4rem]', tagline: 'text-[1.3rem]', gap: 'gap-4' },
} as const

/**
 * Marque complète : le symbole et le nom.
 *
 * `tagline` permet de retirer la signature là où la largeur manque, sans
 * changer la taille du symbole.
 */
export function Logo({
  size = 'md',
  tagline = true,
  className,
}: {
  size?: keyof typeof TAILLES
  tagline?: boolean
  className?: string
}) {
  const t = TAILLES[size]

  return (
    <div className={clsx('flex min-w-0 items-center', t.gap, className)}>
      <motion.span
        className="shrink-0 rounded-[0.9em] shadow-soft"
        whileHover={{ rotate: -8, scale: 1.06 }}
        transition={{ type: 'spring', stiffness: 400, damping: 14 }}
      >
        <LogoMark size={t.mark} className="block" />
      </motion.span>
      <span className="min-w-0 leading-none">
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

/** Tailles de l'enseigne. Le symbole et le nom grandissent ensemble. */
const ENSEIGNE = {
  md: { mark: 60, title: 'text-[2.4rem]', tagline: 'text-[1.15rem]', gap: 'gap-3.5' },
  lg: { mark: 84, title: 'text-[3.4rem]', tagline: 'text-[1.45rem]', gap: 'gap-5' },
} as const

/**
 * Enseigne : la version large de la marque, pour les écrans où elle accueille
 * plutôt qu'elle ne signale.
 *
 * Le nom reprend le dégradé du symbole, découpé dans le texte : c'est ce qui
 * lie les deux au lieu de les juxtaposer. La couleur de repli est posée avant
 * le découpage, pour que le nom reste lisible là où `background-clip: text`
 * n'est pas appliqué.
 *
 * La devise est alignée sur le nom et soulignée d'un trait dégradé qui reprend
 * la largeur du texte, pour fermer le bloc.
 */
export function LogoLockup({
  size = 'lg',
  className,
}: {
  size?: keyof typeof ENSEIGNE
  className?: string
}) {
  const t = ENSEIGNE[size]

  return (
    <div className={clsx('flex min-w-0 items-center', t.gap, className)}>
      <motion.span
        className="shrink-0 rounded-[0.9em] shadow-lift"
        initial={{ scale: 0.85, opacity: 0, rotate: -8 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 16 }}
      >
        <LogoMark size={t.mark} className="block" />
      </motion.span>

      <span className="min-w-0">
        {/* Le bloc se rétracte sur le nom : le trait en reprend exactement la
            largeur, quelle que soit la police effectivement chargée. */}
        <span className="block w-fit">
          <span
            className={clsx(
              'brand-gradient block bg-clip-text font-display font-semibold leading-[0.95] tracking-tight text-brand',
              '[-webkit-text-fill-color:transparent]',
              t.title,
            )}
          >
            Budgette
          </span>
          <span className="brand-gradient mt-2 block h-[3px] w-full rounded-full opacity-70" />
        </span>
        <span className={clsx('mt-2 block font-hand text-ink-soft', t.tagline)}>
          Faites pousser votre budget
        </span>
      </span>
    </div>
  )
}
