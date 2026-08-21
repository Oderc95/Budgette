import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  ChallengeProgress,
  Goal,
  MonthBudget,
  MonthKey,
  Profile,
  SavingsPocket,
  UnlockedBadge,
} from '../domain/types'
import {
  MOCK_BUDGETS,
  MOCK_CHALLENGE_PROGRESS,
  MOCK_GOALS,
  MOCK_POCKETS,
  MOCK_PROFILE,
  MOCK_UNLOCKED,
} from '../data/mock'
import { CHALLENGE_BY_ID } from '../domain/challenges'
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
  tone: 'sage' | 'gold' | 'clay' | 'sky' | 'plum'
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
  addGoal: (goal: Goal) => void
  removeGoal: (goalId: string) => void
  contributeToPocket: (pocketId: string, month: MonthKey, amount: number) => void
  addPocket: (pocket: SavingsPocket) => void
  grantXp: (amount: number, reason: string) => void
  pushToast: (toast: Omit<Toast, 'id'>) => void
  dismissToast: (id: number) => void
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
              const lines = budget.lines.filter((l) => l.categoryId !== categoryId)
              if (amount > 0) lines.push({ categoryId, amount })
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

      addGoal: (goal) => set((state) => ({ goals: [...state.goals, goal] })),
      removeGoal: (goalId) => set((state) => ({ goals: state.goals.filter((g) => g.id !== goalId) })),

      addPocket: (pocket) => set((state) => ({ pockets: [...state.pockets, pocket] })),

      contributeToPocket: (pocketId, month, amount) =>
        set((state) => ({
          pockets: state.pockets.map((pocket) =>
            pocket.id === pocketId
              ? {
                  ...pocket,
                  contributions: { ...pocket.contributions, [month]: (pocket.contributions[month] ?? 0) + amount },
                }
              : pocket,
          ),
        })),

      grantXp: (amount, reason) => {
        set((state) => ({ profile: { ...state.profile, xp: state.profile.xp + amount } }))
        get().pushToast({ title: `+${amount} XP`, detail: reason, tone: 'gold', icon: 'Sparkles' })
      },

      pushToast: (toast) => {
        toastId += 1
        const id = toastId
        set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }))
        window.setTimeout(() => get().dismissToast(id), 4200)
      },

      dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

      resetDemo: () => set({ ...initial(), authenticated: true }),
    }),
    {
      name: 'budgette-demo',
      storage: safeStorage,
      // La session et les notifications ne sont jamais persistées.
      partialize: ({ toasts: _toasts, authenticated: _auth, ...rest }) => rest,
      version: 1,
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
