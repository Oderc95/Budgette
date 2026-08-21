import { useState } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../store/useApp'
import { Ambient, Button } from '../components/ui/primitives'
import { Icon } from '../components/Icon'
import { LogoLockup } from '../components/Logo'
import { Mascot } from '../components/Mascot'

const PROMISES = [
  { icon: 'Target', title: 'Un objectif, une stratégie', body: "Vous dites où vous voulez aller, l'app adapte la répartition de chaque euro." },
  { icon: 'ListChecks', title: 'Des défis à votre rythme', body: 'Du quotidien à l’annuel, une progression qui ne s’arrête jamais.' },
  { icon: 'Sprout', title: 'Un jardin qui pousse', body: 'Votre régularité fait grandir la plante, du grain à la canopée.' },
  { icon: 'Lock', title: 'Vos données restent les vôtres', body: 'Hébergement en Europe, export et suppression à tout moment.' },
]

export function SignIn() {
  const signIn = useApp((s) => s.signIn)
  const [email, setEmail] = useState('camille@budgette.app')
  const [password, setPassword] = useState('demo')
  const [showPassword, setShowPassword] = useState(false)

  return (
    <>
      <Ambient />
      <div className="relative z-10 grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Colonne de présentation */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-line bg-surface-2 p-10 lg:flex">
        <LogoLockup size="lg" />

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
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.08 }}
              >
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-surface text-mint-deep">
                  <Icon name={promise.icon} size={16} />
                </span>
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

        <div className="pointer-events-none absolute -bottom-14 -right-10 opacity-55">
          <Mascot stageIndex={7} size={280} />
        </div>
      </div>

      {/* Colonne de connexion */}
      <div className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <LogoLockup size="md" className="mb-8 lg:hidden" />

          <h2 className="font-display text-3xl text-ink">Content de vous revoir</h2>
          <p className="mt-1.5 text-[0.9rem] text-ink-muted">Reprenons là où vous en étiez.</p>

          <form
            className="mt-7 flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              signIn()
            }}
          >
            <label className="flex flex-col gap-1.5">
              <span className="text-[0.8rem] font-semibold text-ink-soft">Adresse e-mail</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                className="rounded-xl border border-line bg-surface px-4 py-3 text-[0.9rem] text-ink outline-none transition focus:border-brand"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="flex items-center justify-between text-[0.8rem] font-semibold text-ink-soft">
                Mot de passe
                <button type="button" className="text-[0.75rem] font-medium text-brand-deep underline-offset-2 hover:underline">
                  Oublié ?
                </button>
              </span>
              <span className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  className="w-full rounded-xl border border-line bg-surface px-4 py-3 pr-11 text-[0.9rem] text-ink outline-none transition focus:border-brand"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-3 grid place-items-center text-ink-muted hover:text-ink"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  <Icon name={showPassword ? 'Lock' : 'Info'} size={16} />
                </button>
              </span>
            </label>

            <Button type="submit" size="lg" full iconRight="ArrowRight">
              Se connecter
            </Button>

            <div className="flex items-center gap-3 py-1">
              <span className="h-px flex-1 bg-line" />
              <span className="text-[0.72rem] uppercase tracking-widest text-ink-muted">ou</span>
              <span className="h-px flex-1 bg-line" />
            </div>

            <Button type="button" variant="outline" size="lg" full icon="Plus" onClick={signIn}>
              Créer un compte
            </Button>
          </form>

          <div className="mt-7 rounded-2xl border border-line bg-surface-2 p-4">
            <p className="flex items-center gap-2 text-[0.8rem] font-semibold text-ink">
              <Icon name="ShieldCheck" size={15} className="text-mint" />
              Prototype — aucune donnée réelle
            </p>
            <p className="mt-1.5 text-[0.78rem] leading-snug text-ink-muted">
              Cette version sert à valider l’interface. La connexion est simulée : la vraie authentification
              (mot de passe fort, double facteur, sessions révocables) arrive avec le socle Supabase.
            </p>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}
