import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  ChallengeCadence,
  ChallengeProgress,
  Friend,
  Goal,
  Group,
  MonthBudget,
  MonthKey,
  PlannedItem,
  Profile,
  SavingsPocket,
  Tag,
  UnlockedBadge,
} from '../domain/types'
import { lineKey } from '../domain/types'
import {
  MOCK_BUDGETS,
  MOCK_CHALLENGE_PROGRESS,
  MOCK_FRIENDS,
  MOCK_GOALS,
  MOCK_GROUPS,
  MOCK_POCKETS,
  MOCK_PLANNED,
  MOCK_PROFILE,
  MOCK_TAGS,
  MOCK_UNLOCKED,
} from '../data/mock'
import { CHALLENGES, estReussie, mesurer } from '../domain/challenges'
import { pocketCategoryId } from '../domain/budget'
import { CATEGORY_BY_ID } from '../domain/categories'
import { addMonths, monthKey } from '../lib/format'

export type ThemeChoice = 'system' | 'light' | 'dark'

/** Période courante d'un défi, selon sa cadence. */
/** Période à laquelle une quête est rattachée, pour le mois affiché. */
export function periodFor(cadence: ChallengeCadence, month: MonthKey): string {
  switch (cadence) {
    case 'unique':
      return 'once'
    case 'monthly':
      return month
    default:
      return month.slice(0, 4)
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
  /** Charges, dettes et versements définis à l'avance au calendrier. */
  planned: PlannedItem[]

  signIn: () => void
  /** Compte neuf et vide, qui passe par le questionnaire d'arrivée. */
  signUp: () => void
  signOut: () => void
  completeOnboarding: (input: { strategyId: string; goal: Goal | null; displayName?: string }) => void
  setDisplayName: (displayName: string) => void
  setTheme: (theme: ThemeChoice) => void
  setActiveMonth: (month: MonthKey) => void
  setLine: (month: MonthKey, categoryId: string, amount: number, key?: string) => void
  addExtraLine: (month: MonthKey, categoryId: string, label?: string, amount?: number) => void
  removeLine: (month: MonthKey, key: string) => void
  ensureMonth: (month: MonthKey) => void
  closeMonth: (month: MonthKey, mood: 1 | 2 | 3 | 4 | 5, note?: string) => void
  reopenMonth: (month: MonthKey) => void
  /**
   * Recalcule les quêtes depuis les données et crédite celles qui viennent
   * d'être réussies. Rejouable sans effet de bord : le registre des quêtes
   * déjà créditées empêche de payer deux fois.
   */
  syncQuetes: () => void
  setStrategy: (strategyId: string) => void
  addGoal: (goal: Goal) => void
  removeGoal: (goalId: string) => void
  contributeToPocket: (pocketId: string, month: MonthKey, amount: number) => void
  addPocket: (pocket: SavingsPocket) => void
  addTag: (tag: Tag) => void
  setLineDetails: (
    month: MonthKey,
    key: string,
    details: { tagIds?: string[]; oneOff?: boolean; label?: string; paid?: boolean },
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
  addPlanned: (item: PlannedItem) => void
  removePlanned: (id: string) => void
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
  tags: MOCK_TAGS,
  // Le dernier mois clôturé du jeu de démonstration sert de référence.
  referenceMonth: '2026-07' as MonthKey | null,
  retired: {} as Record<string, MonthKey>,
  friends: MOCK_FRIENDS,
  groups: MOCK_GROUPS,
  planned: MOCK_PLANNED,
})

/**
 * Compte neuf.
 *
 * `initial()` porte le jeu de démonstration : douze mois saisis, des badges
 * déjà décrochés, un objectif en cours. Utile pour montrer l'application
 * remplie, inutilisable pour juger l'arrivée d'une personne qui n'a rien.
 * Cette fonction produit l'autre extrémité : un compte vide, sur le mois
 * courant, sans nom ni objectif.
 */
function vierge() {
  const mois = monthKey(new Date())
  return {
    ...initial(),
    onboarded: false,
    profile: {
      ...MOCK_PROFILE,
      id: 'usr_nouveau',
      pseudo: '',
      displayName: '',
      email: '',
      role: 'user' as const,
      createdAt: new Date().toISOString(),
      xp: 0,
      streak: { current: 0, best: 0 },
    },
    budgets: [{ month: mois, lines: [], closed: false }] as MonthBudget[],
    goals: [] as Goal[],
    unlocked: [] as UnlockedBadge[],
    challengeProgress: [] as ChallengeProgress[],
    pockets: [] as SavingsPocket[],
    planned: [] as PlannedItem[],
    friends: [] as Friend[],
    groups: [] as Group[],
    activeMonth: mois,
    referenceMonth: null as MonthKey | null,
  }
}

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
      signUp: () => set({ ...vierge(), authenticated: true }),
      signOut: () => set({ authenticated: false }),

      completeOnboarding: ({ strategyId, goal, displayName }) =>
        set((state) => ({
          onboarded: true,
          authenticated: true,
          // Sans objectif, la liste reste vide : la section Objectifs porte
          // alors une pastille, plutôt que de bloquer l'entrée dans l'app.
          goals: goal ? [goal, ...state.goals.filter((g) => g.id !== goal.id)] : state.goals,
          profile: {
            ...state.profile,
            strategyId,
            displayName: displayName?.trim() || state.profile.displayName,
          },
        })),

      setDisplayName: (displayName) =>
        set((state) => ({ profile: { ...state.profile, displayName: displayName.trim() } })),

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

      setLine: (month, categoryId, amount, key) =>
        set((state) => {
          const budgets = state.budgets.some((b) => b.month === month)
            ? state.budgets
            : [...state.budgets, { month, lines: [], closed: false }].sort((a, b) =>
                a.month.localeCompare(b.month),
              )

          const cible = key ?? categoryId
          return {
            budgets: budgets.map((budget) => {
              if (budget.month !== month || budget.closed) return budget
              // Le montant change, mais les étiquettes, l'intitulé et le
              // caractère ponctuel de la ligne survivent à la modification.
              const existing = budget.lines.find((l) => lineKey(l) === cible)
              const lines = budget.lines.filter((l) => lineKey(l) !== cible)
              if (amount > 0) lines.push({ ...existing, categoryId, key, amount })
              return { ...budget, lines }
            }),
          }
        }),

      // Une ligne supplémentaire sous une catégorie déjà servie : elle reçoit
      // sa propre clé et, souvent, son propre intitulé.
      addExtraLine: (month, categoryId, label, amount = 0) => {
        get().ensureMonth(month)
        set((state) => ({
          budgets: state.budgets.map((budget) => {
            if (budget.month !== month || budget.closed) return budget
            const existants = budget.lines.filter((l) => l.categoryId === categoryId).length
            const key = `${categoryId}~${Date.now().toString(36)}${existants}`
            return { ...budget, lines: [...budget.lines, { categoryId, key, label, amount }] }
          }),
        }))
      },

      removeLine: (month, key) =>
        set((state) => ({
          budgets: state.budgets.map((budget) =>
            budget.month !== month || budget.closed
              ? budget
              : { ...budget, lines: budget.lines.filter((l) => lineKey(l) !== key) },
          ),
        })),

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
        // Le reste de fin de mois se reporte en tête des revenus du mois
        // suivant : l'argent qui n'a pas été dépensé n'a pas disparu.
        const totals = budget.lines.reduce(
          (acc, line) => {
            const category = CATEGORY_BY_ID[line.categoryId]
            if (category) acc[category.flow] = (acc[category.flow] ?? 0) + line.amount
            return acc
          },
          {} as Record<string, number>,
        )
        const reste =
          (totals.income ?? 0) - (totals.fixed ?? 0) - (totals.debt ?? 0) - (totals.saving ?? 0) - (totals.discretionary ?? 0)
        if (reste > 0) {
          const suivant = addMonths(month, 1)
          get().ensureMonth(suivant)
          get().setLine(suivant, 'inc_carryover', Math.round(reste))
        }
        get().syncQuetes()
      },

      reopenMonth: (month) =>
        set((state) => ({
          budgets: state.budgets.map((b) =>
            b.month === month ? { ...b, closed: false, closedAt: undefined } : b,
          ),
        })),

      syncQuetes: () => {
        const state = get()
        const { budgets, pockets, goals } = state

        /*
         * Périodes à examiner. Une quête ponctuelle ne se joue qu'une fois ;
         * une quête mensuelle se rejoue à chaque mois saisi ; une quête
         * annuelle, à chaque année représentée. On ne parcourt que ce qui
         * existe : un compte neuf ne fait donc presque rien ici.
         */
        const mois = budgets.map((b) => b.month).sort()
        const annees = [...new Set(mois.map((m) => m.slice(0, 4)))]

        const nouvelles: { challengeId: string; period: string; xp: number; titre: string }[] = []

        for (const challenge of CHALLENGES) {
          const periodes =
            challenge.cadence === 'unique'
              ? ['once']
              : challenge.cadence === 'monthly'
                ? mois
                : annees

          for (const period of periodes) {
            const dejaCredite = state.challengeProgress.some(
              (p) => p.challengeId === challenge.id && p.period === period && p.completed,
            )
            if (dejaCredite) continue

            // Le mois de mesure : la période elle-même pour une quête
            // mensuelle, le premier mois de l'année pour une quête annuelle,
            // le mois courant pour une quête ponctuelle.
            const moisMesure =
              challenge.cadence === 'monthly'
                ? period
                : challenge.cadence === 'yearly'
                  ? (mois.find((m) => m.startsWith(period)) ?? state.activeMonth)
                  : state.activeMonth

            const ctx = { budgets, month: moisMesure, pockets, goals }
            if (estReussie(challenge, mesurer(challenge, ctx), ctx)) {
              nouvelles.push({
                challengeId: challenge.id,
                period,
                xp: challenge.xp,
                titre: challenge.title,
              })
            }
          }
        }

        if (nouvelles.length === 0) return

        const gain = nouvelles.reduce((total, n) => total + n.xp, 0)
        set((current) => ({
          challengeProgress: [
            ...current.challengeProgress,
            ...nouvelles.map((n) => ({
              challengeId: n.challengeId,
              period: n.period,
              value: 1,
              completed: true,
              completedAt: new Date().toISOString(),
            })),
          ],
          profile: { ...current.profile, xp: current.profile.xp + gain },
          /*
           * Une seule notification, même quand plusieurs quêtes tombent
           * ensemble : la première saisie en valide quatre d'un coup, et
           * quatre bulles empilées noieraient le message.
           */
          toasts: [
            ...current.toasts,
            {
              id: Date.now(),
              title: nouvelles.length === 1 ? nouvelles[0].titre : `${nouvelles.length} quêtes validées`,
              body: `+${gain} XP`,
              tone: 'amber' as const,
              icon: 'Trophy',
            },
          ],
        }))
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

      setLineDetails: (month, key, details) =>
        set((state) => ({
          budgets: state.budgets.map((budget) => {
            if (budget.month !== month) return budget
            return {
              ...budget,
              lines: budget.lines.map((line) => (lineKey(line) === key ? { ...line, ...details } : line)),
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
        set((state) => ({
          groups: [...state.groups, group],
        }))
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

      addPlanned: (item) => set((state) => ({ planned: [...state.planned, item] })),
      removePlanned: (id) => set((state) => ({ planned: state.planned.filter((p) => p.id !== id) })),

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
      version: 5,
      migrate: () => ({ ...initial() }),
    },
  ),
)

/* ----------------------------- Sélecteurs ------------------------------ */

export function useBudget(month: MonthKey): MonthBudget | undefined {
  return useApp((s) => s.budgets.find((b) => b.month === month))
}

/**
 * État enregistré d'une quête sur le mois affiché.
 *
 * Il dit seulement si la quête a déjà été créditée en expérience. L'affichage,
 * lui, se fonde sur la mesure en direct : une quête peut redevenir non
 * atteinte si l'utilisateur corrige sa saisie, sans qu'on lui reprenne l'XP.
 */
export function useChallengeState(challengeId: string): ChallengeProgress | undefined {
  const challenge = CHALLENGES.find((c) => c.id === challengeId)
  const month = useApp((s) => s.activeMonth)
  const period = challenge ? periodFor(challenge.cadence, month) : ''
  return useApp((s) => s.challengeProgress.find((p) => p.challengeId === challengeId && p.period === period))
}
