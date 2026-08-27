import { motion } from 'framer-motion'
import clsx from 'clsx'
import { useApp } from '../store/useApp'
import { FLOW_META, FLOW_ORDER } from '../domain/categories'
import type { MonthSummary } from '../domain/budget'
import { favorable, previsionDuMois } from '../domain/previsions'
import type { MonthKey } from '../domain/types'
import { Card, CardHeader } from './ui/primitives'
import { TONE } from './ui/tone'
import { Icon } from './Icon'
import { MonthDonut } from './MonthDonut'
import { euro, euroSigned, monthLabel } from '../lib/format'

/** Courbe unique des jauges : arrive vite, se pose sans dépasser. */
const EASE = [0.22, 1, 0.36, 1] as const

/** Hauteur utile des barres du comparatif, en pixels. */
const HAUTEUR = 108

/**
 * Budget vs réel : la partie haute de « Mon mois ».
 *
 * Le « budget » du mois est ce qu'on pouvait prévoir avant de le vivre : les
 * lignes du mois de référence (hors ponctuel et hors charges retirées),
 * complétées par les éléments planifiés au calendrier — sans compter deux fois
 * un poste présent des deux côtés. Le « réel » est ce qui est saisi. Les
 * barres comparent les deux d'un coup d'œil, le tableau chiffre chaque écart,
 * l'anneau montre où part réellement l'argent.
 */
export function BudgetVsReal({ month, summary }: { month: MonthKey; summary: MonthSummary }) {
  const budgets = useApp((s) => s.budgets)
  const referenceMonth = useApp((s) => s.referenceMonth)
  const retired = useApp((s) => s.retired)
  const planned = useApp((s) => s.planned)

  const reference = budgets.find((b) => b.month === referenceMonth && b.closed && b.month !== month)

  const prevu = previsionDuMois(month, { budgets, referenceMonth, retired, planned })

  const reel = summary.totals
  const aBudget = FLOW_ORDER.some((flow) => prevu[flow] > 0)
  const aReel = FLOW_ORDER.some((flow) => reel[flow] > 0)
  const prevuFin = prevu.income - prevu.fixed - prevu.debt - prevu.saving - prevu.discretionary
  const max = Math.max(1, ...FLOW_ORDER.flatMap((flow) => [prevu[flow], reel[flow]]))

  return (
    <Card className="relative">
      <CardHeader
        title="Budget vs réel"
        hint={
          reference
            ? `Prévu d'après ${monthLabel(reference.month)} et le calendrier, comparé au saisi`
            : 'Le prévu viendra du mois de référence et du calendrier « Mon année »'
        }
        icon="Scale"
        tone="brand"
      />
      <div className="grid gap-x-6 gap-y-5 px-5 pb-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* Les barres : une paire prévu / réel par flux */}
        <div className="min-w-0">
          <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="flex items-end justify-between gap-1.5 sm:gap-3">
              {FLOW_ORDER.map((flow) => {
                const meta = FLOW_META[flow]
                return (
                  <div key={flow} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                    <div className="flex items-end gap-1" style={{ height: HAUTEUR }}>
                      {[
                        { valeur: prevu[flow], classe: 'bg-mint/60', nom: 'Budget' },
                        { valeur: reel[flow], classe: 'bg-brand', nom: 'Réel' },
                      ].map(({ valeur, classe, nom }) => (
                        <motion.span
                          key={nom}
                          title={`${meta.label} — ${nom} : ${euro(valeur)}`}
                          className={clsx('w-3 rounded-t-md sm:w-4', valeur > 0 ? classe : 'bg-surface-3')}
                          initial={{ height: 2 }}
                          animate={{ height: valeur > 0 ? Math.max(5, Math.round((valeur / max) * HAUTEUR)) : 2 }}
                          transition={{ duration: 0.7, ease: EASE }}
                        />
                      ))}
                    </div>
                    <span
                      className="eyebrow w-full truncate text-center text-[0.56rem] sm:text-[0.62rem]"
                      title={meta.label}
                    >
                      {meta.short}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Répartition réelle, comme sur un tableau de bord de budget */}
            {aReel && (
              <div className="flex w-[116px] flex-col items-center gap-1 justify-self-center">
                <MonthDonut summary={summary} size={104} />
                <span className="eyebrow text-center text-[0.58rem] leading-tight">Répartition réelle</span>
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.72rem] text-ink-soft">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-mint/60" />
              Budget (prévu)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-brand" />
              Réel (saisi)
            </span>
            {!aBudget && (
              <span className="flex items-center gap-1 text-ink-muted">
                <Icon name="Info" size={11} />
                Pas encore de budget prévu pour ce mois.
              </span>
            )}
          </div>
        </div>

        {/* Le récapitulatif chiffré : budget, réel, écart */}
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full min-w-[19rem] border-collapse text-[0.82rem]">
            <thead>
              <tr className="text-left">
                <th className="eyebrow pb-1.5 font-bold">Catégorie</th>
                <th className="eyebrow pb-1.5 text-right font-bold">Budget</th>
                <th className="eyebrow pb-1.5 text-right font-bold">Réel</th>
                <th className="eyebrow pb-1.5 text-right font-bold">Écart</th>
              </tr>
            </thead>
            <tbody>
              {FLOW_ORDER.map((flow) => {
                const meta = FLOW_META[flow]
                const ecart = reel[flow] - prevu[flow]
                return (
                  <tr key={flow} className="border-t border-line">
                    <td className="py-1.5 pr-2" title={meta.label}>
                      <span className="flex items-center gap-1.5 text-ink">
                        <Icon name={meta.icon} size={13} className={TONE[meta.tone].text} />
                        <span className="truncate font-medium">{meta.short}</span>
                      </span>
                    </td>
                    <td className="tabular py-1.5 text-right text-ink-soft">{aBudget ? euro(prevu[flow]) : '—'}</td>
                    <td className="tabular py-1.5 text-right font-semibold text-ink">{euro(reel[flow])}</td>
                    <td
                      className={clsx(
                        'tabular py-1.5 text-right font-semibold',
                        !aBudget || ecart === 0
                          ? 'text-ink-muted'
                          : favorable(flow, ecart)
                            ? 'text-mint-deep'
                            : 'text-berry-deep',
                      )}
                    >
                      {aBudget ? euroSigned(ecart) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-line-strong">
                <td className="py-2 pr-2 font-display text-[0.9rem] text-ink">Fin de mois</td>
                <td className="tabular py-2 text-right text-ink-soft">{aBudget ? euroSigned(prevuFin) : '—'}</td>
                <td
                  className={clsx(
                    'tabular py-2 text-right font-display text-[0.95rem]',
                    summary.endOfMonth >= 0 ? 'text-mint-deep' : 'text-berry-deep',
                  )}
                >
                  {euroSigned(summary.endOfMonth)}
                </td>
                <td
                  className={clsx(
                    'tabular py-2 text-right font-semibold',
                    !aBudget || summary.endOfMonth === prevuFin
                      ? 'text-ink-muted'
                      : summary.endOfMonth >= prevuFin
                        ? 'text-mint-deep'
                        : 'text-berry-deep',
                  )}
                >
                  {aBudget ? euroSigned(summary.endOfMonth - prevuFin) : '—'}
                </td>
              </tr>
              <tr>
                <td colSpan={3} className="pt-1 text-[0.72rem] text-ink-soft">
                  Reste à vivre
                </td>
                <td className="tabular pt-1 text-right text-[0.72rem] font-semibold text-ink">
                  {euro(summary.livingAllowance)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </Card>
  )
}
