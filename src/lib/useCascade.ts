import { useLayoutEffect, useRef } from 'react'
import { cascade } from './wow'

/**
 * Fait apparaître les enfants d'un conteneur en cascade, à son montage et à
 * chaque changement de dépendance — un changement d'onglet, typiquement.
 *
 * `useLayoutEffect` : la cascade pose l'état initial avant la première
 * peinture, sinon les éléments clignoteraient une image à pleine opacité.
 */
export function useCascade<T extends HTMLElement>(
  selector: string,
  deps: readonly unknown[] = [],
  options?: { fromY?: number; step?: number },
) {
  const ref = useRef<T>(null)
  useLayoutEffect(() => {
    if (ref.current) cascade(ref.current, selector, options)
    // Les dépendances sont volontairement celles de l'appelant : la cascade
    // rejoue quand le contenu listé change, pas quand les options changent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return ref
}
