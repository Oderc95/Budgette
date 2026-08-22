import { animate, eases, stagger } from 'animejs'
import { TONE_VAR } from '../components/ui/tone'
import type { Tone } from '../domain/types'

/**
 * La couche « wow » : les effets impératifs de l'application, sur anime.js.
 *
 * Framer Motion reste le moteur des animations liées au cycle de vie React —
 * montage, démontage, gestes. anime.js prend tout ce qui est timeline pure :
 * explosions de particules, compteurs, cascades d'apparition, dessin de SVG.
 * Chaque effet respecte la préférence « réduire les animations ».
 */

export const motionOK = () =>
  typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Explosion de particules depuis le centre d'un élément.
 *
 * Les particules vivent dans un hôte `position: fixed` posé sur le document :
 * elles ne sont jamais rognées par l'overflow du composant qui célèbre, et
 * l'hôte s'auto-détruit à la fin. Angles et tailles dérivent de l'indice —
 * même explosion à chaque fois, seule l'occasion change.
 */
export function burst(origin: HTMLElement | null, tones: Tone[] = ['amber', 'mint', 'berry'], count = 16) {
  if (!origin || !motionOK()) return
  const rect = origin.getBoundingClientRect()
  const host = document.createElement('div')
  host.style.cssText = `position:fixed;left:${rect.left + rect.width / 2}px;top:${rect.top + rect.height / 2}px;width:0;height:0;pointer-events:none;z-index:90`
  host.setAttribute('aria-hidden', 'true')
  document.body.appendChild(host)

  const colors = tones.map((tone) => TONE_VAR[tone])
  const dots = Array.from({ length: count }, (_, i) => {
    const dot = document.createElement('span')
    const size = 5 + (i % 3) * 3
    dot.style.cssText = `position:absolute;left:${-size / 2}px;top:${-size / 2}px;width:${size}px;height:${size}px;border-radius:${i % 2 ? '50%' : '3px'};background:${colors[i % colors.length]}`
    host.appendChild(dot)
    return dot
  })

  dots.forEach((dot, i) => {
    const angle = (i / count) * Math.PI * 2 + 0.7
    animate(dot, {
      x: Math.cos(angle) * (38 + (i % 4) * 16),
      y: Math.sin(angle) * (30 + ((i * 5) % 4) * 14) - 14,
      rotate: i % 2 ? 260 : -220,
      scale: [1, 0],
      opacity: [1, 1, 0],
      duration: 750,
      delay: i * 8,
      ease: 'outExpo',
    })
  })
  // L'hôte disparaît après la dernière particule, marges comprises.
  window.setTimeout(() => host.remove(), 750 + count * 8 + 150)
}

/** Petit rebond élastique d'un élément déjà visible — la victoire discrète. */
export function pop(element: HTMLElement | null, amplitude = 1.14) {
  if (!element || !motionOK()) return
  animate(element, {
    scale: [1, amplitude, 1],
    duration: 550,
    ease: eases.outElastic(1.1, 0.5),
  })
}

/**
 * Compteur : fait monter le contenu textuel d'un élément vers sa valeur.
 * Retourne une fonction d'annulation pour le démontage.
 */
export function countTo(
  element: HTMLElement,
  value: number,
  format: (v: number) => string,
  duration = 1100,
): () => void {
  if (!motionOK()) {
    element.textContent = format(value)
    return () => {}
  }
  const state = { v: 0 }
  const animation = animate(state, {
    v: value,
    duration,
    ease: 'outExpo',
    onUpdate: () => {
      element.textContent = format(state.v)
    },
    onComplete: () => pop(element, 1.08),
  })
  return () => animation.cancel()
}

/**
 * Cascade d'apparition des enfants d'un conteneur : chacun monte en fondu,
 * décalé du précédent. L'appelant fournit le sélecteur des éléments.
 */
export function cascade(root: HTMLElement, selector: string, options?: { fromY?: number; step?: number }) {
  const items = root.querySelectorAll<HTMLElement>(selector)
  if (items.length === 0 || !motionOK()) return
  animate(items, {
    opacity: [0, 1],
    y: [options?.fromY ?? 16, 0],
    duration: 460,
    ease: 'outQuad',
    delay: stagger(options?.step ?? 45),
  })
}
