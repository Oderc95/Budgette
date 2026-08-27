import { motion } from 'framer-motion'
import clsx from 'clsx'
import { useApp } from '../store/useApp'
import { Card, CardHeader } from './ui/primitives'
import { summarize } from '../domain/budget'
import { previsionDuMois, aUnePrevision } from '../domain/previsions'
import { euro, euroSigned, monthLabel } from '../lib/format'

/** Hauteur utile des colonnes, en pixels. */
const HAUTEUR = 96

/*
 * Abréviations des mois. Tronquer le nom à trois lettres donnerait « jui »
 * pour juin comme pour juillet : deux colonnes voisines, impossibles à
 * distinguer. La liste est donc écrite, avec les quatre lettres nécessaires.
 */
const MOIS_COURTS = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'aoû', 'sep', 'oct', 'nov', 'déc']

/**
 * Prévu contre réel, mois par mois, sur une année.
 *
 * Deux colonnes accolées par mois : ce qui était prévu, ce qui a été vécu.
 * L'échelle est commune à toute l'année — sans cela, un mois à 900 € et un
 * mois à 2 400 € auraient la même hauteur et le graphique mentirait.
 *
 * Seules les charges contraintes sont comparées. C'est le poste dont la
 * dérive se remarque et se raconte — un loyer qui augmente en cours d'année —
 * là où les dépenses non essentielles varient par nature. La note laissée à la
 * clôture s'affiche sous le mois concerné : elle explique la marche.
 */
export function EcartAnnuel({ annee }: { annee: number }) {
  const budgets = useApp((s) => s.budgets)
  const referenceMonth = useApp((s) => s.referenceMonth)
  const retired = useApp((s) => s.retired)
  const planned = useApp((s) => s.planned)

  const mois = Array.from({ length: 12 }, (_, index) => {
    const key = `${annee}-${String(index + 1).padStart(2, '0')}`
    const budget = budgets.find((b) => b.month === key)
    const prevu = previsionDuMois(key, { budgets, referenceMonth, retired, planned })
    return {
      key,
      court: MOIS_COURTS[index],
      saisi: Boolean(budget?.lines.some((l) => l.amount > 0)),
      note: budget?.note,
      prevu: prevu.fixed,
      reel: summarize(budget, key).totals.fixed,
      aPrevision: aUnePrevision(prevu),
    }
  })

  const actifs = mois.filter((m) => m.saisi || m.aPrevision)
  if (actifs.length === 0) return null

  const max = Math.max(1, ...actifs.flatMap((m) => [m.prevu, m.reel]))
  const notes = mois.filter((m) => m.note?.trim())

  return (
    <Card>
      <CardHeader
        title="Prévu contre réel"
        hint="Charges contraintes, mois par mois"
        icon="BarChart3"
        tone="indigo"
      />

      <div className="overflow-x-auto px-5 pb-2">
        <div className="flex min-w-[34rem] items-end gap-2" style={{ height: HAUTEUR + 34 }}>
          {mois.map((m) => {
            const ecart = m.reel - m.prevu
            // Une charge plus lourde que prévu est le signal qu'on cherche.
            const derive = m.saisi && m.aPrevision && Math.abs(ecart) >= 50
            return (
              <div key={m.key} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex h-full w-full items-end justify-center gap-[3px]" style={{ height: HAUTEUR }}>
                  {[
                    { valeur: m.prevu, classe: 'bg-indigo/45', nom: 'prévu' },
                    { valeur: m.reel, classe: derive && ecart > 0 ? 'bg-berry' : 'bg-brand', nom: 'réel' },
                  ].map(({ valeur, classe, nom }) => (
                    <motion.span
                      key={nom}
                      className={clsx('w-2.5 rounded-t-sm', classe)}
                      title={`${monthLabel(m.key)} — ${nom} ${euro(valeur)}`}
                      initial={{ height: 0 }}
                      whileInView={{ height: Math.max(valeur > 0 ? 3 : 0, (valeur / max) * HAUTEUR) }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    />
                  ))}
                </div>
                <span
                  className={clsx(
                    'text-[0.66rem] leading-none',
                    m.saisi ? 'font-semibold text-ink-soft' : 'text-ink-muted',
                  )}
                >
                  {m.court}
                </span>
                {/* La place de l'écart est réservée même quand il n'y en a
                    pas : sans cela, les noms de mois ne seraient pas alignés
                    d'une colonne à l'autre. */}
                <span
                  className={clsx(
                    'tabular text-[0.6rem] leading-none',
                    derive ? (ecart > 0 ? 'text-berry-deep' : 'text-mint-deep') : 'text-transparent',
                  )}
                >
                  {derive ? euroSigned(ecart) : '·'}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <p className="flex items-center gap-4 px-5 pb-3 text-[0.72rem] text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span className="block size-2.5 rounded-sm bg-indigo/45" />
          Prévu
        </span>
        <span className="flex items-center gap-1.5">
          <span className="block size-2.5 rounded-sm bg-brand" />
          Réel
        </span>
      </p>

      {notes.length > 0 && (
        <div className="border-t border-line px-5 py-3">
          <p className="eyebrow mb-1.5">Ce que vous avez noté</p>
          <ul className="flex flex-col gap-1">
            {notes.map((m) => (
              <li key={m.key} className="text-[0.78rem] leading-snug text-ink-soft">
                <span className="font-semibold text-ink">{monthLabel(m.key)}</span> — {m.note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}
