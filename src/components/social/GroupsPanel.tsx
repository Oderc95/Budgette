import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import type { Group } from '../../domain/types'
import { useApp } from '../../store/useApp'
import { GOAL_CATALOG } from '../../domain/strategy'
import { Button, Card, Progress } from '../ui/primitives'
import { TONE } from '../ui/tone'
import { Icon } from '../Icon'
import { newId } from '../../lib/id'
import { burst } from '../../lib/wow'
import { addMonths, euro, monthKey, monthLabel } from '../../lib/format'

/** Total versé au pot commun d'un groupe, tous membres confondus. */
function groupTotal(group: Group): number {
  return group.members.reduce(
    (sum, member) => sum + Object.values(member.contributions).reduce((s, v) => s + v, 0),
    0,
  )
}

/** Total versé par un membre. */
function memberTotal(contributions: Record<string, number>): number {
  return Object.values(contributions).reduce((s, v) => s + v, 0)
}

/**
 * Les groupes : épargner à plusieurs sur un objectif commun.
 *
 * Chaque groupe a exactement un administrateur : il configure l'objectif,
 * le montant, l'échéance, et gère les membres. Les autres voient tout et
 * versent leur part. En Phase 1 tout est local ; la synchronisation entre
 * comptes arrivera avec le socle Supabase.
 */
export function GroupsPanel() {
  const groups = useApp((s) => s.groups)
  const profile = useApp((s) => s.profile)
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.85rem] text-ink-soft">Un objectif commun, un pot commun, un administrateur.</p>
        <Button icon="Plus" onClick={() => setCreating(true)}>
          Créer un groupe
        </Button>
      </div>

      {groups.map((group) => (
        <GroupCard
          key={group.id}
          group={group}
          meId={profile.id}
          open={openGroup === group.id}
          onToggle={() => setOpenGroup(openGroup === group.id ? null : group.id)}
        />
      ))}

      <AnimatePresence>
        {creating && (
          <CreateGroupDialog
            onClose={() => setCreating(false)}
            onCreated={(groupId) => {
              setCreating(false)
              setOpenGroup(groupId)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function GroupCard({
  group,
  meId,
  open,
  onToggle,
}: {
  group: Group
  meId: string
  open: boolean
  onToggle: () => void
}) {
  const contributeToGroup = useApp((s) => s.contributeToGroup)
  const updateGroupGoal = useApp((s) => s.updateGroupGoal)
  const removeGroupMember = useApp((s) => s.removeGroupMember)
  const leaveGroup = useApp((s) => s.leaveGroup)
  const pushToast = useApp((s) => s.pushToast)

  const me = group.members.find((m) => m.id === meId)
  const isAdmin = me?.role === 'admin'
  const total = groupTotal(group)
  const ratio = Math.min(1, total / group.targetAmount)
  const month = monthKey(new Date())
  const tone = TONE[group.tone]

  const [amount, setAmount] = useState(20)
  const [editing, setEditing] = useState(false)
  const [draftTarget, setDraftTarget] = useState(group.targetAmount)
  const [draftLabel, setDraftLabel] = useState(group.goalLabel)

  return (
    <Card>
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-3 px-5 py-4 text-left">
        <span className={clsx('grid size-11 shrink-0 place-items-center rounded-xl', tone.bg, tone.deep)}>
          <Icon name={group.icon} size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate font-display text-[1.05rem] leading-tight text-ink">{group.name}</span>
            {isAdmin && <span className="chip bg-orchid-soft text-[0.65rem] text-orchid-deep">Admin</span>}
          </span>
          <span className="block truncate text-[0.78rem] text-ink-muted">
            {group.goalLabel} · {group.members.length} membres
          </span>
        </span>
        <span className="tabular shrink-0 text-right">
          <span className={clsx('block font-display text-lg leading-none', tone.text)}>{euro(total)}</span>
          <span className="block text-[0.7rem] text-ink-muted">sur {euro(group.targetAmount)}</span>
        </span>
        <Icon name={open ? 'ChevronDown' : 'ChevronRight'} size={16} className="ml-1 shrink-0 text-ink-muted" />
      </button>

      <div className="px-5 pb-2">
        <Progress value={ratio} tone={group.tone} height={7} label={`Avancement de ${group.name}`} />
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-line px-5 py-4">
              {/* Membres et leurs parts */}
              <ul className="flex flex-col gap-2">
                {group.members.map((member) => (
                  <li key={member.id} className="flex items-center gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-[0.75rem] font-bold text-on-accent">
                      {member.displayName.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-[0.85rem] font-medium text-ink">
                        {member.displayName}
                        {member.role === 'admin' && <Icon name="Crown" size={12} className="text-amber" />}
                        {member.id === meId && <span className="text-[0.7rem] text-ink-muted">(vous)</span>}
                      </span>
                      <span className="block text-[0.7rem] text-ink-muted">@{member.pseudo}</span>
                    </span>
                    <span className="tabular text-[0.85rem] font-semibold text-ink">
                      {euro(memberTotal(member.contributions))}
                    </span>
                    {isAdmin && member.id !== meId && (
                      <button
                        type="button"
                        onClick={() => {
                          removeGroupMember(group.id, member.id)
                          pushToast({ title: 'Membre retiré', detail: member.displayName, tone: 'berry', icon: 'X' })
                        }}
                        aria-label={`Retirer ${member.displayName}`}
                        className="grid size-7 place-items-center rounded-lg text-ink-muted transition hover:bg-berry-soft hover:text-berry-deep"
                      >
                        <Icon name="X" size={13} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>

              {/* Mon versement du mois */}
              {me && (
                <form
                  className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-surface-2 p-3"
                  onSubmit={(event) => {
                    event.preventDefault()
                    if (amount <= 0) return
                    burst(event.currentTarget, [group.tone === 'brand' ? 'indigo' : group.tone, 'amber'])
                    contributeToGroup(group.id, month, amount)
                    pushToast({ title: `+${euro(amount)} au pot`, detail: group.name, tone: group.tone === 'brand' ? 'indigo' : group.tone, icon: 'PiggyBank' })
                  }}
                >
                  <span className="text-[0.82rem] font-medium text-ink">Verser ma part de {monthLabel(month).split(' ')[0]} :</span>
                  <span className="relative">
                    <input
                      type="number"
                      min={1}
                      value={amount || ''}
                      onChange={(event) => setAmount(Math.max(0, Number(event.target.value)))}
                      className="tabular w-24 rounded-xl border border-line bg-surface px-3 py-2 pr-7 text-right text-[0.9rem] text-ink outline-none focus:border-brand"
                      aria-label="Montant du versement"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-[0.8rem] text-ink-muted">€</span>
                  </span>
                  <Button type="submit" icon="PiggyBank">
                    Verser
                  </Button>
                  <span className="tabular w-full text-[0.72rem] text-ink-muted sm:ml-auto sm:w-auto">
                    Déjà versé ce mois : {euro(me.contributions[month] ?? 0)}
                  </span>
                </form>
              )}

              {/* Zone d'administration */}
              {isAdmin ? (
                <div className="mt-4 rounded-xl border border-line p-3">
                  <p className="flex items-center gap-1.5 text-[0.78rem] font-semibold text-ink">
                    <Icon name="Settings" size={13} />
                    Réglages du groupe
                  </p>
                  {editing ? (
                    <form
                      className="mt-2 flex flex-wrap items-center gap-2"
                      onSubmit={(event) => {
                        event.preventDefault()
                        updateGroupGoal(group.id, { goalLabel: draftLabel.trim() || group.goalLabel, targetAmount: Math.max(1, draftTarget) })
                        setEditing(false)
                        pushToast({ title: 'Objectif mis à jour', detail: group.name, tone: 'mint', icon: 'Check' })
                      }}
                    >
                      <input
                        value={draftLabel}
                        onChange={(event) => setDraftLabel(event.target.value)}
                        className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-[0.85rem] text-ink outline-none focus:border-brand"
                        aria-label="Intitulé de l'objectif"
                      />
                      <span className="relative">
                        <input
                          type="number"
                          min={1}
                          value={draftTarget || ''}
                          onChange={(event) => setDraftTarget(Math.max(0, Number(event.target.value)))}
                          className="tabular w-28 rounded-xl border border-line bg-surface px-3 py-2 pr-7 text-right text-[0.85rem] text-ink outline-none focus:border-brand"
                          aria-label="Montant visé"
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-[0.8rem] text-ink-muted">€</span>
                      </span>
                      <Button type="submit" icon="Check">
                        Enregistrer
                      </Button>
                    </form>
                  ) : (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[0.8rem] text-ink-soft">
                      <span className="min-w-0 flex-1">
                        {group.goalLabel} — {euro(group.targetAmount)} pour {monthLabel(group.deadline)}
                      </span>
                      <button type="button" onClick={() => setEditing(true)} className="chip border border-line bg-surface text-ink-muted transition hover:text-ink">
                        <Icon name="PenLine" size={12} />
                        Modifier l'objectif
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 flex items-center justify-between gap-2">
                  <p className="text-[0.72rem] text-ink-muted">
                    Échéance {monthLabel(group.deadline)} · géré par{' '}
                    {group.members.find((m) => m.role === 'admin')?.displayName ?? '—'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      leaveGroup(group.id)
                      pushToast({ title: 'Groupe quitté', detail: group.name, tone: 'indigo', icon: 'LogOut' })
                    }}
                    className="chip border border-line bg-surface text-ink-muted transition hover:text-berry-deep"
                  >
                    <Icon name="LogOut" size={12} />
                    Quitter
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

/**
 * Création d'un groupe : le nom, l'objectif commun choisi au catalogue, le
 * montant, l'échéance, et les amis à embarquer. La personne qui crée devient
 * administratrice.
 */
function CreateGroupDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (groupId: string) => void }) {
  const profile = useApp((s) => s.profile)
  const friends = useApp((s) => s.friends)
  const createGroup = useApp((s) => s.createGroup)

  const [name, setName] = useState('')
  const [kind, setKind] = useState(GOAL_CATALOG[2].kind)
  const [target, setTarget] = useState(GOAL_CATALOG[2].suggestedAmount ?? 1000)
  const [months, setMonths] = useState(12)
  const [invited, setInvited] = useState<string[]>([])

  const entry = GOAL_CATALOG.find((g) => g.kind === kind)!
  const amis = friends.filter((f) => f.status === 'ami')

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-[rgb(0_0_0/0.45)] p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="card max-h-[88dvh] w-full max-w-lg overflow-y-auto p-6"
        initial={{ scale: 0.95, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0 }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Créer un groupe"
      >
        <h2 className="font-display text-2xl text-ink">Créer un groupe</h2>

        <label className="mt-5 block">
          <span className="text-[0.85rem] font-semibold text-ink">Son nom</span>
          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Colocs, famille, meilleurs amis…"
            className="mt-1.5 w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-[0.9rem] text-ink outline-none focus:border-brand"
          />
        </label>

        <p className="mt-4 text-[0.85rem] font-semibold text-ink">L'objectif commun</p>
        <div className="mt-2 grid max-h-48 grid-cols-2 gap-2 overflow-y-auto pr-1">
          {GOAL_CATALOG.map((item) => (
            <button
              key={item.kind}
              type="button"
              onClick={() => {
                setKind(item.kind)
                if (item.suggestedAmount) setTarget(item.suggestedAmount)
                setMonths(item.suggestedMonths)
              }}
              className={clsx(
                'flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-[0.82rem] transition',
                kind === item.kind ? 'border-brand bg-brand-soft text-brand-deep' : 'border-line bg-surface text-ink-soft hover:border-line-strong',
              )}
            >
              <Icon name={item.icon} size={15} className="shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[0.85rem] font-semibold text-ink">Montant visé</span>
            <span className="relative mt-1.5 block">
              <input
                type="number"
                min={1}
                value={target || ''}
                onChange={(event) => setTarget(Math.max(0, Number(event.target.value)))}
                className="tabular w-full rounded-xl border border-line bg-surface px-4 py-2.5 pr-8 text-right text-[0.9rem] text-ink outline-none focus:border-brand"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-[0.85rem] text-ink-muted">€</span>
            </span>
          </label>
          <label className="block">
            <span className="text-[0.85rem] font-semibold text-ink">Échéance</span>
            <select
              value={months}
              onChange={(event) => setMonths(Number(event.target.value))}
              className="mt-1.5 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[0.9rem] text-ink outline-none focus:border-brand"
            >
              {[3, 6, 9, 12, 18, 24, 36].map((m) => (
                <option key={m} value={m}>
                  {monthLabel(addMonths(monthKey(new Date()), m))}
                </option>
              ))}
            </select>
          </label>
        </div>

        {amis.length > 0 && (
          <>
            <p className="mt-4 text-[0.85rem] font-semibold text-ink">Qui embarque ?</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {amis.map((friend) => {
                const active = invited.includes(friend.id)
                return (
                  <button
                    key={friend.id}
                    type="button"
                    onClick={() =>
                      setInvited((list) => (active ? list.filter((id) => id !== friend.id) : [...list, friend.id]))
                    }
                    aria-pressed={active}
                    className={clsx(
                      'chip border transition',
                      active ? 'border-brand/40 bg-brand-soft text-brand-deep' : 'border-line bg-surface text-ink-muted hover:text-ink',
                    )}
                  >
                    @{friend.pseudo}
                  </button>
                )
              })}
            </div>
          </>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button
            icon="Users"
            disabled={!name.trim() || target <= 0}
            onClick={() => {
              const groupId = newId('grp')
              createGroup({
                id: groupId,
                name: name.trim(),
                icon: entry.icon,
                tone: 'indigo',
                goalKind: kind,
                goalLabel: entry.label,
                targetAmount: Math.round(target),
                deadline: addMonths(monthKey(new Date()), months),
                createdAt: new Date().toISOString(),
                members: [
                  {
                    id: profile.id,
                    pseudo: profile.pseudo,
                    displayName: profile.displayName,
                    role: 'admin',
                    contributions: {},
                  },
                  ...friends
                    .filter((f) => invited.includes(f.id))
                    .map((f) => ({
                      id: f.id,
                      pseudo: f.pseudo,
                      displayName: f.displayName,
                      role: 'membre' as const,
                      contributions: {},
                    })),
                ],
              })
              onCreated(groupId)
            }}
          >
            Créer le groupe
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
