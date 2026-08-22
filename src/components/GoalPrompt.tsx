import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useApp } from '../store/useApp'
import { Button } from './ui/primitives'
import { Icon } from './Icon'
import { Mascot } from './Mascot'

/**
 * La proposition d'objectif.
 *
 * Elle suit la visite guidée — comprendre l'app, puis dire où l'on va — et
 * revient quand on rejoint quelqu'un sans avoir d'objectif à soi. « Plus
 * tard » la ferme sans insister : l'objectif reste à un bouton de distance
 * sur son écran.
 */
export function GoalPrompt() {
  const pending = useApp((s) => s.goalPromptPending)
  const tourDone = useApp((s) => s.tourDone)
  const dismiss = useApp((s) => s.dismissGoalPrompt)
  const navigate = useNavigate()

  if (!pending || !tourDone) return null

  return (
    <motion.div
      className="fixed inset-0 z-[60] grid place-items-center bg-bg/70 p-5 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      role="dialog"
      aria-modal="true"
      aria-label="Définir votre objectif"
    >
      <motion.div
        className="card w-full max-w-sm p-6 text-center"
        initial={{ scale: 0.9, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
      >
        <div className="flex justify-center">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Mascot stageIndex={3} size={96} animate={false} />
          </motion.div>
        </div>
        <h2 className="mt-2 font-display text-2xl text-ink">Et maintenant, ton objectif !</h2>
        <p className="mt-1.5 text-[0.95rem] leading-snug text-ink-soft">
          Un cap chiffré et daté : c'est lui qui donne un sens à chaque euro mis de côté.
        </p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={dismiss}
            className="text-[0.82rem] font-medium text-ink-muted transition hover:text-ink"
          >
            Plus tard
          </button>
          <Button
            icon="Target"
            onClick={() => {
              dismiss()
              navigate('/objectifs?nouveau=1')
            }}
          >
            Choisir mon objectif
          </Button>
        </div>
        <p className="mt-3 flex items-center justify-center gap-1 text-[0.7rem] text-ink-muted">
          <Icon name="Users" size={11} />
          Il peut aussi se vivre à plusieurs, dans un groupe.
        </p>
      </motion.div>
    </motion.div>
  )
}
