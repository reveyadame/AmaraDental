import { toast } from 'sonner'
import { Loader2, Printer, ScrollText, Trash2 } from 'lucide-react'
import { useDeletePrescription, usePrescription } from './hooks'
import { useMe } from '@/features/auth/hooks'
import { useConfirm } from '@/shared/ui/confirm'
import { ROUTE_LABEL } from '@/shared/types/prescription'
import { specialtyLabel } from '@/features/specialists/specialties'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { Separator } from '@/shared/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'

interface Props {
  patientId: number
  prescriptionId: number | null
  onOpenChange: (open: boolean) => void
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function PrescriptionDetailDialog({
  patientId,
  prescriptionId,
  onOpenChange,
}: Props) {
  const { data: me } = useMe()
  const query = usePrescription(prescriptionId ?? undefined)
  const del = useDeletePrescription(patientId)
  const confirm = useConfirm()

  const canDelete = me?.permissions.includes('prescriptions.delete') ?? false

  const openPrint = () => {
    if (!query.data) return
    window.open(`/recetas/${query.data.id}/imprimir`, '_blank', 'noopener')
  }

  const onDelete = async () => {
    if (!query.data) return
    const ok = await confirm({
      title: '¿Eliminar esta receta?',
      description: 'Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      variant: 'destructive',
    })
    if (!ok) return
    del.mutate(query.data.id, {
      onSuccess: () => {
        toast.success('Receta eliminada')
        onOpenChange(false)
      },
      onError: () => toast.error('No fue posible eliminar'),
    })
  }

  return (
    <Dialog open={!!prescriptionId} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScrollText className="size-5 text-primary" />
            Receta {query.data?.code ?? ''}
          </DialogTitle>
          <DialogDescription>
            Emitida {formatDateTime(query.data?.issued_at ?? null)}
          </DialogDescription>
        </DialogHeader>

        {query.isPending || !query.data ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Paciente
                </p>
                <p className="font-medium text-foreground">{query.data.patient_name}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Prescriptor
                </p>
                <p className="font-medium text-foreground">{query.data.specialist_name}</p>
                <p className="text-xs text-muted-foreground">
                  {specialtyLabel(query.data.specialist_specialty)}
                  {query.data.specialist_cedula
                    ? ` · Céd. ${query.data.specialist_cedula}`
                    : ''}
                </p>
              </div>
            </div>

            {query.data.diagnosis ? (
              <section>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Diagnóstico
                </p>
                <p className="text-sm whitespace-pre-wrap">{query.data.diagnosis}</p>
              </section>
            ) : null}

            <Separator />

            <section className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Medicamentos
              </p>
              <ol className="space-y-3">
                {query.data.items.map((it, idx) => (
                  <li key={it.id} className="rounded-md border p-3">
                    <p className="text-sm font-medium text-foreground">
                      {idx + 1}. {it.medication}
                      {it.presentation ? (
                        <span className="text-muted-foreground font-normal">
                          {' · '}
                          {it.presentation}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="font-medium text-foreground">{it.dosage}</span>
                      {it.route ? ` · vía ${ROUTE_LABEL[it.route] ?? it.route}` : ''}
                      {' · '}
                      {it.frequency} · durante {it.duration}
                    </p>
                    {it.instructions ? (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        {it.instructions}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>
            </section>

            {query.data.notes ? (
              <section className="rounded-md bg-muted/40 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Indicaciones
                </p>
                <p className="text-sm whitespace-pre-wrap">{query.data.notes}</p>
              </section>
            ) : null}
          </div>
        )}

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <div>
            {canDelete && query.data ? (
              <Button
                variant="ghost"
                className="text-destructive"
                onClick={onDelete}
                disabled={del.isPending}
              >
                {del.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Eliminar
              </Button>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
            {query.data ? (
              <Button onClick={openPrint}>
                <Printer className="size-4" /> Imprimir / PDF
              </Button>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
