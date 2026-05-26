import { useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { Input } from '@/shared/ui/input'

interface Props {
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  suggestions?: string[]
}

export function TagListInput({ value, onChange, placeholder, suggestions = [] }: Props) {
  const [draft, setDraft] = useState('')

  const addTag = (raw: string) => {
    const t = raw.trim()
    if (!t || value.includes(t)) return
    onChange([...value, t])
    setDraft('')
  }

  const removeTag = (t: string) => onChange(value.filter((x) => x !== t))

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(draft)
    } else if (e.key === 'Backspace' && !draft && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((t) => (
          <Badge key={t} variant="secondary" className="gap-1">
            {t}
            <button
              type="button"
              onClick={() => removeTag(t)}
              className="hover:text-destructive"
              aria-label={`Quitar ${t}`}
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => addTag(draft)}
        placeholder={placeholder ?? 'Escribe y Enter…'}
        list={suggestions.length ? `${placeholder}-suggestions` : undefined}
      />
      {suggestions.length ? (
        <datalist id={`${placeholder}-suggestions`}>
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      ) : null}
    </div>
  )
}
