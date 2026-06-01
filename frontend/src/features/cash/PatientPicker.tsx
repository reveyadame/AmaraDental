import { useState } from 'react'
import { Search, Sparkles, UserPlus, UserRound, X } from 'lucide-react'
import { usePatients } from '@/features/patients/hooks'
import { QuickPatientDialog } from '@/features/patients/QuickPatientDialog'
import type { Patient } from '@/shared/types/patient'
import { Input } from '@/shared/ui/input'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'

interface Props {
  selected: Patient | null
  onSelect: (p: Patient | null) => void
  /** Cuando true, ofrece "+ Crear nuevo paciente" para captura rápida.
   *  Útil principalmente en agenda. Default: false. */
  allowQuickCreate?: boolean
}

export function PatientPicker({ selected, onSelect, allowQuickCreate = false }: Props) {
  const [q, setQ] = useState('')
  const debounced = useDebouncedValue(q, 300)
  const patients = usePatients({ q: debounced, per_page: 8 })
  const [quickOpen, setQuickOpen] = useState(false)

  if (selected) {
    return (
      <div className="flex items-center gap-3 rounded-md border bg-card p-3">
        <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
          {selected.first_name[0]}
          {selected.last_name[0]}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
            {selected.full_name}
            {selected.is_first_visit ? (
              <Badge className="bg-lime-100 text-lime-900 border border-lime-200 hover:bg-lime-100 gap-1">
                <Sparkles className="size-3" /> 1ra vez
              </Badge>
            ) : null}
          </p>
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

  const results = patients.data?.data ?? []
  const hasTyped = debounced.trim().length >= 2

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
        ) : results.length === 0 ? (
          <div className="px-3 py-6 text-center space-y-3">
            <UserRound className="size-5 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              {hasTyped ? 'Sin resultados' : 'Escribe para buscar pacientes'}
            </p>
            {allowQuickCreate && hasTyped ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickOpen(true)}
              >
                <UserPlus className="size-4" /> Crear «{debounced.trim()}»
              </Button>
            ) : null}
          </div>
        ) : (
          <ul className="divide-y">
            {results.map((p) => (
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
                    <span className="block text-sm font-medium text-foreground truncate flex items-center gap-1.5">
                      {p.full_name}
                      {p.is_first_visit ? (
                        <Badge className="bg-lime-100 text-lime-900 border border-lime-200 hover:bg-lime-100 gap-1 text-[10px] px-1.5">
                          <Sparkles className="size-2.5" /> 1ra vez
                        </Badge>
                      ) : null}
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

      {allowQuickCreate && results.length > 0 && hasTyped ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={() => setQuickOpen(true)}
        >
          <UserPlus className="size-4" /> ¿No está? Crear «{debounced.trim()}» como nuevo paciente
        </Button>
      ) : null}

      {allowQuickCreate ? (
        <QuickPatientDialog
          open={quickOpen}
          onOpenChange={setQuickOpen}
          initialName={debounced}
          onCreated={(p) => {
            onSelect(p)
            setQ('')
          }}
        />
      ) : null}
    </div>
  )
}
