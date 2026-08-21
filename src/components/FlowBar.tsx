import clsx from 'clsx'
import { FLOW_META } from '../domain/categories'
import type { FlowTotals } from '../domain/budget'
import { flowShares } from '../domain/budget'
import { TONE } from './ui/tone'
import { euro } from '../lib/format'
import { motion } from 'framer-motion'

/** Répartition du revenu du mois en une seule barre empilée. */
export function FlowBar({ totals }: { totals: FlowTotals }) {
  const shares = flowShares(totals)
  const spent = shares.reduce((sum, s) => sum + s.amount, 0)
  const leftover = Math.max(0, totals.income - spent)
  const leftoverShare = totals.income > 0 ? leftover / totals.income : 0

  return (
    <div>
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-surface-3">
        {shares
          .filter((slice) => slice.share > 0)
          .map((slice) => (
            <motion.div
              key={slice.flow}
              className={clsx(TONE[FLOW_META[slice.flow].tone].solid, 'h-full first:rounded-l-full')}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, slice.share * 100)}%` }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              title={`${FLOW_META[slice.flow].label} — ${euro(slice.amount)}`}
            />
          ))}
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {shares
          .filter((slice) => slice.amount > 0)
          .map((slice) => (
            <li key={slice.flow} className="flex items-center gap-1.5 text-[0.78rem]">
              <span className={clsx('size-2 rounded-full', TONE[FLOW_META[slice.flow].tone].solid)} />
              <span className="text-ink-soft">{FLOW_META[slice.flow].short}</span>
              <span className="tabular font-semibold text-ink">{euro(slice.amount)}</span>
              <span className="text-ink-muted">{Math.round(slice.share * 100)} %</span>
            </li>
          ))}
        {leftover > 1 && (
          <li className="flex items-center gap-1.5 text-[0.78rem]">
            <span className="size-2 rounded-full bg-surface-3 ring-1 ring-line-strong" />
            <span className="text-ink-soft">Non affecté</span>
            <span className="tabular font-semibold text-ink">{euro(leftover)}</span>
            <span className="text-ink-muted">{Math.round(leftoverShare * 100)} %</span>
          </li>
        )}
      </ul>
    </div>
  )
}
