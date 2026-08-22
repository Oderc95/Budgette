import { useEffect, useRef } from 'react'
import { countTo } from '../lib/wow'

/**
 * Nombre qui se compte en montant vers sa valeur, avec un rebond à l'arrivée.
 * Pour les chiffres héros — ceux qu'on vient chercher en ouvrant l'écran.
 */
export function CountUp({
  value,
  format,
  className,
}: {
  value: number
  format: (v: number) => string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const formatRef = useRef(format)
  useEffect(() => {
    formatRef.current = format
  })

  useEffect(() => {
    if (!ref.current) return
    return countTo(ref.current, value, (v) => formatRef.current(v))
  }, [value])

  return (
    <span ref={ref} className={className}>
      {format(0)}
    </span>
  )
}
