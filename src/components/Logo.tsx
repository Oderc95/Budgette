import { useId } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

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

      {/*
        Une pousse, sans socle. Une version précédente posait la tige sur un
        anneau : un cercle sous une tige verticale se lit comme le symbole ♀,
        et c'est cette lecture qui s'impose avant celle de la pièce.
      */}
      <path
        d="M24 38 C 23.4 30, 23.7 23, 24 16.5"
        fill="none"
        stroke="var(--c-on-accent)"
        strokeWidth="3.1"
        strokeLinecap="round"
      />
      <path
        d="M22.9 26 C 16.2 26.2, 11.7 22.2, 11.5 15.5 C 18.2 15.7, 22.6 19.4, 22.9 26 Z"
        fill="var(--c-on-accent)"
      />
      <path
        d="M25.1 20.6 C 31.8 20.8, 36.3 16.6, 36.5 10 C 29.8 10.2, 25.4 14, 25.1 20.6 Z"
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
