import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import { useApp } from '../store/useApp'
import { Icon } from './Icon'
import { TONE } from './ui/tone'

/**
 * Notifications de récompense.
 *
 * Elles sont traitées comme un gain de jeu, pas comme un message système :
 * pastille pleine, valeur mise en avant, jauge de disparition, et une entrée
 * élastique depuis le bas. Trois au maximum sont visibles à la fois.
 */
export function Toaster() {
  const toasts = useApp((s) => s.toasts)
  const dismiss = useApp((s) => s.dismissToast)

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2.5 px-4 sm:bottom-6 sm:left-auto sm:right-6 sm:items-end"
      role="status"
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast, index) => {
          const tone = TONE[toast.tone]
          return (
            <motion.button
              key={toast.id}
              type="button"
              onClick={() => dismiss(toast.id)}
              layout
              className={clsx(
                'pointer-events-auto relative flex w-full max-w-sm items-center gap-3 overflow-hidden rounded-2xl',
                'border border-line bg-surface py-3 pl-3 pr-4 text-left shadow-lift',
              )}
              initial={{ opacity: 0, y: 28, scale: 0.88, rotate: -1.5 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, x: 24, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 380, damping: 22, delay: index * 0.04 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              {/* Aplat teinté très léger, pour colorer la notification sans nuire à la lisibilité */}
              <span className={clsx('absolute inset-0 opacity-60', tone.bg)} aria-hidden />
              <span className={clsx('absolute inset-y-0 left-0 w-1', tone.solid)} aria-hidden />

              <motion.span
                className={clsx(
                  'relative grid size-11 shrink-0 place-items-center rounded-xl text-on-accent',
                  tone.solid,
                )}
                initial={{ scale: 0.4, rotate: -25 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 12, delay: 0.08 }}
              >
                <Icon name={toast.icon ?? 'Sparkles'} size={20} />
              </motion.span>

              <span className="relative min-w-0 flex-1">
                <span className={clsx('block font-display text-[1.05rem] leading-tight', tone.deep)}>
                  {toast.title}
                </span>
                {toast.detail && (
                  <span className="mt-0.5 block truncate text-[0.8rem] text-ink-soft">{toast.detail}</span>
                )}
              </span>

              {/* Jauge de disparition : la notification s'efface au bout du compte */}
              <motion.span
                className={clsx('absolute bottom-0 left-0 h-[3px] rounded-full', tone.solid)}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 4.6, ease: 'linear' }}
                aria-hidden
              />
            </motion.button>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
