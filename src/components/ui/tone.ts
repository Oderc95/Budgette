import type { Tone } from '../../domain/types'

/**
 * Classes utilitaires par teinte sémantique.
 *
 * `text` sert au texte posé sur le fond de page, `deep` au texte posé sur un
 * aplat teinté (`bg`), et `solid` aux remplissages pleins, sur lesquels le
 * texte passe en `text-on-accent`.
 *
 * Isolées dans leur propre module : un fichier qui exporte à la fois des
 * composants et des constantes casse le rafraîchissement à chaud.
 */
export interface ToneClasses {
  text: string
  deep: string
  bg: string
  border: string
  solid: string
  ring: string
  glow: string
}

export const TONE: Record<Tone, ToneClasses> = {
  brand: {
    text: 'text-brand', deep: 'text-brand-deep', bg: 'bg-brand-soft', border: 'border-brand/30',
    solid: 'bg-brand', ring: 'ring-brand/40', glow: 'shadow-[0_10px_30px_-12px_var(--c-brand)]',
  },
  mint: {
    text: 'text-mint', deep: 'text-mint-deep', bg: 'bg-mint-soft', border: 'border-mint/30',
    solid: 'bg-mint', ring: 'ring-mint/40', glow: 'shadow-[0_10px_30px_-12px_var(--c-mint)]',
  },
  indigo: {
    text: 'text-indigo', deep: 'text-indigo-deep', bg: 'bg-indigo-soft', border: 'border-indigo/30',
    solid: 'bg-indigo', ring: 'ring-indigo/40', glow: 'shadow-[0_10px_30px_-12px_var(--c-indigo)]',
  },
  berry: {
    text: 'text-berry', deep: 'text-berry-deep', bg: 'bg-berry-soft', border: 'border-berry/30',
    solid: 'bg-berry', ring: 'ring-berry/40', glow: 'shadow-[0_10px_30px_-12px_var(--c-berry)]',
  },
  amber: {
    text: 'text-amber', deep: 'text-amber-deep', bg: 'bg-amber-soft', border: 'border-amber/30',
    solid: 'bg-amber', ring: 'ring-amber/40', glow: 'shadow-[0_10px_30px_-12px_var(--c-amber)]',
  },
  orchid: {
    text: 'text-orchid', deep: 'text-orchid-deep', bg: 'bg-orchid-soft', border: 'border-orchid/30',
    solid: 'bg-orchid', ring: 'ring-orchid/40', glow: 'shadow-[0_10px_30px_-12px_var(--c-orchid)]',
  },
}

/** Variable CSS brute d'une teinte, pour les graphiques et les dégradés. */
export const TONE_VAR: Record<Tone, string> = {
  brand: 'var(--c-brand)',
  mint: 'var(--c-mint)',
  indigo: 'var(--c-indigo)',
  berry: 'var(--c-berry)',
  amber: 'var(--c-amber)',
  orchid: 'var(--c-orchid)',
}
