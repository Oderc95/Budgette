import { motion } from 'framer-motion'
import { GROWTH_STAGES } from '../domain/gamification'

/**
 * Mascotte évolutive.
 *
 * Un seul dessin paramétré par l'indice de palier : la plante gagne une tige,
 * des feuilles, une couronne, des fruits, puis un bosquet et une canopée.
 * Tout est déterministe (aucun aléatoire), pour que la mascotte d'un niveau
 * donné soit toujours identique d'une session à l'autre.
 */

const LEAF = 'var(--c-mint)'
const LEAF_DARK = 'var(--c-mint-deep)'
const POT = 'var(--c-brand)'
const FRUIT = 'var(--c-amber)'

function Leaf({ x, y, angle, scale = 1, dark = false }: { x: number; y: number; angle: number; scale?: number; dark?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}>
      <path
        d="M0 0 C 7 -6, 17 -6, 21 0 C 17 6, 7 6, 0 0 Z"
        fill={dark ? LEAF_DARK : LEAF}
        opacity={dark ? 0.95 : 0.85}
      />
      <path d="M2 0 L 19 0" stroke="var(--c-bg)" strokeWidth="0.8" opacity="0.55" strokeLinecap="round" />
    </g>
  )
}

export function Mascot({ stageIndex, size = 160, animate = true }: { stageIndex: number; size?: number; animate?: boolean }) {
  const i = Math.max(0, Math.min(GROWTH_STAGES.length - 1, stageIndex))

  const hasPot = i <= 4
  const stemHeight = [4, 12, 20, 28, 34, 42, 46, 48, 50, 52, 54, 56][i]
  const leafPairs = [0, 1, 2, 3, 4, 2, 2, 2, 2, 2, 2, 2][i]
  const canopy = i >= 5
  const canopyR = [0, 0, 0, 0, 0, 17, 20, 21, 23, 25, 27, 30][i]
  const fruits = i >= 6 ? [0, 0, 0, 0, 0, 0, 3, 4, 5, 6, 7, 8][i] : 0
  const companions = [0, 0, 0, 0, 0, 0, 0, 2, 3, 4, 5, 6][i]
  const birds = i >= 10
  const halo = i >= 11

  const baseY = 96
  const topY = baseY - stemHeight

  return (
    <motion.svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label={`Mascotte : ${GROWTH_STAGES[i].label}`}
      initial={animate ? { scale: 0.9, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 120, damping: 14 }}
    >
      {halo && (
        <motion.circle
          cx="60"
          cy="52"
          r={44}
          fill="var(--c-amber)"
          style={{ originX: '60px', originY: '52px' }}
          initial={{ opacity: 0.08, scale: 0.96 }}
          animate={animate ? { opacity: [0.08, 0.16, 0.08], scale: [0.96, 1.04, 0.96] } : { opacity: 0.12, scale: 1 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Sol : l'ombre porte au pied du pot, pas à mi-hauteur */}
      <ellipse cx="60" cy={hasPot ? 113 : 104} rx="42" ry="6" fill="var(--c-surface-3)" />

      {/* Arbres compagnons, en arrière-plan */}
      {Array.from({ length: companions }).map((_, k) => {
        const side = k % 2 === 0 ? -1 : 1
        const dist = 16 + Math.floor(k / 2) * 13
        const cx = 60 + side * dist
        const scale = 0.42 + ((k * 7) % 3) * 0.06
        return (
          <g key={`c-${k}`} transform={`translate(${cx} ${baseY + 6}) scale(${scale})`} opacity="0.55">
            <rect x="-2.5" y="-26" width="5" height="26" rx="2.5" fill={LEAF_DARK} opacity="0.7" />
            <circle cx="0" cy="-34" r="16" fill={LEAF} opacity="0.75" />
            <circle cx="-9" cy="-27" r="10" fill={LEAF} opacity="0.65" />
            <circle cx="9" cy="-27" r="10" fill={LEAF} opacity="0.65" />
          </g>
        )
      })}

      {/*
        La tige pousse derrière le pot : sa base disparaît sous le rebord et la
        terre, comme une plante sort réellement de son pot — devant, les
        feuilles basses chevauchaient le rebord.
      */}
      {/* Tige et couronne, animées d'un léger balancement */}
      <motion.g
        style={{ originX: '60px', originY: `${baseY}px` }}
        animate={animate ? { rotate: [-1.6, 1.6, -1.6] } : undefined}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        {i > 0 && (
          <path
            d={`M60 ${baseY} C 57 ${baseY - stemHeight * 0.4}, 63 ${baseY - stemHeight * 0.7}, 60 ${topY}`}
            stroke={LEAF_DARK}
            strokeWidth={i >= 5 ? 6 : 3}
            strokeLinecap="round"
            fill="none"
          />
        )}

        {Array.from({ length: leafPairs }).map((_, k) => {
          const y = baseY - 8 - k * (stemHeight / (leafPairs + 0.6))
          return (
            <g key={`l-${k}`}>
              <Leaf x={60} y={y} angle={-24 - k * 4} scale={0.85 - k * 0.06} />
              <g transform="translate(120 0) scale(-1 1)">
                <Leaf x={60} y={y + 4} angle={-20 - k * 4} scale={0.78 - k * 0.06} dark />
              </g>
            </g>
          )
        })}

        {canopy && (
          <g>
            <circle cx="60" cy={topY - canopyR * 0.35} r={canopyR} fill={LEAF} opacity="0.9" />
            <circle cx={60 - canopyR * 0.62} cy={topY + canopyR * 0.12} r={canopyR * 0.66} fill={LEAF} opacity="0.8" />
            <circle cx={60 + canopyR * 0.62} cy={topY + canopyR * 0.12} r={canopyR * 0.66} fill={LEAF_DARK} opacity="0.55" />
            <circle cx={60 - canopyR * 0.2} cy={topY - canopyR * 0.75} r={canopyR * 0.5} fill={LEAF} opacity="0.75" />
          </g>
        )}

        {Array.from({ length: fruits }).map((_, k) => {
          const angle = (k / Math.max(1, fruits)) * Math.PI * 2 + 0.6
          const r = canopyR * 0.72
          return (
            <motion.circle
              key={`f-${k}`}
              cx={60 + Math.cos(angle) * r}
              cy={topY - canopyR * 0.3 + Math.sin(angle) * r * 0.8}
              r="3.1"
              fill={FRUIT}
              animate={animate ? { opacity: [0.75, 1, 0.75] } : undefined}
              transition={{ duration: 3 + k * 0.3, repeat: Infinity, ease: 'easeInOut' }}
            />
          )
        })}
      </motion.g>

      {/* Pot en terre cuite, jusqu'au stade « arbuste » */}
      {hasPot && (
        <g>
          <path d="M42 92 L46 116 H74 L78 92 Z" fill={POT} opacity="0.9" />
          <rect x="39" y="86" width="42" height="9" rx="3.5" fill={POT} />
          <path d="M46 116 H74 L73 112 H47 Z" fill="var(--c-text)" opacity="0.08" />
        </g>
      )}
      {!hasPot && <path d="M40 100 Q60 90 80 100 L80 104 H40 Z" fill="var(--c-mint-soft)" />}

      {/* Terre */}
      {hasPot && <ellipse cx="60" cy="90" rx="19" ry="4.5" fill="var(--c-text)" opacity="0.16" />}

      {/*
        Graine, avant l'apparition de la tige.

        Le flottement passe par une translation, et non par l'attribut `cy` :
        animer un attribut SVG oblige la bibliothèque à lire sa valeur de
        départ dans le DOM, ce qu'elle ne parvient pas à faire au premier
        rendu — l'attribut partait alors à « undefined » et le navigateur
        rejetait l'élément. Un compte neuf est au premier palier : il était le
        seul à afficher cette graine, donc le seul à voir l'erreur.
      */}
      {i === 0 && (
        <motion.ellipse
          cx="60" cy="88" rx="6" ry="4.6" fill={POT} opacity="0.85"
          animate={animate ? { y: [0, -1.5, 0] } : undefined}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}


      {birds && (
        <g stroke={LEAF_DARK} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.7">
          <motion.path
            d="M18 30 q4 -4 8 0 q4 -4 8 0"
            animate={animate ? { x: [0, 6, 0], y: [0, -3, 0] } : undefined}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.path
            d="M88 22 q3 -3 6 0 q3 -3 6 0"
            animate={animate ? { x: [0, -5, 0], y: [0, 3, 0] } : undefined}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          />
        </g>
      )}
    </motion.svg>
  )
}
