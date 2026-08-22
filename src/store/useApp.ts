import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  ChallengeProgress,
  Friend,
  Goal,
  Group,
  MonthBudget,
  MonthKey,
  Profile,
  SavingsPocket,
  Tag,
  UnlockedBadge,
} from '../domain/types'
import {
  MOCK_BUDGETS,
  MOCK_CHALLENGE_PROGRESS,
  MOCK_FRIENDS,
  MOCK_GOALS,
  MOCK_GROUPS,
  MOCK_POCKETS,
  MOCK_PROFILE,
  MOCK_TAGS,
  MOCK_UNLOCKED,
} from '../data/mock'
import { CHALLENGE_BY_ID } from '../domain/challenges'
import { pocketCategoryId } from '../domain/budget'
import { dayKey, monthKey, weekKey } from '../lib/format'
import { streakMultiplier } from '../domain/gamification'

export type ThemeChoice = 'system' | 'light' | 'dark'

/** Période courante d'un défi, selon sa cadence. */
export function periodFor(cadence: string, now = new Date()): string {
  switch (cadence) {
    case 'daily':
      return dayKey(now)
    case 'weekly':
      return weekKey(now)
    case 'monthly':
      return monthKey(now)
    default:
      return String(now.getFullYear())
  }
}

interface Toast {
  id: number
  title: string
  detail?: string
  tone: 'mint' | 'amber' | 'berry' | 'indigo' | 'orchid'
  icon?: string
}

interface AppState {
  /** Phase 1 : session simulée. Elle sera remplacée par Supabase Auth. */
  authenticated: boolean
  onboarded: boolean
  profile: Profile
  budgets: MonthBudget[]
  pockets: SavingsPocket[]
  goals: Goal[]
  unlocked: UnlockedBadge[]
  challengeProgress: ChallengeProgress[]
  theme: ThemeChoice
  toasts: Toast[]
  /** Mois affiché dans les écrans de saisie et de synthèse. */
  activeMonth: MonthKey
  /** Visite guidée : montrée une seule fois, à la première arrivée. */
  tourDone: boolean
  /** Après la visite : proposer de définir son objectif, une seule fois. */
  goalPromptPending: boolean
  /** Étiquettes libres, collées sur des lignes de saisie. */
  tags: Tag[]
  /**
   * Mois de comparaison de la saisie : ce qui y figure est « attendu » le mois
   * suivant, sauf lignes ponctuelles et catégories retirées depuis.
   */
  referenceMonth: MonthKey | null
  /** Catégories déclarées « plus d'actualité », et depuis quel mois. */
  retired: Record<string, MonthKey>
  friends: Friend[]
  groups: Group[]

  signIn: () => void
  signOut: () => void
  completeOnboarding: (input: { strategyId: string; goal: Goal; displayName?: string }) => void
  setTheme: (theme: ThemeChoice) => void
  setActiveMonth: (month: MonthKey) => void
  setLine: (month: MonthKey, categoryId: string, amount: number) => void
  ensureMonth: (month: MonthKey) => void
  closeMonth: (month: MonthKey, mood: 1 | 2 | 3 | 4 | 5, note?: string) => void
  reopenMonth: (month: MonthKey) => void
  toggleChallenge: (challengeId: string) => void
  setStrategy: (strategyId: string) => void
  addGoal: (goal: Goal) => void
  removeGoal: (goalId: string) => void
  contributeToPocket: (pocketId: string, month: MonthKey, amount: number) => void
  addPocket: (pocket: SavingsPocket) => void
  addTag: (tag: Tag) => void
  setLineDetails: (
    month: MonthKey,
    categoryId: string,
    details: { tagIds?: string[]; oneOff?: boolean },
  ) => void
  setReferenceMonth: (month: MonthKey | null) => void
  retireCategory: (categoryId: string, month: MonthKey) => void
  restoreCategory: (categoryId: string) => void
  requestFriend: (friend: Friend) => void
  acceptFriend: (friendId: string) => void
  createGroup: (group: Group) => void
  updateGroupGoal: (
    groupId: string,
    patch: Partial<Pick<Group, 'name' | 'goalKind' | 'goalLabel' | 'targetAmount' | 'deadline' | 'icon' | 'tone'>>,
  ) => void
  removeGroupMember: (groupId: string, memberId: string) => void
  leaveGroup: (groupId: string) => void
  contributeToGroup: (groupId: string, month: MonthKey, amount: number) => void
  dismissGoalPrompt: () => void
  grantXp: (amount: number, reason: string) => void
  pushToast: (toast: Omit<Toast, 'id'>) => void
  dismissToast: (id: number) => void
  completeTour: () => void
  resetDemo: () => void
}

const initial = () => ({
  authenticated: false,
  onboarded: true,
  profile: MOCK_PROFILE,
  budgets: MOCK_BUDGETS,
  pockets: MOCK_POCKETS,
  goals: MOCK_GOALS,
  unlocked: MOCK_UNLOCKED,
  challengeProgress: MOCK_CHALLENGE_PROGRESS as ChallengeProgress[],
  theme: 'system' as ThemeChoice,
  toasts: [] as Toast[],
  activeMonth: latestMonth(MOCK_BUDGETS),
  tourDone: false,
  goalPromptPending: false,
  tags: MOCK_TAGS,
  // Le dernier mois clôturé du jeu de démonstration sert de référence.
  referenceMonth: '2026-07' as MonthKey | null,
  retired: {} as Record<string, MonthKey>,
  friends: MOCK_FRIENDS,
  groups: MOCK_GROUPS,
})

function latestMonth(budgets: MonthBudget[]): MonthKey {
  const live = monthKey(new Date())
  return budgets.some((b) => b.month === live)
    ? live
    : (budgets[budgets.length - 1]?.month ?? live)
}

let toastId = 0

/**
 * Stockage tolérant aux pannes : en navigation privée ou en aperçu, l'accès à
 * `localStorage` peut lever une exception. L'app doit alors fonctionner
 * normalement, simplement sans persistance.
 */
const safeStorage = createJSONStorage(() => {
  try {
    const probe = '__budgette__'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return window.localStorage
  } catch {
    const memory = new Map<string, string>()
    return {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => void memory.set(key, value),
      removeItem: (key: string) => void memory.delete(key),
    }
  }
})

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      ...initial(),

      signIn: () => set({ authenticated: true }),
      signOut: () => set({ authenticated: false }),

      completeOnboarding: ({ strategyId, goal, displayName }) =>
        set((state) => ({
          onboarded: true,
          authenticated: true,
          goals: [goal, ...state.goals.filter((g) => g.id !== goal.id)],
          profile: {
            ...state.profile,
            strategyId,
            displayName: displayName?.trim() || state.profile.displayName,
          },
        })),

      setTheme: (theme) => set({ theme }),
      setActiveMonth: (activeMonth) => set({ activeMonth }),

      ensureMonth: (month) =>
        set((state) =>
          state.budgets.some((b) => b.month === month)
            ? state
            : {
                budgets: [...state.budgets, { month, lines: [], closed: false }].sort((a, b) =>
                  a.month.localeCompare(b.month),
                ),
              },
        ),

      setLine: (month, categoryId, amount) =>
        set((state) => {
          const budgets = state.budgets.some((b) => b.month === month)
            ? state.budgets
            : [...state.budgets, { month, lines: [], closed: false }].sort((a, b) =>
                a.month.localeCompare(b.month),
              )

          return {
            budgets: budgets.map((budget) => {
              if (budget.month !== month || budget.closed) return budget
              // Le montant change, mais les étiquettes, la note et le
              // caractère ponctuel de la ligne survivent à la modification.
              const existing = budget.lines.find((l) => l.categoryId === categoryId)
              const lines = budget.lines.filter((l) => l.categoryId !== categoryId)
              if (amount > 0) lines.push({ ...existing, categoryId, amount })
              return { ...budget, lines }
            }),
          }
        }),

      closeMonth: (month, mood, note) => {
        const budget = get().budgets.find((b) => b.month === month)
        if (!budget || budget.closed) return
        set((state) => ({
          budgets: state.budgets.map((b) =>
            b.month === month ? { ...b, closed: true, closedAt: new Date().toISOString(), mood, note } : b,
          ),
          // Le mois qu'on vient de clôturer devient la nouvelle référence :
          // c'est lui qui dira ce qui est attendu le mois prochain.
          referenceMonth: month,
        }))
        get().grantXp(CHALLENGE_BY_ID.m_close.xp, 'Mois clôturé')
      },

      reopenMonth: (month) =>
        set((state) => ({
          budgets: state.budgets.map((b) =>
            b.month === month ? { ...b, closed: false, closedAt: undefined } : b,
          ),
        })),

      toggleChallenge: (challengeId) => {
        const challenge = CHALLENGE_BY_ID[challengeId]
        if (!challenge) return
        const period = periodFor(challenge.cadence)
        const existing = get().challengeProgress.find(
          (p) => p.challengeId === challengeId && p.period === period,
        )
        const nowCompleted = !existing?.completed

        set((state) => {
          const others = state.challengeProgress.filter(
            (p) => !(p.challengeId === challengeId && p.period === period),
          )
          return {
            challengeProgress: [
              ...others,
              {
                challengeId,
                period,
                value: nowCompleted ? challenge.target : 0,
                completed: nowCompleted,
                completedAt: nowCompleted ? new Date().toISOString() : undefined,
              },
            ],
          }
        })

        if (nowCompleted) {
          const multiplier = streakMultiplier(get().profile.streak.current)
          get().grantXp(Math.round(challenge.xp * multiplier), challenge.title)
        } else {
          set((state) => ({
            profile: { ...state.profile, xp: Math.max(0, state.profile.xp - challenge.xp) },
          }))
        }
      },

      setStrategy: (strategyId) =>
        set((state) => ({ profile: { ...state.profile, strategyId } })),

      addGoal: (goal) => set((state) => ({ goals: [...state.goals, goal] })),
      removeGoal: (goalId) => set((state) => ({ goals: state.goals.filter((g) => g.id !== goalId) })),

      addPocket: (pocket) => set((state) => ({ pockets: [...state.pockets, pocket] })),

      // Verser dans une poche, c'est écrire la ligne d'épargne du mois :
      // l'écran Objectifs et l'écran de saisie regardent le même chiffre.
      contributeToPocket: (pocketId, month, amount) => {
        const categoryId = pocketCategoryId(pocketId)
        const budget = get().budgets.find((b) => b.month === month)
        const current = budget?.lines.find((l) => l.categoryId === categoryId)?.amount ?? 0
        get().setLine(month, categoryId, current + amount)
      },

      grantXp: (amount, reason) => {
        set((state) => ({ profile: { ...state.profile, xp: state.profile.xp + amount } }))
        get().pushToast({ title: `+${amount} XP`, detail: reason, tone: 'amber', icon: 'Sparkles' })
      },

      pushToast: (toast) => {
        toastId += 1
        const id = toastId
        set((state) => {
          // Une notification identique déjà visible est remplacée plutôt
          // qu'empilée : cliquer cinq fois sur une stratégie ne doit pas
          // produire cinq bandeaux superposés.
          const others = state.toasts.filter((t) => !(t.title === toast.title && t.detail === toast.detail))
          return { toasts: [...others, { ...toast, id }].slice(-3) }
        })
        window.setTimeout(() => get().dismissToast(id), 4600)
      },

      dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

      addTag: (tag) => set((state) => ({ tags: [...state.tags, tag] })),

      setLineDetails: (month, categoryId, details) =>
        set((state) => ({
          budgets: state.budgets.map((budget) => {
            if (budget.month !== month) return budget
            return {
              ...budget,
              lines: budget.lines.map((line) =>
                line.categoryId === categoryId ? { ...line, ...details } : line,
              ),
            }
          }),
        })),

      setReferenceMonth: (month) => set({ referenceMonth: month }),

      retireCategory: (categoryId, month) =>
        set((state) => ({ retired: { ...state.retired, [categoryId]: month } })),

      restoreCategory: (categoryId) =>
        set((state) => {
          const { [categoryId]: _removed, ...rest } = state.retired
          return { retired: rest }
        }),

      requestFriend: (friend) =>
        set((state) =>
          state.friends.some((f) => f.id === friend.id)
            ? state
            : { friends: [...state.friends, { ...friend, status: 'demande_envoyee' }] },
        ),

      acceptFriend: (friendId) =>
        set((state) => ({
          friends: state.friends.map((f) => (f.id === friendId ? { ...f, status: 'ami' } : f)),
        })),

      createGroup: (group) => {
        set((state) => ({ groups: [...state.groups, group] }))
        get().pushToast({ title: 'Groupe créé !', detail: group.name, tone: 'indigo', icon: 'Users' })
      },

      updateGroupGoal: (groupId, patch) =>
        set((state) => ({
          groups: state.groups.map((g) => (g.id === groupId ? { ...g, ...patch } : g)),
        })),

      removeGroupMember: (groupId, memberId) =>
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId ? { ...g, members: g.members.filter((m) => m.id !== memberId) } : g,
          ),
        })),

      leaveGroup: (groupId) =>
        set((state) => ({ groups: state.groups.filter((g) => g.id !== groupId) })),

      contributeToGroup: (groupId, month, amount) =>
        set((state) => ({
          groups: state.groups.map((group) => {
            if (group.id !== groupId) return group
            return {
              ...group,
              members: group.members.map((member) =>
                member.id === state.profile.id
                  ? {
                      ...member,
                      contributions: {
                        ...member.contributions,
                        [month]: (member.contributions[month] ?? 0) + amount,
                      },
                    }
                  : member,
              ),
            }
          }),
        })),

      dismissGoalPrompt: () => set({ goalPromptPending: false }),

      // La fin de la visite enchaîne sur la définition de l'objectif.
      completeTour: () => set({ tourDone: true, goalPromptPending: true }),

      resetDemo: () => set({ ...initial(), authenticated: true }),
    }),
    {
      name: 'budgette-demo',
      storage: safeStorage,
      // La session et les notifications ne sont jamais persistées.
      partialize: ({ toasts: _toasts, authenticated: _auth, ...rest }) => rest,
      /*
       * Un état persisté d'une version antérieure est jeté, pas raccommodé :
       * ce sont des données de démonstration, et les garder ferait cohabiter
       * l'ancien profil avec le nouveau jeu. La v3 introduit les étiquettes, les
       * groupes et le mois de référence.
       */
      version: 3,
      migrate: () => ({ ...initial() }),
    },
  ),
)

/* ----------------------------- Sélecteurs ------------------------------ */

export function useBudget(month: MonthKey): MonthBudget | undefined {
  return useApp((s) => s.budgets.find((b) => b.month === month))
}

export function useChallengeState(challengeId: string): ChallengeProgress | undefined {
  const challenge = CHALLENGE_BY_ID[challengeId]
  const period = challenge ? periodFor(challenge.cadence) : ''
  return useApp((s) => s.challengeProgress.find((p) => p.challengeId === challengeId && p.period === period))
}
