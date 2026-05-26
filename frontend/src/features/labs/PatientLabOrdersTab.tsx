import { useState } from 'react'
import { AlertTriangle, Microscope, Pencil, Plus } from 'lucide-react'
import { useLabOrders } from './hooks'
import { LabOrderFormDialog } from './LabOrderFormDialog'
import { LabOrderStatusMenu } from './LabOrderStatusMenu'
import { useMe } from '@/features/auth/hooks'
import type { Patient } from '@/shared/types/patient'
import {
  LAB_ORDER_STATUS_LABELS,
  type LabOrder,
} from '@/shared/types/lab'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Skeleton } from '@/shared/ui/skeleton'
import { cn, formatMXN } from '@/shared/lib/utils'

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-900 border-slate-200',
  in_progress: 'bg-amber-100 text-amber-900 border-amber-200',
  received: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  delivered: 'bg-primary/10 text-primary border-primary/20',
  cancelled: 'bg-muted text-muted-foreground border-dashed',
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function isOverdue(order: LabOrder): boolean {
  if (!order.due_on) return false
  if (order.status === 'received' || order.status === 'delivered') return false
  if (order.status === 'cancelled') return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(order.due_on + 'T00:00:00') < today
}

interface Props {
  patient: Patient
}

export function PatientLabOrdersTab({ patient }: Props) {
  const { data: me } = useMe()
  const canWrite = me?.permissions.includes('labs.manage') ?? false
  const orders = useLabOrders({ patient_id: patient.id, per_page: 100 })
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<LabOrder | null>(null)

  const onNew = () => {
    setEditing(null)
    setOpen(true)
  }

  if (orders.isPending) {
    return <Skeleton className="h-40 w-full" />
  }

  const list = orders.data?.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">
          {list.length} órdenes registradas
        </p>
        {canWrite ? (
          <Button onClick={onNew}>
            <Plus className="size-4" /> Nueva orden
          </Button>
        ) : null}
      </div>

      {list.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted mb-2">
            <Microscope className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Este paciente aún no tiene órdenes de laboratorio.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {list.map((o) => {
            const overdue = isOverdue(o)
            return (
              <Card
                key={o.id}
                className={cn(
                  'p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:items-center',
                  overdue && 'border-rose-300',
                )}
              >
                <div className="sm:col-span-5">
                  <p className="font-medium text-foreground">
                    {o.work_type ?? 'Trabajo de laboratorio'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {o.lab_name}
                    {o.treatment_name ? ` · ${o.treatment_name}` : ''}
                  </p>
                  {o.dentist_name ? (
                    <p className="text-xs text-muted-foreground">
                      {o.dentist_name}
                    </p>
                  ) : null}
                </div>
                <div className="sm:col-span-3 text-xs space-y-0.5">
                  <p>
                    <span className="text-muted-foreground">Enviada:</span>{' '}
                    {formatDate(o.sent_on)}
                  </p>
                  <p
                    className={cn(
                      overdue ? 'text-rose-700 font-medium' : '',
                    )}
                  >
                    {overdue ? (
                      <AlertTriangle className="inline size-3 mr-1" />
                    ) : null}
                    <span className="text-muted-foreground">Esperada:</span>{' '}
                    {formatDate(o.due_on)}
                  </p>
                  {o.received_on ? (
                    <p>
                      <span className="text-muted-foreground">Recibida:</span>{' '}
                      {formatDate(o.received_on)}
                    </p>
                  ) : null}
                </div>
                <div className="sm:col-span-2">
                  <Badge
                    variant="outline"
                    className={cn('font-normal', STATUS_BADGE[o.status])}
                  >
                    {LAB_ORDER_STATUS_LABELS[o.status]}
                  </Badge>
                  <p className="text-xs text-muted-foreground tabular-nums mt-1">
                    {formatMXN(o.cost)}
                  </p>
                </div>
                <div className="sm:col-span-2 flex sm:justify-end gap-1">
                  <LabOrderStatusMenu order={o} />
                  {canWrite ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditing(o)
                        setOpen(true)
                      }}
                      aria-label="Editar orden"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                  ) : null}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <LabOrderFormDialog
        open={open}
        onOpenChange={setOpen}
        order={editing}
        presetPatient={patient}
      />
    </div>
  )
}
