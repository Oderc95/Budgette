import { useState } from 'react'
import clsx from 'clsx'
import type { Tone } from '../domain/types'
import { useApp } from '../store/useApp'
import { Icon } from './Icon'
import { TONE } from './ui/tone'
import { newId } from '../lib/id'

/** Les teintes attribuées aux nouvelles étiquettes, en boucle. */
const TONES: Tone[] = ['mint', 'indigo', 'amber', 'orchid', 'berry', 'brand']

/**
 * Sélecteur d'étiquettes : cocher celles qui existent, en créer à la volée.
 *
 * Les étiquettes sont transversales — « Vacances », « Santé », « Télétravail »
 * traversent les catégories — et forment de fait des catégories personnelles :
 * tout ce qui porte la même étiquette se somme, où que ce soit rangé.
 */
export function TagPicker({
  selected,
  onToggle,
  disabled = false,
}: {
  selected: string[]
  onToggle: (tagId: string) => void
  disabled?: boolean
}) {
  const tags = useApp((s) => s.tags)
  const addTag = useApp((s) => s.addTag)
  const [draft, setDraft] = useState('')
  const [creating, setCreating] = useState(false)

  const creer = () => {
    const label = draft.trim()
    if (!label) return
    const tag = { id: newId('tag'), label, tone: TONES[tags.length % TONES.length] }
    addTag(tag)
    onToggle(tag.id)
    setDraft('')
    setCreating(false)
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => {
        const active = selected.includes(tag.id)
        const tone = TONE[tag.tone]
        return (
          <button
            key={tag.id}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(tag.id)}
            aria-pressed={active}
            className={clsx(
              'chip border transition',
              active
                ? clsx(tone.bg, tone.deep, tone.border)
                : 'border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink',
            )}
          >
            <span className={clsx('size-1.5 rounded-full', tone.solid)} />
            {tag.label}
          </button>
        )
      })}

      {!disabled &&
        (creating ? (
          <span className="flex items-center gap-1">
            <input
              autoFocus
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') creer()
                if (event.key === 'Escape') setCreating(false)
              }}
              placeholder="Nom de l'étiquette"
              className="w-36 rounded-full border border-line bg-surface px-3 py-1 text-[0.75rem] text-ink outline-none focus:border-brand"
            />
            <button
              type="button"
              onClick={creer}
              className="chip bg-brand-soft text-brand-deep"
              aria-label="Créer l'étiquette"
            >
              <Icon name="Check" size={12} />
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="chip border border-dashed border-line-strong text-ink-muted transition hover:text-ink"
          >
            <Icon name="Plus" size={12} />
            Étiquette
          </button>
        ))}
    </div>
  )
}
