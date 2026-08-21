import clsx from 'clsx'
import { useApp, type ThemeChoice } from '../store/useApp'
import { STRATEGIES, STRATEGY_BY_ID } from '../domain/strategy'
import { Button, Card, CardHeader, Chip } from '../components/ui/primitives'
import { Icon } from '../components/Icon'
import { dateLabel } from '../lib/format'

const THEMES: { value: ThemeChoice; label: string; icon: string }[] = [
  { value: 'system', label: 'Système', icon: 'Monitor' },
  { value: 'light', label: 'Clair', icon: 'Sun' },
  { value: 'dark', label: 'Sombre', icon: 'Moon' },
]

/** Droits ouverts par le RGPD, exposés directement dans l'interface. */
const RIGHTS = [
  { icon: 'ArrowDownFromLine', title: 'Exporter mes données', body: 'Recevoir l’intégralité de vos saisies dans un format lisible et réutilisable (article 20).' },
  { icon: 'PenLine', title: 'Corriger mes données', body: 'Toutes vos saisies sont modifiables directement dans l’app (article 16).' },
  { icon: 'X', title: 'Supprimer mon compte', body: 'Effacement définitif sous 30 jours, sauvegardes comprises (article 17).' },
  { icon: 'Lock', title: 'Limiter le traitement', body: 'Suspendre l’usage de vos données sans supprimer le compte (article 18).' },
]

export function ProfileScreen() {
  const profile = useApp((s) => s.profile)
  const theme = useApp((s) => s.theme)
  const setTheme = useApp((s) => s.setTheme)
  const signOut = useApp((s) => s.signOut)
  const resetDemo = useApp((s) => s.resetDemo)
  const pushToast = useApp((s) => s.pushToast)
  const setStrategy = useApp((s) => s.setStrategy)
  const strategyId = profile.strategyId

  const strategy = STRATEGY_BY_ID[strategyId]

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="eyebrow">Profil</p>
        <h1 className="mt-1 font-display text-[2rem] leading-tight text-ink">Réglages et données</h1>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Votre compte" icon="Users" tone="mint" />
          <div className="px-5 pb-5">
            <div className="flex items-center gap-4">
              <span className="grid size-14 place-items-center rounded-2xl bg-brand text-xl font-bold text-on-accent">
                {profile.displayName.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="font-display text-xl leading-tight text-ink">{profile.displayName}</p>
                <p className="truncate text-[0.85rem] text-ink-muted">{profile.email}</p>
                <p className="mt-1 flex flex-wrap items-center gap-1.5">
                  <Chip tone={profile.role === 'admin' ? 'orchid' : 'mint'} icon={profile.role === 'admin' ? 'Shield' : 'Leaf'}>
                    {profile.role === 'admin' ? 'Administrateur' : 'Membre'}
                  </Chip>
                  <Chip tone="indigo" icon="CalendarDays">
                    Depuis le {dateLabel(profile.createdAt)}
                  </Chip>
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <Button variant="outline" full icon="Lock">
                Changer le mot de passe
              </Button>
              <Button variant="outline" full icon="ShieldCheck">
                Activer la double authentification
              </Button>
              <Button variant="ghost" full icon="LogOut" onClick={signOut}>
                Se déconnecter
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Apparence" hint="Suit votre système par défaut" icon="Sun" tone="amber" />
          <div className="px-5 pb-5">
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setTheme(item.value)}
                  className={clsx(
                    'flex flex-col items-center gap-2 rounded-2xl border p-4 transition',
                    theme === item.value ? 'border-brand bg-brand-soft text-brand-deep' : 'border-line bg-surface text-ink-soft hover:bg-surface-2',
                  )}
                >
                  <Icon name={item.icon} size={19} />
                  <span className="text-[0.82rem] font-semibold">{item.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-line bg-surface-2 p-4">
              <p className="text-[0.85rem] font-semibold text-ink">Accessibilité</p>
              <p className="mt-1 text-[0.8rem] leading-snug text-ink-muted">
                Les animations se coupent automatiquement si votre système demande de réduire les mouvements. Les
                contrastes suivent le niveau AA du référentiel WCAG 2.2.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Votre stratégie"
          hint="Elle guide vos défis et votre répartition"
          icon="Target"
          tone="indigo"
        />
        <div className="px-5 pb-5">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {Object.values(STRATEGIES).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setStrategy(item.id)
                  pushToast({ title: 'Stratégie mise à jour', detail: item.name, tone: 'mint', icon: 'Target' })
                }}
                className={clsx(
                  'rounded-2xl border p-4 text-left transition',
                  strategyId === item.id ? 'border-brand bg-brand-soft' : 'border-line bg-surface hover:bg-surface-2',
                )}
              >
                <p className={clsx('font-display text-[1.02rem]', strategyId === item.id ? 'text-brand-deep' : 'text-ink')}>
                  {item.name}
                </p>
                <p className="tabular mt-1 text-[0.75rem] text-ink-muted">
                  {item.rule.needs} / {item.rule.wants} / {item.rule.future}
                </p>
              </button>
            ))}
          </div>
          {strategy && (
            <p className="mt-4 rounded-2xl bg-surface-2 p-4 text-[0.85rem] leading-relaxed text-ink-soft">
              {strategy.rationale}
            </p>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Vos données"
          hint="Traitées en Europe, sous votre contrôle"
          icon="Shield"
          tone="orchid"
        />
        <div className="px-5 pb-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {RIGHTS.map((right) => (
              <div key={right.title} className="rounded-2xl border border-line bg-surface-2 p-4">
                <span className="grid size-9 place-items-center rounded-xl bg-surface text-orchid">
                  <Icon name={right.icon} size={17} />
                </span>
                <p className="mt-2.5 text-[0.88rem] font-semibold text-ink">{right.title}</p>
                <p className="mt-1 text-[0.8rem] leading-snug text-ink-muted">{right.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-line bg-surface-2 p-4">
            <p className="text-[0.85rem] font-semibold text-ink">Ce que Budgette ne fait pas</p>
            <ul className="mt-2 flex flex-col gap-1.5 text-[0.82rem] leading-snug text-ink-soft">
              <li className="flex gap-2">
                <Icon name="X" size={14} className="mt-0.5 shrink-0 text-berry" />
                Aucune connexion à votre banque, aucun identifiant bancaire demandé ou stocké.
              </li>
              <li className="flex gap-2">
                <Icon name="X" size={14} className="mt-0.5 shrink-0 text-berry" />
                Aucune revente de données, aucun profilage publicitaire.
              </li>
              <li className="flex gap-2">
                <Icon name="X" size={14} className="mt-0.5 shrink-0 text-berry" />
                Aucun conseil en investissement : Budgette est un outil de suivi et de pédagogie budgétaire.
              </li>
            </ul>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" icon="ArrowDownFromLine">
              Exporter mes données
            </Button>
            <Button variant="ghost" icon="RotateCcw" onClick={resetDemo}>
              Réinitialiser la démonstration
            </Button>
            <Button variant="danger" icon="X">
              Supprimer mon compte
            </Button>
          </div>

          <p className="mt-4 text-[0.75rem] leading-relaxed text-ink-muted">
            Prototype : ces actions sont des maquettes. Elles seront réellement branchées lors de la phase Supabase,
            avec journalisation des demandes et délai de traitement d’un mois maximum, conformément au RGPD.
          </p>
        </div>
      </Card>
    </div>
  )
}
