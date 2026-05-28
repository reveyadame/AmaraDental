import { useState } from 'react'
import { toast } from 'sonner'
import { Activity, Pencil, Plus, Printer, Stethoscope, Trash2 } from 'lucide-react'
import { useDeleteEndodonticRecord, useEndodonticRecords } from './useEndodontics'
import { EndodonticRecordDialog } from './EndodonticRecordDialog'
import { useMe } from '@/features/auth/hooks'
import { useConfirm } from '@/shared/ui/confirm'
import {
  PERIAPICAL_DIAGNOSIS_LABELS,
  PROGNOSIS_LABELS,
  PULPAL_DIAGNOSIS_LABELS,
  type EndodonticRecord,
} from '@/shared/types/endodontics'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'
import { cn } from '@/shared/lib/utils'

function formatDate(iso: string | null): string {
  if (!iso) return 'Sin fecha'
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const PROGNOSIS_BADGE: Record<string, string> = {
  favorable: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  questionable: 'bg-amber-100 text-amber-900 border-amber-200',
  unfavorable: 'bg-rose-100 text-rose-900 border-rose-200',
}

export function EndodonticsTab({ patientId }: { patientId: number }) {
  const { data: me } = useMe()
  const canEdit = me?.permissions.includes('clinical.manage') ?? false
  const isAdmin = me?.roles.includes('admin') ?? false

  const records = useEndodonticRecords(patientId)
  const del = useDeleteEndodonticRecord(patientId)
  const confirm = useConfirm()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<EndodonticRecord | null>(null)

  const openNew = () => {
    setEditing(null)
    setDialogOpen(true)
  }
  const openEdit = (r: EndodonticRecord) => {
    setEditing(r)
    setDialogOpen(true)
  }

  const onDelete = async (r: EndodonticRecord) => {
    const ok = await confirm({
      title: `¿Eliminar el registro de endodoncia del diente ${r.tooth_number ?? ''}?`,
      description: 'Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      variant: 'destructive',
    })
    if (!ok) return
    del.mutate(r.id, {
      onSuccess: () => toast.success('Registro eliminado'),
      onError: () => toast.error('No fue posible eliminar'),
    })
  }

  const list = records.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="size-4" />
          Historia clínica de endodoncia — un registro por diente tratado.
        </div>
        <div className="flex gap-2">
          {list.length > 0 ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                window.open(
                  `/pacientes/${patientId}/endodoncia/imprimir`,
                  '_blank',
                  'noopener',
                )
              }
            >
              <Printer className="size-4" /> Imprimir / PDF
            </Button>
          ) : null}
          {canEdit ? (
            <Button size="sm" onClick={openNew}>
              <Plus className="size-4" /> Nuevo registro
            </Button>
          ) : null}
        </div>
      </div>

      {records.isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : list.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center space-y-2">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted">
              <Stethoscope className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Aún no hay registros de endodoncia para este paciente.
            </p>
            {canEdit ? (
              <Button variant="link" onClick={openNew}>
                Crear el primer registro
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {list.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary font-semibold">
                      {r.tooth_number ?? '—'}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">
                          Diente {r.tooth_number ?? '—'}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(r.performed_on)}
                        </span>
                        {r.prognosis ? (
                          <Badge
                            variant="outline"
                            className={cn('font-normal', PROGNOSIS_BADGE[r.prognosis])}
                          >
                            {PROGNOSIS_LABELS[r.prognosis]}
                          </Badge>
                        ) : null}
                      </div>
                      {r.pulpal_diagnosis || r.periapical_diagnosis ? (
                        <p className="text-sm text-foreground">
                          {[
                            r.pulpal_diagnosis
                              ? PULPAL_DIAGNOSIS_LABELS[r.pulpal_diagnosis]
                              : null,
                            r.periapical_diagnosis
                              ? PERIAPICAL_DIAGNOSIS_LABELS[r.periapical_diagnosis]
                              : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      ) : null}
                      {r.chief_complaint ? (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {r.chief_complaint}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground pt-0.5">
                        {r.canals_count != null ? (
                          <span>{r.canals_count} conductos</span>
                        ) : null}
                        {r.sessions != null ? <span>{r.sessions} sesiones</span> : null}
                        {r.obturation_technique ? <span>{r.obturation_technique}</span> : null}
                        {r.specialist_name ? <span>· {r.specialist_name}</span> : null}
                      </div>

                      {r.treatment_log.length > 0 ? (
                        <div className="mt-2 rounded-md border bg-muted/20 p-2">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                            Bitácora
                          </p>
                          <ul className="space-y-0.5">
                            {[...r.treatment_log]
                              .sort((a, b) => b.date.localeCompare(a.date))
                              .map((entry, i) => (
                                <li key={`${entry.date}-${i}`} className="flex gap-2 text-xs">
                                  <span className="shrink-0 tabular-nums text-muted-foreground">
                                    {formatDate(entry.date)}
                                  </span>
                                  <span className="text-foreground">{entry.description}</span>
                                </li>
                              ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {canEdit ? (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => openEdit(r)}
                        aria-label="Editar registro"
                      >
                        <Pencil className="size-4" />
                      </Button>
                    ) : null}
                    {isAdmin ? (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => onDelete(r)}
                        aria-label="Eliminar registro"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <EndodonticRecordDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o)
          if (!o) setEditing(null)
        }}
        patientId={patientId}
        record={editing}
      />
    </div>
  )
}
