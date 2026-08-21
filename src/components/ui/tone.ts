import type { Tone } from '../../domain/types'

/**
 * Classes utilitaires par teinte sémantique.
 *
 * Isolées dans leur propre module : un fichier qui exporte à la fois des
 * composants et des constantes casse le rafraîchissement à chaud.
 */
export const TONE: Record<Tone, { text: string; bg: string; border: string; solid: string; ring: string }> = {
  sage: { text: 'text-sage-deep', bg: 'bg-sage-soft', border: 'border-sage/30', solid: 'bg-sage', ring: 'ring-sage/40' },
  sky: { text: 'text-sky', bg: 'bg-sky-soft', border: 'border-sky/30', solid: 'bg-sky', ring: 'ring-sky/40' },
  clay: { text: 'text-clay', bg: 'bg-clay-soft', border: 'border-clay/30', solid: 'bg-clay', ring: 'ring-clay/40' },
  gold: { text: 'text-gold', bg: 'bg-gold-soft', border: 'border-gold/30', solid: 'bg-gold', ring: 'ring-gold/40' },
  plum: { text: 'text-plum', bg: 'bg-plum-soft', border: 'border-plum/30', solid: 'bg-plum', ring: 'ring-plum/40' },
}
