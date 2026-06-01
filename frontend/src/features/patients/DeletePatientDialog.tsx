import { useMemo } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { useDeletePatient, usePatientDeletePreview } from './hooks'
import type { PatientBlockerKey } from './api'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog'
import { cn } from '@/shared/lib/utils'

const BLOCKER_LABEL: Record<PatientBlockerKey, string> = {
  appointments: 'Citas',
  charges: 'Cobros',
  quotes: 'Cotizaciones',
  prescriptions: 'Recetas',
  consents: 'Consentimientos',
  memberships: 'Membresías',
  lab_orders: 'Órdenes a laboratorio',
  recalls: 'Recalls',
  tooth_states: 'Odontograma',
  dental_treatment_logs: 'Bitácora de tratamientos',
  endodontic_records: 'Endodoncia',
}

interface Props {
  patientId: number
  patientName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeletePatientDialog({ patientId, patientName, open, onOpenChange }: Props) {
  const navigate = useNavigate()
  const preview = usePatientDeletePreview(patientId, open)
  const del = useDeletePatient()

  const entries = useMemo(() => {
    const b = preview.data?.blockers ?? {}
    return Object.entries(b)
      .filter(([, n]) => (n ?? 0) > 0)
      .map(([key, n]) => ({
        key: key as PatientBlockerKey,
        label: BLOCKER_LABEL[key as PatientBlockerKey] ?? key,
        count: n ?? 0,
      }))
  }, [preview.data])

  const canDelete = preview.data?.can_delete ?? false

  const onConfirm = () => {
    del.mutate(patientId, {
      onSuccess: () => {
        toast.success('Paciente eliminado')
        onOpenChange(false)
        navigate('/pacientes', { replace: true })
      },
      onError: (e: unknown) => {
        // 409 = se acumularon registros entre el preview y el delete.
        const status =
          e && typeof e === 'object' && 'response' in e
            ? (e as { response?: { status?: number } }).response?.status
            : undefined
        const msg =
          e && typeof e === 'object' && 'response' in e
            ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
            : undefined
        if (status === 409) {
          toast.error(msg ?? 'El paciente ya tiene registros asociados.')
          // Refresca el preview para mostrar lo que apareció.
          preview.refetch()
        } else {
          toast.error(msg ?? 'No fue posible eliminar el paciente')
        }
      },
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="size-5" />
            </span>
            <div className="space-y-2">
              <AlertDialogTitle>¿Eliminar a {patientName}?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta opción es solo para pacientes capturados por error o
                duplicados. La eliminación es definitiva y no se puede deshacer.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="text-sm">
          {preview.isPending ? (
            <p className="text-muted-foreground flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" /> Verificando registros…
            </p>
          ) : preview.error ? (
            <p className="text-destructive">
              No fue posible verificar los registros del paciente.
            </p>
          ) : canDelete ? (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 p-3 text-foreground">
              El paciente no tiene registros asociados. Puede eliminarse de forma
              segura.
            </p>
          ) : (
            <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-3 space-y-2">
              <p className="text-foreground">
                No se puede eliminar: el paciente ya tiene registros asociados.
              </p>
              <ul className="text-xs text-foreground/80 space-y-0.5">
                {entries.map((e) => (
                  <li key={e.key} className="flex items-center justify-between gap-3">
                    <span>{e.label}</span>
                    <span className="tabular-nums font-semibold">{e.count}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-muted-foreground">
                Si necesitas que el paciente ya no aparezca activo, edítalo y
                desmarca «Activo» en lugar de eliminarlo.
              </p>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)} disabled={del.isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={!canDelete || del.isPending || preview.isPending}
            className={cn(
              'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/40',
            )}
          >
            {del.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Eliminar paciente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
