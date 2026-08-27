import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { useApp } from '../store/useApp'
import { Icon } from './Icon'
import { Progress } from './ui/primitives'
import { completude, premiersPas } from '../domain/progression'

/**
 * Les premiers pas d'un compte neuf, en tête de l'accueil.
 *
 * La carte remplace la visite guidée : plutôt que des flèches qui désignent
 * des boutons, une liste de gestes qui produisent quelque chose. Chaque ligne
 * mène à l'écran concerné, et se coche toute seule quand la donnée existe —
 * jamais sur un clic, sinon la liste finirait par mentir.
 *
 * Une fois les quatre faits, elle disparaît définitivement : elle n'a plus
 * rien à dire, et l'accueil retrouve sa pleine hauteur.
 */
export function PremiersPas() {
  const budgets = useApp((s) => s.budgets)
  const goals = useApp((s) => s.goals)
  const profile = useApp((s) => s.profile)
  const activeMonth = useApp((s) => s.activeMonth)

  const etat = { budgets, goals, profile, activeMonth }
  const pas = premiersPas(etat)
  const part = completude(etat)

  if (part >= 1) return null

  const faits = pas.filter((p) => p.fait).length
  // Le prochain geste est mis en avant : une liste où tout se vaut ne dit pas
  // par où commencer.
  const prochain = pas.find((p) => !p.fait)

  return (
    <motion.section
      className="card overflow-hidden"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
    >
      <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-deep">
          <Icon name="Sprout" size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[1.05rem] leading-tight text-ink">Vos premiers pas</h2>
          <p className="tabular text-[0.75rem] text-ink-muted">
            {faits} sur {pas.length} — compte complété à {Math.round(part * 100)} %
          </p>
        </div>
      </div>

      <div className="px-4 pt-3">
        <Progress value={part} tone="brand" height={6} label="Complétude du compte" />
      </div>

      <ul className="flex flex-col p-2">
        {pas.map((p) => (
          <li key={p.id}>
            <Link
              to={p.to}
              className={clsx(
                'flex items-center gap-3 rounded-xl px-2 py-2.5 transition',
                p.fait ? 'opacity-55' : 'hover:bg-surface-2',
              )}
            >
              <span
                className={clsx(
                  'grid size-8 shrink-0 place-items-center rounded-lg',
                  p.fait ? 'bg-mint-soft text-mint-deep' : 'bg-surface-2 text-ink-soft',
                )}
              >
                <Icon name={p.fait ? 'Check' : p.icon} size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={clsx(
                    'block text-[0.88rem] font-semibold leading-tight',
                    p.fait ? 'text-ink-muted line-through' : 'text-ink',
                  )}
                >
                  {p.label}
                </span>
                {!p.fait && <span className="block text-[0.75rem] leading-snug text-ink-muted">{p.hint}</span>}
              </span>
              {p.id === prochain?.id && (
                <motion.span
                  className="shrink-0 text-brand"
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Icon name="ArrowRight" size={17} />
                </motion.span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </motion.section>
  )
}
