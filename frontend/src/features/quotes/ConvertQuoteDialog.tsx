import { useMemo, useState } from 'react'
import { Loader2, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { useConvertQuote } from './hooks'
import { useCurrentCashSession } from '@/features/cash/hooks'
import type { Quote } from '@/shared/types/quote'
import type { PaymentMethod } from '@/shared/types/cash'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Separator } from '@/shared/ui/separator'
import { cn, formatMXN } from '@/shared/lib/utils'

interface PaymentDraft {
  uid: string
  method: PaymentMethod
  amount: string
  reference: string
}

function uid(): string {
  return Math.random().toString(36).slice(2, 11)
}

function newPayment(suggested = 0): PaymentDraft {
  return {
    uid: uid(),
    method: 'cash',
    amount: suggested > 0 ? String(suggested) : '',
    reference: '',
  }
}

interface Props {
  quote: Quote
  open: boolean
  onOpenChange: (open: boolean) => void
  onConverted?: (chargeId: number) => void
}

export function ConvertQuoteDialog({ quote, open, onOpenChange, onConverted }: Props) {
  const session = useCurrentCashSession()
  const convert = useConvertQuote(quote.id)
  const [notes, setNotes] = useState('')
  const [payments, setPayments] = useState<PaymentDraft[]>([])

  const totals = useMemo(() => {
    const paid = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0)
    return {
      paid: +paid.toFixed(2),
      balance: +(quote.total - paid).toFixed(2),
    }
  }, [payments, quote.total])

  const updatePayment = (uid: string, patch: Partial<PaymentDraft>) =>
    setPayments((p) => p.map((it) => (it.uid === uid ? { ...it, ...patch } : it)))
  const removePayment = (uid: string) =>
    setPayments((p) => p.filter((it) => it.uid !== uid))

  const onSubmit = () => {
    if (totals.paid > quote.total + 0.001) {
      toast.error('Los pagos exceden el total a cobrar')
      return
    }
    convert.mutate(
      {
        notes: notes || null,
        payments:
          payments.length > 0
            ? payments
                .filter((p) => Number(p.amount) > 0)
                .map((p) => ({
                  method: p.method,
                  amount: Number(p.amount),
                  reference: p.reference || null,
                }))
            : undefined,
      },
      {
        onSuccess: ({ charge }) => {
          toast.success(`Cobro ${charge.code ?? '#' + charge.id} creado`)
          onOpenChange(false)
          setPayments([])
          setNotes('')
          onConverted?.(charge.id)
        },
        onError: (e: unknown) => {
          const msg =
            e && typeof e === 'object' && 'response' in e
              ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
              : undefined
          toast.error(msg ?? 'No fue posible convertir la cotización')
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Convertir cotización en cobro</DialogTitle>
          <DialogDescription>
            Se generará un cobro a {quote.patient_name ?? 'el paciente'} por{' '}
            <strong>{formatMXN(quote.total)}</strong>. Puedes registrar pagos
            iniciales o dejar el cobro pendiente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Nota del cobro (opcional)</Label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={`Generado desde cotización ${quote.code ?? ''}`}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Pagos iniciales (opcional)</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setPayments((p) => [...p, newPayment(Math.max(0, totals.balance))])
                }
                disabled={!session.data}
              >
                <Plus className="size-4" /> Agregar pago
              </Button>
            </div>

            {!session.data ? (
              <p className="text-xs rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-3 text-foreground">
                La caja está cerrada. El cobro quedará pendiente y podrás abonar después.
              </p>
            ) : payments.length === 0 ? (
              <p className="text-xs text-muted-foreground rounded-md border border-dashed p-3 text-center">
                Sin pagos = el cobro queda pendiente.
              </p>
            ) : (
              <div className="space-y-3">
                {payments.map((p, idx) => (
                  <div key={p.uid} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Pago {idx + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() => removePayment(p.uid)}
                        className="text-muted-foreground hover:text-destructive p-1 -mr-1"
                        aria-label="Quitar pago"
                      >
                        <X className="size-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[11px]">Método</Label>
                        <Select
                          value={p.method}
                          onValueChange={(v) =>
                            updatePayment(p.uid, { method: v as PaymentMethod })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Efectivo</SelectItem>
                            <SelectItem value="card">Tarjeta</SelectItem>
                            <SelectItem value="transfer">Transferencia</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px]">Monto</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={p.amount}
                          onChange={(e) =>
                            updatePayment(p.uid, { amount: e.target.value })
                          }
                          className="tabular-nums"
                        />
                      </div>
                    </div>
                    <Input
                      placeholder={
                        p.method === 'card'
                          ? 'Últimos 4 dígitos (opcional)'
                          : p.method === 'transfer'
                            ? 'Referencia (opcional)'
                            : 'Nota (opcional)'
                      }
                      value={p.reference}
                      onChange={(e) =>
                        updatePayment(p.uid, { reference: e.target.value })
                      }
                    />
                  </div>
                ))}
                <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Pagado</span>
                    <span className="tabular-nums">{formatMXN(totals.paid)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Saldo</span>
                    <span
                      className={cn(
                        'tabular-nums',
                        totals.balance <= 0 ? 'text-emerald-600' : 'text-foreground',
                      )}
                    >
                      {formatMXN(totals.balance)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={convert.isPending}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={onSubmit} disabled={convert.isPending}>
            {convert.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Convertir en cobro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
