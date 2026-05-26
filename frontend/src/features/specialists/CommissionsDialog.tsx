import { useEffect, useMemo, useState, type ReactElement } from 'react'
import { toast } from 'sonner'
import { Loader2, RotateCcw, Save } from 'lucide-react'
import { useSpecialistCommissions, useSyncSpecialistCommissions } from './hooks'
import type { CommissionSource, SpecialistCommissionRow } from './api'
import type { Specialist } from '@/shared/types/catalog'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Badge } from '@/shared/ui/badge'
import { Skeleton } from '@/shared/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  specialist: Specialist
}

type DraftMap = Record<number, string> // treatmentId → input string ('' = sin override)

function sourceBadge(source: CommissionSource): ReactElement {
  if (source === 'override')
    return <Badge variant="default" className="font-normal">Override</Badge>
  if (source === 'treatment')
    return <Badge variant="secondary" className="font-normal">Tratamiento</Badge>
  if (source === 'specialist')
    return <Badge variant="outline" className="font-normal">Default del dentista</Badge>
  return <Badge variant="outline" className="text-muted-foreground font-normal">Sin comisión</Badge>
}

function rowToDraft(rows: SpecialistCommissionRow[]): DraftMap {
  const m: DraftMap = {}
  for (const r of rows) {
    m[r.treatment_id] = r.override_percent !== null ? String(r.override_percent) : ''
  }
  return m
}

function computeEffective(
  draftValue: string,
  treatmentDefault: number | null,
  specialistDefault: number | null,
): { value: number | null; source: CommissionSource } {
  if (draftValue !== '') {
    const n = Number(draftValue)
    if (!Number.isNaN(n)) return { value: n, source: 'override' }
  }
  if (treatmentDefault !== null) return { value: treatmentDefault, source: 'treatment' }
  if (specialistDefault !== null) return { value: specialistDefault, source: 'specialist' }
  return { value: null, source: null }
}

export function CommissionsDialog({ open, onOpenChange, specialist }: Props) {
  const query = useSpecialistCommissions(open ? specialist.id : undefined)
  const sync = useSyncSpecialistCommissions(specialist.id)
  const [draft, setDraft] = useState<DraftMap>({})
  const [filter, setFilter] = useState('')

  useEffect(() => {
    if (query.data) setDraft(rowToDraft(query.data.data))
  }, [query.data])

  const rows = query.data?.data ?? []
  const filteredRows = useMemo(() => {
    const t = filter.trim().toLowerCase()
    if (!t) return rows
    return rows.filter(
      (r) =>
        r.treatment_name.toLowerCase().includes(t) ||
        r.treatment_code?.toLowerCase().includes(t) ||
        r.treatment_category?.toLowerCase().includes(t),
    )
  }, [rows, filter])

  const overrideCount = useMemo(() => {
    return rows.reduce((n, r) => {
      const draftValue = draft[r.treatment_id] ?? ''
      const currentlyOverridden = r.override_percent !== null
      const willBeOverridden = draftValue !== ''
      const changed =
        (currentlyOverridden && (!willBeOverridden || Number(draftValue) !== r.override_percent)) ||
        (!currentlyOverridden && willBeOverridden)
      return n + (changed ? 1 : 0)
    }, 0)
  }, [rows, draft])

  const setValue = (treatmentId: number, value: string) =>
    setDraft((d) => ({ ...d, [treatmentId]: value }))

  const clearOverride = (treatmentId: number) =>
    setDraft((d) => ({ ...d, [treatmentId]: '' }))

  const resetAll = () => {
    if (query.data) setDraft(rowToDraft(query.data.data))
  }

  const onSave = () => {
    const overrides = rows.map((r) => {
      const v = draft[r.treatment_id] ?? ''
      return {
        treatment_id: r.treatment_id,
        commission_percent: v === '' ? null : Number(v),
      }
    })
    sync.mutate(overrides, {
      onSuccess: () => {
        toast.success('Comisiones actualizadas')
        onOpenChange(false)
      },
      onError: () => toast.error('No fue posible guardar las comisiones'),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Comisiones por tratamiento — {specialist.name}</DialogTitle>
          <DialogDescription>
            Personaliza la comisión que recibe este especialista por tratamiento. Si dejas el
            override vacío, se usa el default del tratamiento o del propio especialista.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-3 mt-2">
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrar por nombre, código o categoría…"
            className="max-w-sm"
          />
          <p className="text-xs text-muted-foreground">
            {overrideCount > 0
              ? `${overrideCount} cambio${overrideCount === 1 ? '' : 's'} pendiente${
                  overrideCount === 1 ? '' : 's'
                }`
              : 'Sin cambios pendientes'}
          </p>
        </div>

        <div className="flex-1 overflow-auto -mx-6 px-6 mt-3 border-t">
          <Table className="min-w-[640px]">
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead>Tratamiento</TableHead>
                <TableHead className="text-right">Default tratamiento</TableHead>
                <TableHead className="text-right">Override</TableHead>
                <TableHead className="text-right">Efectiva</TableHead>
                <TableHead>Fuente</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isPending ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    {filter ? `Sin resultados para "${filter}"` : 'Sin tratamientos en el catálogo.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((r) => {
                  const draftValue = draft[r.treatment_id] ?? ''
                  const eff = computeEffective(
                    draftValue,
                    r.treatment_default_percent,
                    r.specialist_default_percent,
                  )
                  return (
                    <TableRow key={r.treatment_id}>
                      <TableCell>
                        <div className="font-medium text-foreground">{r.treatment_name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          {r.treatment_code ? (
                            <span className="font-mono">{r.treatment_code}</span>
                          ) : null}
                          {r.treatment_category ? <span>· {r.treatment_category}</span> : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {r.treatment_default_percent !== null
                          ? `${r.treatment_default_percent}%`
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            max={100}
                            value={draftValue}
                            onChange={(e) => setValue(r.treatment_id, e.target.value)}
                            placeholder="—"
                            className="h-8 w-20 text-right tabular-nums"
                          />
                          {draftValue !== '' ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-muted-foreground"
                              title="Quitar override"
                              onClick={() => clearOverride(r.treatment_id)}
                            >
                              <RotateCcw className="size-3.5" />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {eff.value !== null ? `${eff.value}%` : '—'}
                      </TableCell>
                      <TableCell>{sourceBadge(eff.source)}</TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={resetAll}
            disabled={overrideCount === 0 || sync.isPending}
          >
            <RotateCcw className="size-4" /> Descartar cambios
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={onSave} disabled={sync.isPending || overrideCount === 0}>
              {sync.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Guardar {overrideCount > 0 ? `(${overrideCount})` : ''}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
