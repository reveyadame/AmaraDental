import { useState } from 'react'
import { Search, UserRound, X } from 'lucide-react'
import { usePatients } from '@/features/patients/hooks'
import type { Patient } from '@/shared/types/patient'
import { Input } from '@/shared/ui/input'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'

interface Props {
  selected: Patient | null
  onSelect: (p: Patient | null) => void
}

export function PatientPicker({ selected, onSelect }: Props) {
  const [q, setQ] = useState('')
  const debounced = useDebouncedValue(q, 300)
  const patients = usePatients({ q: debounced, per_page: 8 })

  if (selected) {
    return (
      <div className="flex items-center gap-3 rounded-md border bg-card p-3">
        <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
          {selected.first_name[0]}
          {selected.last_name[0]}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{selected.full_name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {selected.email ?? selected.mobile_phone ?? selected.phone ?? '—'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="text-muted-foreground hover:text-foreground p-1"
          aria-label="Quitar paciente"
        >
          <X className="size-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar paciente por nombre, correo o teléfono…"
          className="pl-9"
          autoFocus
        />
      </div>
      <div className="max-h-56 overflow-y-auto rounded-md border">
        {patients.isPending ? (
          <p className="px-3 py-4 text-sm text-muted-foreground">Buscando…</p>
        ) : patients.data?.data.length === 0 ? (
          <div className="px-3 py-6 text-center">
            <UserRound className="size-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {debounced ? 'Sin resultados' : 'Escribe para buscar pacientes'}
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {patients.data?.data.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onSelect(p)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-accent transition-colors"
                >
                  <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    {p.first_name[0]}
                    {p.last_name[0]}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-foreground truncate">
                      {p.full_name}
                    </span>
                    <span className="block text-xs text-muted-foreground truncate">
                      {p.email ?? p.mobile_phone ?? p.phone ?? '—'}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
