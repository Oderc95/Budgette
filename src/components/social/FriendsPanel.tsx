import { useState } from 'react'
import { useCascade } from '../../lib/useCascade'
import { useApp } from '../../store/useApp'
import { MOCK_DIRECTORY } from '../../data/mock'
import { Card, CardHeader } from '../ui/primitives'
import { Icon } from '../Icon'
import { Mascot } from '../Mascot'

/**
 * Les amis : recherche par pseudo, demandes, et le jardin de chacun.
 *
 * Entre amis on partage la progression — niveau, palier de la plante —
 * jamais les montants. L'annuaire de recherche est simulé en Phase 1 ;
 * le vrai annuaire arrivera avec le socle Supabase.
 */
export function FriendsPanel() {
  const friends = useApp((s) => s.friends)
  const requestFriend = useApp((s) => s.requestFriend)
  const acceptFriend = useApp((s) => s.acceptFriend)
  const pushToast = useApp((s) => s.pushToast)
  const [query, setQuery] = useState('')
  const grilleRef = useCascade<HTMLDivElement>(':scope > *', [], { step: 50 })

  const knownIds = new Set(friends.map((f) => f.id))
  const cleaned = query.trim().toLowerCase()
  const results =
    cleaned.length >= 2
      ? MOCK_DIRECTORY.filter(
          (person) =>
            !knownIds.has(person.id) &&
            (person.pseudo.toLowerCase().includes(cleaned) ||
              person.displayName.toLowerCase().includes(cleaned)),
        )
      : []

  const requests = friends.filter((f) => f.status === 'demande_recue')
  const confirmed = friends.filter((f) => f.status === 'ami')
  const pending = friends.filter((f) => f.status === 'demande_envoyee')

  return (
    <div className="flex flex-col gap-5">
      {/* Recherche par pseudo */}
      <Card>
        <CardHeader title="Trouver quelqu'un" hint="Chaque compte a un pseudo unique" icon="Search" tone="indigo" />
        <div className="px-5 pb-5">
          <div className="relative">
            <Icon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="@pseudo ou prénom…"
              className="w-full rounded-xl border border-line bg-surface py-2.5 pl-10 pr-4 text-[0.9rem] text-ink outline-none transition focus:border-brand"
              aria-label="Rechercher un pseudo"
            />
          </div>

          {cleaned.length >= 2 && (
            <ul className="mt-3 flex flex-col gap-2">
              {results.length === 0 && (
                <li className="rounded-xl bg-surface-2 px-4 py-3 text-[0.85rem] text-ink-muted">
                  Personne ne correspond à « {query.trim()} ».
                </li>
              )}
              {results.map((person) => (
                <li
                  key={person.id}
                  className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 px-3 py-2.5"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface">
                    <Mascot stageIndex={person.stageIndex} size={34} animate={false} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.9rem] font-semibold text-ink">{person.displayName}</span>
                    <span className="block truncate text-[0.75rem] text-ink-muted">@{person.pseudo}</span>
                  </span>
                  <span className="chip bg-amber-soft text-amber-deep">Nv {person.level}</span>
                  <button
                    type="button"
                    onClick={() => {
                      requestFriend({ ...person, status: 'demande_envoyee' })
                      pushToast({ title: 'Demande envoyée', detail: `@${person.pseudo}`, tone: 'indigo', icon: 'UserPlus' })
                      setQuery('')
                    }}
                    className="chip bg-brand-soft text-brand-deep transition hover:brightness-95"
                  >
                    <Icon name="UserPlus" size={13} />
                    Ajouter
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {/* Demandes reçues */}
      {requests.length > 0 && (
        <Card>
          <CardHeader title="Demandes reçues" icon="UserPlus" tone="berry" />
          <ul className="flex flex-col gap-2 px-5 pb-5">
            {requests.map((person) => (
              <li key={person.id} className="flex items-center gap-3 rounded-xl border border-berry/30 bg-berry-soft/40 px-3 py-2.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface">
                  <Mascot stageIndex={person.stageIndex} size={34} animate={false} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.9rem] font-semibold text-ink">{person.displayName}</span>
                  <span className="block truncate text-[0.75rem] text-ink-muted">@{person.pseudo}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    acceptFriend(person.id)
                    pushToast({ title: 'Vous voilà amis !', detail: `@${person.pseudo}`, tone: 'mint', icon: 'Check' })
                  }}
                  className="chip bg-mint-soft text-mint-deep transition hover:brightness-95"
                >
                  <Icon name="Check" size={13} />
                  Accepter
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Mes amis */}
      <Card>
        <CardHeader
          title="Vos amis"
          hint="Leur jardin est visible, jamais leurs montants"
          icon="Users"
          tone="mint"
        />
        <div ref={grilleRef} className="grid gap-3 px-5 pb-5 sm:grid-cols-2 lg:grid-cols-3">
          {confirmed.map((person) => (
            <div key={person.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface-2 p-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-surface">
                <Mascot stageIndex={person.stageIndex} size={42} animate={false} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.9rem] font-semibold text-ink">{person.displayName}</span>
                <span className="block truncate text-[0.75rem] text-ink-muted">@{person.pseudo}</span>
                <span className="chip mt-1 bg-amber-soft text-[0.65rem] text-amber-deep">Niveau {person.level}</span>
              </span>
            </div>
          ))}
          {pending.map((person) => (
            <div key={person.id} className="flex items-center gap-3 rounded-2xl border border-dashed border-line p-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-surface">
                <Mascot stageIndex={person.stageIndex} size={42} animate={false} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.9rem] font-semibold text-ink">{person.displayName}</span>
                <span className="block truncate text-[0.75rem] text-ink-muted">@{person.pseudo}</span>
                <span className="mt-1 block text-[0.7rem] italic text-ink-muted">Demande envoyée…</span>
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
