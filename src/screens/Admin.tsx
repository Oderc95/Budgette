import { useState } from 'react'
import { useCascade } from '../lib/useCascade'
import clsx from 'clsx'
import { MOCK_ADMIN_USERS, MOCK_AUDIT_LOG, MOCK_FEATURE_FLAGS } from '../data/mock'
import { BADGES, CHALLENGES } from '../domain/challenges'
import { CADENCE_META } from '../domain/gamification'
import { Button, Card, CardHeader, Chip, Progress, Stat } from '../components/ui/primitives'
import { TONE } from '../components/ui/tone'
import { Icon } from '../components/Icon'
import { dateLabel } from '../lib/format'

type Tab = 'overview' | 'users' | 'content' | 'compliance'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Vue d’ensemble', icon: 'LayoutDashboard' },
  { id: 'users', label: 'Utilisateurs', icon: 'Users' },
  { id: 'content', label: 'Contenus', icon: 'ListChecks' },
  { id: 'compliance', label: 'Conformité', icon: 'Shield' },
]

export function Admin() {
  const [tab, setTab] = useState<Tab>('overview')
  // Les indicateurs de la vue d'ensemble tombent en cascade à l'arrivée.
  const statsRef = useCascade<HTMLDivElement>(':scope > *', [tab], { step: 40 })
  const [flags, setFlags] = useState(MOCK_FEATURE_FLAGS)
  const [query, setQuery] = useState('')

  const users = MOCK_ADMIN_USERS.filter(
    (user) =>
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase()),
  )
  const activeUsers = MOCK_ADMIN_USERS.filter((u) => u.status === 'actif').length
  const retention = Math.round((MOCK_ADMIN_USERS.filter((u) => u.months >= 3).length / MOCK_ADMIN_USERS.length) * 100)

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Administration</p>
          <h1 className="mt-1 font-display text-[2rem] leading-tight text-ink">Console</h1>
          <p className="mt-1 text-[0.9rem] text-ink-soft">
            Réservée aux administrateurs. Tout est journalisé.
          </p>
        </div>
        <Chip tone="orchid" icon="Shield">
          Rôle administrateur
        </Chip>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={clsx(
              'flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-[0.85rem] font-semibold transition',
              tab === item.id ? 'border-brand bg-brand-soft text-brand-deep' : 'border-line bg-surface text-ink-soft hover:bg-surface-2',
            )}
          >
            <Icon name={item.icon} size={15} />
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <div ref={statsRef} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Comptes" value={String(MOCK_ADMIN_USERS.length)} icon="Users" tone="mint" emphasis />
            <Stat label="Actifs 30 j" value={String(activeUsers)} icon="Flame" tone="berry" hint="Au moins une saisie" />
            <Stat label="Rétention 3 mois" value={`${retention} %`} icon="TrendingUp" tone="amber" />
            <Stat label="Défis publiés" value={String(CHALLENGES.length)} icon="ListChecks" tone="orchid" />
          </div>

          <Card>
            <CardHeader title="Santé du produit" hint="Indicateurs agrégés, jamais nominatifs" icon="HeartPulse" tone="indigo" />
            <div className="grid gap-4 px-5 pb-5 lg:grid-cols-2">
              {[
                { label: 'Mois clôturés par utilisateur actif', value: 0.82, hint: '0,82 en moyenne sur août' },
                { label: 'Défis validés par semaine', value: 0.64, hint: '4,5 défis par utilisateur actif' },
                { label: 'Taux de complétion de l’onboarding', value: 0.91, hint: '91 % vont jusqu’à la stratégie' },
                { label: 'Comptes avec un objectif défini', value: 0.73, hint: '73 % des inscrits' },
              ].map((metric) => (
                <div key={metric.label} className="rounded-2xl border border-line bg-surface-2 p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[0.85rem] font-semibold text-ink">{metric.label}</p>
                    <p className="tabular font-display text-lg text-mint-deep">{Math.round(metric.value * 100)} %</p>
                  </div>
                  <div className="mt-2">
                    <Progress value={metric.value} tone="mint" height={6} />
                  </div>
                  <p className="mt-1.5 text-[0.75rem] text-ink-muted">{metric.hint}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Fonctionnalités" hint="Progressif et réversible" icon="Settings" tone="amber" />
            <ul className="flex flex-col gap-2 px-5 pb-5">
              {flags.map((flag) => (
                <li key={flag.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface-2 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.9rem] font-semibold text-ink">{flag.label}</p>
                    <p className="mt-0.5 text-[0.8rem] leading-snug text-ink-muted">{flag.description}</p>
                  </div>
                  <span className="tabular hidden w-16 text-right text-[0.78rem] text-ink-muted sm:block">
                    {flag.rollout} %
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={flag.enabled}
                    aria-label={`Activer ${flag.label}`}
                    onClick={() =>
                      setFlags((current) =>
                        current.map((item) =>
                          item.id === flag.id
                            ? { ...item, enabled: !item.enabled, rollout: !item.enabled ? Math.max(10, item.rollout) : 0 }
                            : item,
                        ),
                      )
                    }
                    className={clsx(
                      'relative h-6 w-11 shrink-0 rounded-full transition',
                      flag.enabled ? 'bg-mint' : 'bg-surface-3',
                    )}
                  >
                    <span
                      className={clsx(
                        'absolute top-0.5 size-5 rounded-full bg-surface shadow-soft transition-all',
                        flag.enabled ? 'left-[1.375rem]' : 'left-0.5',
                      )}
                    />
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}

      {tab === 'users' && (
        <Card>
          <CardHeader
            title="Comptes"
            hint="Jamais de données budgétaires ici"
            icon="Users"
            tone="mint"
            action={
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher…"
                className="w-40 rounded-lg border border-line bg-surface px-3 py-1.5 text-[0.82rem] text-ink outline-none focus:border-brand sm:w-56"
              />
            }
          />
          <div className="overflow-x-auto px-5 pb-5">
            <table className="w-full min-w-[46rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-line">
                  {['Membre', 'Rôle', 'Niveau', 'Mois saisis', 'Inscription', 'Dernière visite', 'Statut', ''].map((head) => (
                    <th key={head} className="eyebrow px-2 py-2.5">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-line/60 last:border-0">
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-mint-soft text-[0.78rem] font-bold text-mint-deep">
                          {user.name.slice(0, 1)}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[0.85rem] font-semibold text-ink">{user.name}</span>
                          <span className="block truncate text-[0.75rem] text-ink-muted">{user.email}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <Chip tone={user.role === 'admin' ? 'orchid' : 'mint'}>{user.role === 'admin' ? 'Admin' : 'Membre'}</Chip>
                    </td>
                    <td className="tabular px-2 py-3 text-[0.85rem] text-ink">{user.level}</td>
                    <td className="tabular px-2 py-3 text-[0.85rem] text-ink">{user.months}</td>
                    <td className="tabular px-2 py-3 text-[0.8rem] text-ink-muted">{user.joined}</td>
                    <td className="tabular px-2 py-3 text-[0.8rem] text-ink-muted">{user.lastSeen}</td>
                    <td className="px-2 py-3">
                      <Chip tone={user.status === 'actif' ? 'mint' : user.status === 'inactif' ? 'indigo' : 'berry'}>
                        {user.status}
                      </Chip>
                    </td>
                    <td className="px-2 py-3 text-right">
                      <Button variant="ghost" size="sm" icon="Settings">
                        Gérer
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'content' && (
        <>
          <Card>
            <CardHeader title="Catalogue de défis" hint={`${CHALLENGES.length} défis répartis sur quatre cadences`} icon="ListChecks" tone="amber" />
            <div className="grid gap-2 px-5 pb-5 sm:grid-cols-2">
              {CHALLENGES.map((challenge) => (
                <div key={challenge.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-3">
                  <span className={clsx('grid size-8 shrink-0 place-items-center rounded-lg', TONE[challenge.tone].bg, TONE[challenge.tone].text)}>
                    <Icon name={challenge.icon} size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.85rem] font-semibold text-ink">{challenge.title}</span>
                    <span className="block text-[0.72rem] text-ink-muted">
                      {CADENCE_META[challenge.cadence].label} · {challenge.difficulty}
                    </span>
                  </span>
                  <span className="tabular shrink-0 text-[0.78rem] font-semibold text-amber">+{challenge.xp}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Catalogue de badges" hint={`${BADGES.length} récompenses`} icon="Trophy" tone="orchid" />
            <div className="grid gap-2 px-5 pb-5 sm:grid-cols-2 lg:grid-cols-3">
              {BADGES.map((badge) => (
                <div key={badge.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-3">
                  <span className={clsx('grid size-8 shrink-0 place-items-center rounded-lg', TONE[badge.tone].bg, TONE[badge.tone].text)}>
                    <Icon name={badge.icon} size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.85rem] font-semibold text-ink">{badge.label}</span>
                    <span className="block truncate text-[0.72rem] text-ink-muted">{badge.criteria}</span>
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {tab === 'compliance' && (
        <>
          <Card>
            <CardHeader title="Journal d’audit" hint="Chaque action, tracée et horodatée" icon="FileText" tone="indigo" />
            <ul className="flex flex-col gap-1 px-5 pb-5">
              {MOCK_AUDIT_LOG.map((entry) => (
                <li key={entry.at} className="flex flex-wrap items-center gap-2 border-b border-line/60 py-3 last:border-0">
                  <span className="tabular w-28 shrink-0 text-[0.75rem] text-ink-muted">{dateLabel(entry.at)}</span>
                  <span className="chip bg-surface-2 text-ink-soft">{entry.action}</span>
                  <span className="text-[0.85rem] text-ink">{entry.target}</span>
                  <span className="text-[0.8rem] text-ink-muted">— {entry.detail}</span>
                  <span className="ml-auto text-[0.75rem] text-ink-muted">par {entry.actor}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Registre des traitements" hint="Base de travail pour l’article 30 du RGPD" icon="Shield" tone="orchid" />
            <div className="grid gap-3 px-5 pb-5 lg:grid-cols-2">
              {[
                {
                  title: 'Gestion des comptes',
                  purpose: 'Créer et sécuriser l’accès au service',
                  basis: 'Exécution du contrat (art. 6.1.b)',
                  data: 'Adresse e-mail, empreinte du mot de passe, journaux de connexion',
                  retention: 'Durée du compte, puis 30 jours',
                },
                {
                  title: 'Suivi budgétaire',
                  purpose: 'Enregistrer les montants saisis et produire les analyses',
                  basis: 'Exécution du contrat (art. 6.1.b)',
                  data: 'Montants par catégorie et par mois, objectifs, poches d’épargne',
                  retention: 'Durée du compte, export possible à tout moment',
                },
                {
                  title: 'Gamification',
                  purpose: 'Attribuer expérience, badges et séries',
                  basis: 'Exécution du contrat (art. 6.1.b)',
                  data: 'Défis validés, niveau, série en cours',
                  retention: 'Durée du compte',
                },
                {
                  title: 'Mesure d’audience',
                  purpose: 'Comprendre l’usage pour améliorer le produit',
                  basis: 'Consentement (art. 6.1.a), désactivé par défaut',
                  data: 'Événements anonymisés, sans identifiant publicitaire',
                  retention: '13 mois maximum',
                },
              ].map((record) => (
                <div key={record.title} className="rounded-2xl border border-line bg-surface-2 p-4">
                  <p className="font-display text-[1.02rem] text-ink">{record.title}</p>
                  <dl className="mt-2.5 flex flex-col gap-1.5 text-[0.8rem] leading-snug">
                    {[
                      ['Finalité', record.purpose],
                      ['Base légale', record.basis],
                      ['Données', record.data],
                      ['Conservation', record.retention],
                    ].map(([label, value]) => (
                      <div key={label} className="flex gap-2">
                        <dt className="w-24 shrink-0 font-semibold text-ink-muted">{label}</dt>
                        <dd className="text-ink-soft">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
            <p className="border-t border-line px-5 py-3 text-[0.75rem] leading-relaxed text-ink-muted">
              Budgette ne traite aucune donnée bancaire d’identification (IBAN, numéro de carte) et ne se connecte à
              aucun établissement financier : le service n’entre pas dans le champ de la DSP2 et ne requiert donc
              aucun agrément d’agrégateur.
            </p>
          </Card>
        </>
      )}
    </div>
  )
}
