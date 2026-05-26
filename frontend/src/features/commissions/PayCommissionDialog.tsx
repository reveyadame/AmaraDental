import { useState } from 'react'
import {
  AlertTriangle,
  Banknote,
  CreditCard as CardIcon,
  HandCoins,
  Landmark,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useCreateCommissionPayment } from './hooks'
import type { PaymentMethod } from '@/shared/types/cash'
import type { PendingCommissionGroup } from '@/shared/types/commission'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { cn, formatMXN } from '@/shared/lib/utils'
import { useAuth } from '@/shared/auth/permissions'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Especialista y items seleccionados a pagar. */
  group: PendingCommissionGroup
  selectedItemIds: number[]
}

const METHODS: { value: PaymentMethod; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'cash', label: 'Efectivo', icon: Banknote },
  { value: 'card', label: 'Tarjeta', icon: CardIcon },
  { value: 'transfer', label: 'Transferencia', icon: Landmark },
]

export function PayCommissionDialog({
  open,
  onOpenChange,
  group,
  selectedItemIds,
}: Props) {
  const mutation = useCreateCommissionPayment()
  const { can } = useAuth()
  // Registrar el pago como egreso requiere también el rol Caja.
  const canOperateCash = can('cash.operate')
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [asExpense, setAsExpense] = useState(true)

  const items = group.items.filter((i) => selectedItemIds.includes(i.id))
  const total = items.reduce((s, i) => s + i.commission_amount, 0)
  const advances = items.filter((i) => i.charge_status !== 'paid')
  const advanceTotal = advances.reduce((s, i) => s + i.commission_amount, 0)

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) {
      toast.error('Selecciona al menos una comisión a pagar')
      return
    }
    mutation.mutate(
      {
        specialist_id: group.specialist_id,
        charge_item_ids: selectedItemIds,
        method,
        reference: reference.trim() || null,
        notes: notes.trim() || null,
        register_as_expense: asExpense && canOperateCash,
      },
      {
        onSuccess: () => {
          toast.success(
            `Pago registrado · ${formatMXN(total)} a ${group.specialist_name}`,
          )
          onOpenChange(false)
        },
        onError: (err: unknown) => {
          const errs =
            err && typeof err === 'object' && 'response' in err
              ? (err as { response?: { data?: { message?: string } } }).response?.data
              : undefined
          toast.error(errs?.message ?? 'No fue posible registrar el pago')
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandCoins className="size-5 text-primary" /> Pagar comisiones
          </DialogTitle>
          <DialogDescription>
            Liquidación a <span className="font-medium">{group.specialist_name}</span> por{' '}
            <span className="font-semibold tabular-nums">{formatMXN(total)}</span>{' '}
            ({items.length} {items.length === 1 ? 'item' : 'items'}).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {advances.length > 0 ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/40 p-3 text-xs space-y-1">
              <p className="flex items-center gap-1.5 font-medium text-amber-900 dark:text-amber-200">
                <AlertTriangle className="size-3.5" />
                Anticipo de {formatMXN(advanceTotal)} sobre saldos pendientes
              </p>
              <p className="text-amber-800 dark:text-amber-300/80">
                {advances.length}{' '}
                {advances.length === 1 ? 'item proviene' : 'items provienen'} de
                cobros que aún no se liquidan en su totalidad. Estás pagando la
                comisión por adelantado.
              </p>
            </div>
          ) : null}

          <div className="rounded-md border bg-muted/30 p-3 max-h-40 overflow-y-auto space-y-1">
            {items.map((i) => (
              <div key={i.id} className="flex justify-between text-xs">
                <span className="truncate pr-2">
                  {i.patient_name} · {i.treatment_name}
                </span>
                <span className="tabular-nums font-medium">
                  {formatMXN(i.commission_amount)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label>Método de pago</Label>
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map((m) => {
                const Icon = m.icon
                return (
                  <button
                    type="button"
                    key={m.value}
                    onClick={() => setMethod(m.value)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-xs transition-colors',
                      method === m.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent',
                    )}
                  >
                    <Icon className="size-4" />
                    {m.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="comm-ref">Referencia (opcional)</Label>
            <Input
              id="comm-ref"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Folio, transferencia, recibo…"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="comm-notes">Notas (opcional)</Label>
            <Textarea
              id="comm-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <label
            className={`flex items-start gap-2 rounded-md border p-3 ${
              canOperateCash ? 'cursor-pointer' : 'opacity-70 cursor-not-allowed'
            }`}
          >
            <input
              type="checkbox"
              checked={asExpense && canOperateCash}
              disabled={!canOperateCash}
              onChange={(e) => setAsExpense(e.target.checked)}
              className="mt-1 size-4 accent-primary cursor-pointer disabled:cursor-not-allowed"
            />
            <span className="text-sm leading-tight">
              <span className="font-medium block">Registrar como egreso de caja</span>
              <span className="text-xs text-muted-foreground">
                {canOperateCash
                  ? 'Genera un egreso en tu caja abierta con categoría "Comisión". Requiere tener caja abierta.'
                  : 'Necesitas el rol Caja para registrar el egreso. El pago queda solo como pago de comisión sin impactar caja.'}
              </span>
            </span>
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Registrar pago · {formatMXN(total)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
