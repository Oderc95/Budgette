import { AnimatePresence, motion } from 'framer-motion'
import { useApp } from '../store/useApp'
import { Icon } from './Icon'
import { TONE } from './ui/tone'
import clsx from 'clsx'

export function Toaster() {
  const toasts = useApp((s) => s.toasts)
  const dismiss = useApp((s) => s.dismissToast)

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:left-auto sm:right-6 sm:items-end"
      role="status"
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.button
            key={toast.id}
            type="button"
            onClick={() => dismiss(toast.id)}
            className={clsx(
              'pointer-events-auto flex max-w-sm items-center gap-3 rounded-2xl border px-4 py-3 text-left shadow-lift',
              'bg-surface border-line',
            )}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          >
            <span className={clsx('grid size-8 shrink-0 place-items-center rounded-xl', TONE[toast.tone].bg, TONE[toast.tone].text)}>
              <Icon name={toast.icon ?? 'Sparkles'} size={16} />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-[0.95rem] leading-tight text-ink">{toast.title}</span>
              {toast.detail && <span className="block truncate text-[0.78rem] text-ink-muted">{toast.detail}</span>}
            </span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  )
}
