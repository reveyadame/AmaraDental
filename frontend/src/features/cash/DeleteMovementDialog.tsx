import { useEffect, useState } from 'react'
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import {
  deleteCashExpenseWithDeps,
  deleteChargePayment,
  type MovementDependencies,
} from './api'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { formatMXN } from '@/shared/lib/utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Tipo de movimiento a eliminar. */
  kind: 'payment' | 'expense'
  /** ID del payment o del expense. */
  movementId: number
  /** Descripción corta — solo para el diálogo. */
  label?: string
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

/**
 * Borra un ingreso (ChargePayment) o egreso (CashExpense). Hace primero un
 * intento "soft" — si el backend responde 409 con dependencias, las muestra
 * y pide confirmación explícita antes de borrar en cascada.
 */
export function DeleteMovementDialog({
  open,
  onOpenChange,
  kind,
  movementId,
  label,
}: Props) {
  const qc = useQueryClient()
  const [step, setStep] = useState<'confirming' | 'reviewing'>('confirming')
  const [dependencies, setDependencies] = useState<MovementDependencies | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  // Resetea cuando se abre.
  useEffect(() => {
    if (open) {
      setStep('confirming')
      setDependencies(null)
      setMessage(null)
      setPending(false)
    }
  }, [open])

  const callDelete = async (force: boolean) => {
    const fn = kind === 'payment' ? deleteChargePayment : deleteCashExpenseWithDeps
    return fn(movementId, force)
  }

  const onConfirmDelete = async () => {
    setPending(true)
    try {
      const result = await callDelete(false)
      if (result.ok) {
        toast.success(kind === 'payment' ? 'Pago eliminado' : 'Egreso eliminado')
        invalidate()
        onOpenChange(false)
      } else {
        // 409 — hay dependencias.
        setDependencies(result.dependencies ?? null)
        setMessage(result.message ?? null)
        setStep('reviewing')
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      toast.error(msg ?? 'No fue posible eliminar')
    } finally {
      setPending(false)
    }
  }

  const onForceDelete = async () => {
    setPending(true)
    try {
      const result = await callDelete(true)
      if (result.ok) {
        toast.success(
          kind === 'payment'
            ? 'Pago eliminado junto con sus dependencias'
            : 'Egreso eliminado junto con sus dependencias',
        )
        invalidate()
        onOpenChange(false)
      } else {
        toast.error('No fue posible eliminar las dependencias.')
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      toast.error(msg ?? 'No fue posible eliminar')
    } finally {
      setPending(false)
    }
  }

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['cash-sessions'] })
    qc.invalidateQueries({ queryKey: ['cash-expenses'] })
    qc.invalidateQueries({ queryKey: ['charges'] })
    qc.invalidateQueries({ queryKey: ['commissions'] })
    qc.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const isExpense = kind === 'expense'

  // Normalizar dependencias para render uniforme.
  const commissions = dependencies
    ? [
        ...(dependencies.commission_payments ?? []),
        ...(dependencies.commission_payment
          ? [dependencies.commission_payment]
          : []),
      ]
    : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="size-5 text-destructive" />
            {step === 'confirming'
              ? `Eliminar ${isExpense ? 'egreso' : 'pago'}`
              : 'Confirmar eliminación en cascada'}
          </DialogTitle>
          <DialogDescription>
            {step === 'confirming'
              ? `Esta acción elimina el ${isExpense ? 'egreso' : 'pago'} de la bitácora. Solo se permite si la sesión sigue abierta.`
              : message ??
                'Al eliminar este movimiento se revertirán también los registros que dependían de él.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'confirming' ? (
          <div className="space-y-3">
            {label ? (
              <div className="rounded-md bg-muted/40 border p-3 text-sm">
                {label}
              </div>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Si este movimiento generó un pago de comisión o se aplicó a un
              cobro, se mostrará un resumen antes de proceder con la cascada.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/40 p-3 text-xs space-y-2">
              <p className="flex items-center gap-1.5 font-medium text-amber-900 dark:text-amber-200">
                <AlertTriangle className="size-3.5" />
                Se eliminarán las siguientes dependencias:
              </p>
              {commissions.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wide text-amber-800 dark:text-amber-300/80">
                    Pago{commissions.length > 1 ? 's' : ''} de comisión
                    {dependencies?.items_count
                      ? ` · ${dependencies.items_count} ${dependencies.items_count === 1 ? 'item' : 'items'} se liberan`
                      : ''}
                  </p>
                  {commissions.map((c) => (
                    <div
                      key={c.id}
                      className="rounded bg-background border px-2 py-1.5 flex justify-between text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {c.specialist_name ?? 'Especialista'}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatDate(c.paid_at)}
                        </p>
                      </div>
                      <span className="tabular-nums font-semibold">
                        {formatMXN(c.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Los items afectados volverán a aparecer como pendientes de
              liquidar en "Pago de comisiones".
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancelar
          </Button>
          {step === 'confirming' ? (
            <Button
              type="button"
              variant="destructive"
              onClick={onConfirmDelete}
              disabled={pending}
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Eliminar
            </Button>
          ) : (
            <Button
              type="button"
              variant="destructive"
              onClick={onForceDelete}
              disabled={pending}
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Sí, eliminar todo
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
