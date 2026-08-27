import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import { useApp } from '../store/useApp'
import { GOAL_CATALOG, STRATEGIES, emergencyFundTarget } from '../domain/strategy'
import type { GoalKind } from '../domain/types'
import { Ambient, Button } from '../components/ui/primitives'
import { Icon } from '../components/Icon'
import { newId } from '../lib/id'
import { Logo } from '../components/Logo'
import { Mascot } from '../components/Mascot'
import { addMonths, euro, monthKey } from '../lib/format'

/**
 * Questionnaire d'arrivée.
 *
 * Il ne demande pas à l'utilisateur de choisir dans un catalogue : il pose
 * trois questions en langage ordinaire, en déduit un objectif, et le lui
 * soumet. Refuser est prévu — et « je ne sais pas encore » est une réponse
 * valable, qui laisse simplement une pastille sur la section Objectifs.
 */

/** Ce qui amène quelqu'un ici, et l'objectif que cela désigne. */
const MOTIFS: {
  id: string
  label: string
  detail: string
  icon: string
  /** `null` : la personne ne vient pas avec un projet, seulement pour voir. */
  kind: GoalKind | null
}[] = [
  {
    id: 'brouillard',
    label: 'Je ne sais pas où part mon argent',
    detail: 'Le mois se termine et le compte est vide, sans explication.',
    icon: 'Search',
    kind: 'emergency',
  },
  {
    id: 'rouge',
    label: 'Je suis souvent à découvert',
    detail: 'Il faut d’abord éteindre l’incendie.',
    icon: 'TrendingDown',
    kind: 'debt_exit',
  },
  {
    id: 'cote',
    label: 'Je veux mettre de côté',
    detail: 'Sans projet précis, mais régulièrement.',
    icon: 'PiggyBank',
    kind: 'emergency',
  },
  {
    id: 'projet',
    label: 'J’ai un projet à financer',
    detail: 'Un voyage, un logement, un achat qui compte.',
    icon: 'Target',
    kind: 'purchase',
  },
  {
    id: 'oeil',
    label: 'Je veux simplement garder l’œil',
    detail: 'Suivre mes comptes, sans objectif pour l’instant.',
    icon: 'Eye',
    kind: null,
  },
]

/** Une phrase par objectif : ce que c'est, sans jargon. */
const EN_UN_MOT: Record<GoalKind, string> = {
  emergency:
    'Une réserve qui dort sur un compte à part, et qui absorbe l’imprévu sans vous mettre à découvert.',
  debt_exit: 'Un plan pour éteindre découvert et crédits, poste par poste, du plus coûteux au moins coûteux.',
  travel: 'Une somme mise de côté chaque mois jusqu’au départ, pour partir sans rien devoir à personne.',
  home: 'L’apport de votre futur logement, construit mois après mois.',
  study: 'De quoi financer une formation ou des études, sans emprunter.',
  purchase: 'Un achat qui compte, préparé à l’avance plutôt que subi sur le crédit.',
  retirement: 'Un versement régulier, très long terme, qu’on oublie une fois mis en place.',
  freedom: 'Assez de côté pour choisir votre travail plutôt que le subir.',
  car: 'Un véhicule financé sans crédit, ou avec le moins possible.',
  wedding: 'Un mariage préparé sans que la note gâche l’année suivante.',
  baby: 'Le budget d’une arrivée, anticipé avant qu’elle n’arrive.',
  moving: 'Un déménagement, caution et frais compris, prévu à l’avance.',
  celebration: 'Une grande occasion, financée sans arrière-pensée.',
  health: 'Des frais de santé absorbés sans renoncer aux soins.',
}

const anim = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const },
}

/** Carte de réponse : toute la surface est cliquable, au doigt comme à la souris. */
function Choix({
  actif,
  icon,
  label,
  detail,
  onClick,
}: {
  actif: boolean
  icon: string
  label: string
  detail?: string
  onClick: () => void
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.985 }}
      className={clsx(
        'flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition',
        actif ? 'border-brand bg-brand-soft' : 'border-line bg-surface hover:border-line-strong',
      )}
    >
      <span
        className={clsx(
          'grid size-10 shrink-0 place-items-center rounded-xl',
          actif ? 'bg-brand text-on-accent' : 'bg-surface-2 text-ink-soft',
        )}
      >
        <Icon name={icon} size={18} />
      </span>
      <span className="min-w-0">
        <span className={clsx('block text-[0.92rem] font-semibold leading-tight', actif ? 'text-brand-deep' : 'text-ink')}>
          {label}
        </span>
        {detail && <span className="mt-0.5 block text-[0.78rem] leading-snug text-ink-muted">{detail}</span>}
      </span>
    </motion.button>
  )
}

export function Onboarding() {
  const completeOnboarding = useApp((s) => s.completeOnboarding)

  const [etape, setEtape] = useState(0)
  const [prenom, setPrenom] = useState('')
  const [motifId, setMotifId] = useState<string | null>(null)
  const [revenu, setRevenu] = useState(2000)
  /** Objectif retenu après refus de la proposition. `undefined` : pas encore tranché. */
  const [choisi, setChoisi] = useState<GoalKind | null | undefined>(undefined)

  const motif = MOTIFS.find((m) => m.id === motifId) ?? null

  // L'objectif effectif : celui choisi à la main s'il y en a un, sinon celui
  // déduit du motif.
  const kind = choisi !== undefined ? choisi : (motif?.kind ?? null)
  const entree = kind ? GOAL_CATALOG.find((g) => g.kind === kind)! : null
  const strategie = kind ? STRATEGIES[kind] : null

  const montant = useMemo(() => {
    if (!entree) return 0
    if (entree.suggestedAmount !== null) return entree.suggestedAmount
    // Sans montant au catalogue, on le calcule : trois mois de charges, en
    // estimant les charges à 60 % du revenu déclaré.
    if (kind === 'emergency') return emergencyFundTarget(Math.round(revenu * 0.6), 0, 3)
    return Math.max(1000, Math.round((revenu * 0.8) / 100) * 100)
  }, [entree, kind, revenu])

  const mois = entree?.suggestedMonths ?? 12

  function valider() {
    completeOnboarding({
      strategyId: strategie?.id ?? 'bouclier',
      displayName: prenom,
      goal:
        kind && entree
          ? {
              id: newId('goal'),
              kind,
              label: entree.label,
              targetAmount: montant,
              deadline: addMonths(monthKey(new Date()), mois),
              createdAt: new Date().toISOString(),
            }
          : null,
    })
  }

  const peutAvancer = etape === 0 ? prenom.trim().length > 0 : etape === 1 ? motif !== null : true
  // Le revenu ne sert qu'à calibrer un objectif chiffré : sans objectif, on
  // saute la question plutôt que de la poser pour rien.
  const derniereEtape = motif?.kind === null && choisi === undefined ? 2 : 3

  function suivant() {
    if (etape === 1 && motif?.kind === null) {
      setEtape(2)
      return
    }
    setEtape((v) => Math.min(3, v + 1))
  }

  return (
    <>
      <Ambient />
      <div className="pad-safe-top pad-safe-x pad-safe-bottom [--pad-x:1.25rem] [--pad-bottom:1.25rem] relative z-10 mx-auto flex min-h-dvh w-full max-w-lg flex-col">
        <div className="flex items-center justify-between py-4">
          <Logo size="sm" tagline={false} />
          {/* Trois pastilles : la progression se lit d'un coup d'œil, sans texte. */}
          <div className="flex items-center gap-1.5" aria-label={`Étape ${etape + 1} sur ${derniereEtape + 1}`}>
            {Array.from({ length: derniereEtape + 1 }).map((_, index) => (
              <motion.span
                key={index}
                className={clsx('block h-1.5 rounded-full', index <= etape ? 'bg-brand' : 'bg-line')}
                animate={{ width: index === etape ? 22 : 8 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center py-2">
          <AnimatePresence mode="wait">
            {etape === 0 && (
              <motion.div key="e0" {...anim} className="flex flex-col gap-5">
                <div className="flex justify-center">
                  <Mascot stageIndex={1} size={92} />
                </div>
                <div className="text-center">
                  <h1 className="font-display text-[1.9rem] leading-tight text-ink">Bonjour.</h1>
                  <p className="mt-1.5 text-[0.95rem] text-ink-soft">Comment doit-on vous appeler ?</p>
                </div>
                <input
                  autoFocus
                  value={prenom}
                  onChange={(event) => setPrenom(event.target.value)}
                  placeholder="Votre prénom"
                  className="rounded-2xl border border-line bg-surface px-4 py-3.5 text-center text-ink outline-none transition focus:border-brand"
                />
              </motion.div>
            )}

            {etape === 1 && (
              <motion.div key="e1" {...anim} className="flex flex-col gap-4">
                <div>
                  <h1 className="font-display text-[1.7rem] leading-tight text-ink">
                    Qu’est-ce qui vous amène, {prenom.trim()} ?
                  </h1>
                  <p className="mt-1 text-[0.88rem] text-ink-soft">Une seule réponse. Elle orientera le reste.</p>
                </div>
                <div className="flex flex-col gap-2">
                  {MOTIFS.map((m) => (
                    <Choix
                      key={m.id}
                      actif={motifId === m.id}
                      icon={m.icon}
                      label={m.label}
                      detail={m.detail}
                      onClick={() => {
                        setMotifId(m.id)
                        setChoisi(undefined)
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {etape === 2 && motif?.kind !== null && (
              <motion.div key="e2" {...anim} className="flex flex-col gap-6">
                <div>
                  <h1 className="font-display text-[1.7rem] leading-tight text-ink">
                    Combien entre, bon mois mauvais mois ?
                  </h1>
                  <p className="mt-1 text-[0.88rem] text-ink-soft">
                    Une estimation suffit. Elle sert à calibrer l’objectif, et se corrige à tout moment.
                  </p>
                </div>
                <div className="rounded-2xl border border-line bg-surface p-5 text-center">
                  <p className="tabular font-display text-4xl text-brand-deep">{euro(revenu)}</p>
                  <p className="mt-1 text-[0.78rem] text-ink-muted">net, par mois</p>
                  <input
                    type="range"
                    min={500}
                    max={8000}
                    step={50}
                    value={revenu}
                    onChange={(event) => setRevenu(Number(event.target.value))}
                    className="mt-4 w-full"
                    aria-label="Revenu mensuel net"
                  />
                </div>
              </motion.div>
            )}

            {etape === 2 && motif?.kind === null && (
              <motion.div key="e2b" {...anim} className="flex flex-col gap-5 text-center">
                <div className="flex justify-center">
                  <Mascot stageIndex={2} size={92} />
                </div>
                <div>
                  <h1 className="font-display text-[1.7rem] leading-tight text-ink">Très bien, on regarde d’abord.</h1>
                  <p className="mt-2 text-[0.92rem] leading-relaxed text-ink-soft">
                    Vous entrez sans objectif. Saisissez un mois, voyez ce que ça donne, et fixez un cap quand vous
                    le sentirez — la section Objectifs vous attendra.
                  </p>
                </div>
              </motion.div>
            )}

            {etape === 3 && (
              <motion.div key="e3" {...anim} className="flex flex-col gap-5">
                {kind && entree ? (
                  <>
                    <div className="text-center">
                      <p className="eyebrow">Ce que je vous propose</p>
                      <motion.div
                        className="mx-auto mt-3 grid size-16 place-items-center rounded-2xl bg-brand text-on-accent"
                        initial={{ scale: 0.6, rotate: -12 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                      >
                        <Icon name={entree.icon} size={30} />
                      </motion.div>
                      <h1 className="mt-3 font-display text-[1.7rem] leading-tight text-ink">{entree.label}</h1>
                      <p className="mx-auto mt-2 max-w-sm text-[0.92rem] leading-relaxed text-ink-soft">
                        {EN_UN_MOT[kind]}
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-6 rounded-2xl border border-line bg-surface-2 py-3.5">
                      <span className="text-center">
                        <span className="block text-[0.68rem] uppercase tracking-widest text-ink-muted">Cible</span>
                        <span className="tabular block font-display text-lg text-ink">{euro(montant)}</span>
                      </span>
                      <span className="h-8 w-px bg-line" />
                      <span className="text-center">
                        <span className="block text-[0.68rem] uppercase tracking-widest text-ink-muted">Horizon</span>
                        <span className="tabular block font-display text-lg text-ink">{mois} mois</span>
                      </span>
                    </div>

                    <p className="text-center text-[0.78rem] text-ink-muted">
                      Rien n’est figé : montant et échéance se modifient dans Objectifs.
                    </p>
                  </>
                ) : (
                  /* Refus de la proposition : on ouvre le catalogue, et on
                     assume l'absence d'objectif comme une réponse à part. */
                  <>
                    <div>
                      <h1 className="font-display text-[1.6rem] leading-tight text-ink">Alors qu’est-ce qui compte ?</h1>
                      <p className="mt-1 text-[0.88rem] text-ink-soft">Choisissez, ou remettez à plus tard.</p>
                    </div>
                    <div className="flex max-h-[46vh] flex-col gap-2 overflow-y-auto pr-1">
                      {GOAL_CATALOG.map((entry) => (
                        <Choix
                          key={entry.kind}
                          actif={false}
                          icon={entry.icon}
                          label={entry.label}
                          detail={entry.tagline}
                          onClick={() => setChoisi(entry.kind)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Commandes, toujours au même endroit : le pouce n'a pas à chercher. */}
        <div className="flex flex-col gap-2 pt-3">
          {etape === 3 ? (
            <>
              <Button size="lg" full iconRight="ArrowRight" onClick={valider}>
                {kind ? 'C’est parti' : 'Entrer sans objectif'}
              </Button>
              {kind && (
                <Button variant="ghost" size="md" full onClick={() => setChoisi(null)}>
                  Pas tout à fait
                </Button>
              )}
            </>
          ) : etape === derniereEtape ? (
            <Button size="lg" full iconRight="ArrowRight" onClick={valider} disabled={!peutAvancer}>
              Entrer dans Budgette
            </Button>
          ) : (
            <Button size="lg" full iconRight="ArrowRight" onClick={suivant} disabled={!peutAvancer}>
              Continuer
            </Button>
          )}

          {etape > 0 && (
            <Button
              variant="ghost"
              size="sm"
              full
              icon="ArrowLeft"
              onClick={() => {
                setChoisi(undefined)
                setEtape((v) => Math.max(0, v - 1))
              }}
            >
              Retour
            </Button>
          )}
        </div>
      </div>
    </>
  )
}
