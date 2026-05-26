import { useState } from 'react'
import { AlertTriangle, BellRing, Calendar, CheckCircle2, X } from 'lucide-react'
import { toast } from 'sonner'
import { useDeleteRecall, useRecalls, useUpdateRecall } from './hooks'
import { AppointmentDialog } from '@/features/agenda/AppointmentDialog'
import { useMe } from '@/features/auth/hooks'
import type { Patient } from '@/shared/types/patient'
import {
  RECALL_STATUS_LABELS,
  type Recall,
} from '@/shared/types/recall'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Skeleton } from '@/shared/ui/skeleton'
import { cn } from '@/shared/lib/utils'

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

interface Props {
  patient: Patient
}

export function PatientRecallsTab({ patient }: Props) {
  const { data: me } = useMe()
  const canWrite = me?.permissions.includes('recalls.manage') ?? false
  const recalls = useRecalls({ patient_id: patient.id, per_page: 50 })
  const update = useUpdateRecall()
  const remove = useDeleteRecall()
  const [scheduling, setScheduling] = useState<Recall | null>(null)

  if (recalls.isPending) return <Skeleton className="h-32 w-full" />

  const list = recalls.data?.data ?? []

  return (
    <div className="space-y-3">
      {list.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted mb-2">
            <BellRing className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Este paciente no tiene recalls pendientes.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Se generan automáticamente al cobrarse un tratamiento periódico.
          </p>
        </Card>
      ) : (
        list.map((r) => (
          <Card
            key={r.id}
            className={cn(
              'p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:items-center',
              r.is_overdue && r.status === 'pending' ? 'border-rose-300' : '',
            )}
          >
            <div className="sm:col-span-5">
              <p className="font-medium text-foreground">
                {r.recall_label ?? r.treatment_name ?? '—'}
              </p>
              <p className="text-xs text-muted-foreground">
                Sugerido para {formatDate(r.due_on)}
              </p>
            </div>
            <div className="sm:col-span-3">
              {r.status === 'pending' && r.is_overdue ? (
                <Badge className="bg-rose-100 text-rose-900 border-rose-200 inline-flex items-center gap-1">
                  <AlertTriangle className="size-3" />
                  Vencido · {Math.abs(r.days_until_due ?? 0)} d
                </Badge>
              ) : (
                <Badge variant="outline" className="font-normal">
                  {RECALL_STATUS_LABELS[r.status]}
                </Badge>
              )}
            </div>
            <div className="sm:col-span-4 flex sm:justify-end gap-1.5 flex-wrap">
              {r.status === 'pending' && canWrite ? (
                <>
                  <Button size="sm" onClick={() => setScheduling(r)}>
                    <Calendar className="size-3.5" /> Agendar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (!window.confirm('¿Descartar este recall?')) return
                      update.mutate(
                        { id: r.id, payload: { status: 'dismissed' } },
                        {
                          onSuccess: () => toast.success('Recall descartado'),
                          onError: () => toast.error('No fue posible'),
                        },
                      )
                    }}
                    aria-label="Descartar recall"
                  >
                    <X className="size-3.5" />
                  </Button>
                </>
              ) : null}
              {r.status === 'scheduled' && canWrite ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    update.mutate(
                      { id: r.id, payload: { status: 'completed' } },
                      {
                        onSuccess: () => toast.success('Recall completado'),
                        onError: () => toast.error('No fue posible'),
                      },
                    )
                  }
                >
                  <CheckCircle2 className="size-3.5" /> Completar
                </Button>
              ) : null}
              {me?.roles.includes('admin') ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => {
                    if (!window.confirm('¿Eliminar este recall?')) return
                    remove.mutate(r.id, {
                      onSuccess: () => toast.success('Recall eliminado'),
                      onError: () => toast.error('No fue posible'),
                    })
                  }}
                  aria-label="Eliminar recall"
                >
                  <X className="size-3.5" />
                </Button>
              ) : null}
            </div>
          </Card>
        ))
      )}

      {scheduling ? (
        <AppointmentDialog
          open={!!scheduling}
          onOpenChange={(o) => {
            if (!o) setScheduling(null)
          }}
          initialDate={new Date(scheduling.due_on + 'T09:00:00')}
          initialPatient={patient}
          initialTreatmentId={scheduling.treatment_id}
          onCreated={(appt) => {
            update.mutate(
              {
                id: scheduling.id,
                payload: {
                  scheduled_appointment_id: appt.id,
                  status: 'scheduled',
                },
              },
              {
                onSuccess: () => toast.success('Recall agendado'),
                onError: () =>
                  toast.error('La cita se creó pero no se vinculó el recall'),
              },
            )
            setScheduling(null)
          }}
        />
      ) : null}
    </div>
  )
}
