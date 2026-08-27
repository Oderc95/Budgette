import { useState } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../store/useApp'
import { Ambient, Button } from '../components/ui/primitives'
import { Icon } from '../components/Icon'
import { Logo } from '../components/Logo'
import { Mascot } from '../components/Mascot'

const PROMISES = [
  { icon: 'Target', title: 'Un objectif, une stratégie', body: "Vous dites où vous voulez aller, l'app adapte la répartition de chaque euro." },
  { icon: 'ListChecks', title: 'Des défis à votre rythme', body: 'Du quotidien à l’annuel, une progression qui ne s’arrête jamais.' },
  { icon: 'Sprout', title: 'Un jardin qui pousse', body: 'Votre régularité fait grandir la plante, du grain à la canopée.' },
  { icon: 'Lock', title: 'Vos données restent les vôtres', body: 'Hébergement en Europe, export et suppression à tout moment.' },
]

/*
 * Chorégraphie d'entrée : un seul parent orchestre, chaque enfant se contente
 * de déclarer les mêmes deux états. C'est ce qui garantit que tout l'écran
 * arrive dans un ordre lisible — marque, titre, champs, boutons — au lieu
 * d'animations indépendantes qui se marchent dessus.
 */
const scene = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
}

const piece = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 240, damping: 22 },
  },
}

/** Le titre arrive mot à mot, comme posé à la main. */
function TitreAnime({ texte }: { texte: string }) {
  return (
    <h2 className="font-display text-3xl text-ink">
      {texte.split(' ').map((mot, index) => (
        <motion.span
          key={index}
          className="inline-block"
          variants={{
            hidden: { opacity: 0, y: 22, rotate: 4 },
            visible: {
              opacity: 1,
              y: 0,
              rotate: 0,
              transition: { type: 'spring', stiffness: 320, damping: 24 },
            },
          }}
        >
          {mot}
          {' '}
        </motion.span>
      ))}
    </h2>
  )
}

export function SignIn() {
  const signIn = useApp((s) => s.signIn)
  const signUp = useApp((s) => s.signUp)
  const [email, setEmail] = useState('camille@budgette.app')
  const [password, setPassword] = useState('demo')
  const [showPassword, setShowPassword] = useState(false)

  return (
    <>
      <Ambient />
      <div className="relative z-10 grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Colonne de présentation */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-line bg-surface-2 p-10 lg:flex">
        <div className="max-w-md">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <p className="eyebrow mb-3">Petits pas aujourd’hui, grands résultats demain</p>
            <h1 className="font-display text-[2.6rem] leading-[1.08] text-ink">
              Comprendre son budget,
              <br />
              <span className="text-mint-deep">sans y passer ses soirées.</span>
            </h1>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-soft">
              Une saisie par mois, des défis qui rendent l’effort concret, et une trajectoire qui se voit.
            </p>
          </motion.div>

          <ul className="mt-8 flex flex-col gap-3.5">
            {PROMISES.map((promise, index) => (
              <motion.li
                key={promise.title}
                className="flex items-start gap-3"
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + index * 0.1, type: 'spring', stiffness: 260, damping: 24 }}
              >
                <motion.span
                  className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-surface text-mint-deep"
                  whileHover={{ scale: 1.15, rotate: -6 }}
                >
                  <Icon name={promise.icon} size={16} />
                </motion.span>
                <span>
                  <span className="block text-[0.9rem] font-semibold text-ink">{promise.title}</span>
                  <span className="block text-[0.85rem] leading-snug text-ink-muted">{promise.body}</span>
                </span>
              </motion.li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 max-w-md text-[0.75rem] leading-relaxed text-ink-muted">
          Budgette est un outil de suivi budgétaire et de pédagogie financière. Il ne fournit aucun conseil en
          investissement et ne se connecte à aucun compte bancaire.
        </p>

        <motion.div
          className="pointer-events-none absolute -bottom-14 -right-10 opacity-55"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Mascot stageIndex={7} size={280} />
        </motion.div>
      </div>

      {/* Colonne de connexion */}
      {/*
        `min-h-dvh` et non `h-dvh` : sur un très petit écran, ou clavier ouvert,
        le contenu doit pouvoir déborder plutôt que d'être rogné. Sur un
        téléphone ordinaire, tout tient sans défilement.
      */}
      <div className="pad-safe-top pad-safe-x flex min-h-dvh flex-col justify-center gap-7 px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <motion.div className="mx-auto w-full max-w-sm" variants={scene} initial="hidden" animate="visible">
          <motion.div variants={piece}>
            <Logo size="lg" layout="column" className="mb-6" draw />
          </motion.div>

          <motion.div variants={piece} className="text-center">
            <TitreAnime texte="Content de vous revoir" />
          </motion.div>

          <form
            className="mt-6 flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault()
              signIn()
            }}
          >
            <motion.label variants={piece} className="flex flex-col gap-1.5">
              <span className="text-[0.8rem] font-semibold text-ink-soft">Adresse e-mail</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                className="rounded-xl border border-line bg-surface px-4 py-3 text-ink outline-none transition focus:border-brand"
              />
            </motion.label>

            <motion.label variants={piece} className="flex flex-col gap-1.5">
              <span className="text-[0.8rem] font-semibold text-ink-soft">Mot de passe</span>
              <span className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  className="w-full rounded-xl border border-line bg-surface px-4 py-3 pr-12 text-ink outline-none transition focus:border-brand"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-0 grid w-11 place-items-center text-ink-muted hover:text-ink"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={17} />
                </button>
              </span>
            </motion.label>

            <motion.div variants={piece} className="mt-2 flex flex-col gap-2.5">
              <Button type="submit" size="lg" full iconRight="ArrowRight">
                Se connecter
              </Button>
              {/* Un compte neuf part d'une page blanche et passe par le
                  questionnaire d'arrivée ; « Se connecter » reprend le compte
                  de démonstration, déjà rempli. */}
              <Button type="button" variant="ghost" size="md" full onClick={signUp}>
                Créer un compte
              </Button>
            </motion.div>
          </form>
        </motion.div>

        {/*
          La mention légale reste, mais en pied de page et en une ligne : elle
          doit être lisible sans occuper le tiers de l'écran.
        */}
        <motion.p
          variants={piece}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-sm text-center text-[0.72rem] leading-snug text-ink-muted"
        >
          Prototype — connexion simulée, aucune donnée réelle.
        </motion.p>
      </div>
      </div>
    </>
  )
}
