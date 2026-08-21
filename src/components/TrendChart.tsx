import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { MonthBudget } from '../domain/types'
import { totalsByFlow } from '../domain/budget'
import { euro, monthShort } from '../lib/format'

/** Trajectoire sur les mois saisis : revenus, dépenses totales, épargne. */
export function TrendChart({ budgets }: { budgets: MonthBudget[] }) {
  const data = budgets.map((budget) => {
    const totals = totalsByFlow(budget)
    return {
      month: monthShort(budget.month),
      Revenus: Math.round(totals.income),
      Dépenses: Math.round(totals.fixed + totals.debt + totals.discretionary),
      Épargne: Math.round(totals.saving),
    }
  })

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--c-sage)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--c-sage)" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gSpend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--c-clay)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--c-clay)" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gSave" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--c-gold)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="var(--c-gold)" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--c-border)" strokeDasharray="2 6" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: 'var(--c-text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--c-text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={54}
            tickFormatter={(value: number) => `${Math.round(value / 100) / 10}k`}
          />
          <Tooltip
            cursor={{ stroke: 'var(--c-border-strong)', strokeDasharray: '3 3' }}
            contentStyle={{
              background: 'var(--c-surface)',
              border: '1px solid var(--c-border)',
              borderRadius: 14,
              fontSize: 12,
              color: 'var(--c-text)',
              boxShadow: 'var(--shadow-soft)',
            }}
            labelStyle={{ color: 'var(--c-text-muted)', fontWeight: 600 }}
            formatter={(value, name) => [euro(Number(value)), String(name)]}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, color: 'var(--c-text-soft)', paddingTop: 6 }}
          />
          <Area type="monotone" dataKey="Revenus" stroke="var(--c-sage)" strokeWidth={2} fill="url(#gIncome)" />
          <Area type="monotone" dataKey="Dépenses" stroke="var(--c-clay)" strokeWidth={2} fill="url(#gSpend)" />
          <Area type="monotone" dataKey="Épargne" stroke="var(--c-gold)" strokeWidth={2} fill="url(#gSave)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
