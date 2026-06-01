import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Banknote, CreditCard as CardIcon, Landmark, Loader2, LockKeyhole } from 'lucide-react'
import { useCloseCashSession } from './hooks'
import type { CashSession } from '@/shared/types/cash'
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
import { Separator } from '@/shared/ui/separator'
import { cn, formatMXN } from '@/shared/lib/utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: CashSession
}

function diffText(diff: number) {
  if (diff === 0) return { tone: 'text-muted-foreground', label: '(sin diferencia)' }
  if (diff > 0) return { tone: 'text-emerald-600', label: '(sobrante)' }
  return { tone: 'text-destructive', label: '(faltante)' }
}

function MethodSection({
  icon: Icon,
  label,
  expected,
  counted,
  onChange,
  helper,
  required,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  expected: number
  counted: string
  onChange: (v: string) => void
  helper?: string
  required?: boolean
}) {
  const value = Number(counted)
  const hasValue = counted !== '' && !Number.isNaN(value)
  const diff = hasValue ? +(value - expected).toFixed(2) : 0
  const dt = diffText(diff)

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Esperado
          </p>
          <p className="tabular-nums text-sm font-medium">{formatMXN(expected)}</p>
        </div>
      </div>
      <Input
        type="number"
        step="0.01"
        min={0}
        value={counted}
        onChange={(e) => onChange(e.target.value)}
        placeholder={required ? '0.00' : 'Dejar vacío si no concilias este método'}
        className="tabular-nums"
      />
      {hasValue ? (
        <p className={cn('text-xs', dt.tone)}>
          Diferencia:{' '}
          <span className="tabular-nums font-medium">
            {diff >= 0 ? '+' : ''}
            {formatMXN(diff)}
          </span>{' '}
          {dt.label}
        </p>
      ) : helper ? (
        <p className="text-[11px] text-muted-foreground">{helper}</p>
      ) : null}
    </div>
  )
}

export function CloseSessionDialog({ open, onOpenChange, session }: Props) {
  const mutation = useCloseCashSession(session.id)
  const cashCollected = session.payments_summary?.by_method?.cash ?? 0
  const cardCollected = session.payments_summary?.by_method?.card ?? 0
  const cardCreditCollected = session.payments_summary?.by_method?.card_credit ?? 0
  const transferCollected = session.payments_summary?.by_method?.transfer ?? 0
  const cashExpenses = session.expenses_summary?.by_method?.cash ?? 0
  const cardExpenses = session.expenses_summary?.by_method?.card ?? 0
  const cardCreditExpenses = session.expenses_summary?.by_method?.card_credit ?? 0
  const transferExpenses = session.expenses_summary?.by_method?.transfer ?? 0
  // Esperado = cobros − egresos por método (+ apertura para efectivo).
  const expectedCash = +(
    session.opening_amount + cashCollected - cashExpenses
  ).toFixed(2)
  const expectedCard = +(cardCollected - cardExpenses).toFixed(2)
  const expectedCardCredit = +(cardCreditCollected - cardCreditExpenses).toFixed(2)
  const expectedTransfer = +(transferCollected - transferExpenses).toFixed(2)

  const [cashCounted, setCashCounted] = useState(String(expectedCash))
  const [cardCounted, setCardCounted] = useState('')
  const [cardCreditCounted, setCardCreditCounted] = useState('')
  const [transferCounted, setTransferCounted] = useState('')
  const [notes, setNotes] = useState('')

  // Reset al abrir.
  useEffect(() => {
    if (open) {
      setCashCounted(String(expectedCash))
      setCardCounted(expectedCard > 0 ? String(expectedCard) : '')
      setCardCreditCounted(expectedCardCredit > 0 ? String(expectedCardCredit) : '')
      setTransferCounted(expectedTransfer > 0 ? String(expectedTransfer) : '')
      setNotes('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const cashNumber = Number(cashCounted) || 0
  const cashDiff = +(cashNumber - expectedCash).toFixed(2)

  const totalDifference =
    cashDiff +
    (cardCounted !== '' ? Number(cardCounted) - expectedCard : 0) +
    (cardCreditCounted !== ''
      ? Number(cardCreditCounted) - expectedCardCredit
      : 0) +
    (transferCounted !== '' ? Number(transferCounted) - expectedTransfer : 0)

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (Number.isNaN(cashNumber) || cashNumber < 0) {
      toast.error('Efectivo contado inválido')
      return
    }
    mutation.mutate(
      {
        closing_amount: cashNumber,
        card_counted: cardCounted !== '' ? Number(cardCounted) : undefined,
        card_credit_counted:
          cardCreditCounted !== '' ? Number(cardCreditCounted) : undefined,
        transfer_counted: transferCounted !== '' ? Number(transferCounted) : undefined,
        close_notes: notes || undefined,
      },
      {
        onSuccess: () => {
          if (totalDifference === 0) {
            toast.success('Caja cerrada sin diferencias')
          } else {
            toast.success(
              `Caja cerrada con diferencia total de ${formatMXN(Math.abs(totalDifference))} ` +
                (totalDifference > 0 ? '(sobrante)' : '(faltante)'),
            )
          }
          onOpenChange(false)
        },
        onError: () => toast.error('No fue posible cerrar la caja'),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LockKeyhole className="size-5 text-primary" /> Cerrar caja
          </DialogTitle>
          <DialogDescription>
            Cuenta el efectivo y concilia tarjeta y transferencia contra los reportes de tu
            terminal y bancos. Si no concilias algún método, déjalo vacío.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="rounded-lg border p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Fondo de apertura</span>
              <span className="tabular-nums">{formatMXN(session.opening_amount)}</span>
            </div>
            <Separator className="my-2" />
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
              Cobros del turno
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Efectivo</p>
                <p className="tabular-nums">{formatMXN(cashCollected)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tarj. débito</p>
                <p className="tabular-nums">{formatMXN(cardCollected)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tarj. crédito</p>
                <p className="tabular-nums">{formatMXN(cardCreditCollected)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Transferencia</p>
                <p className="tabular-nums">{formatMXN(transferCollected)}</p>
              </div>
            </div>
            {(cashExpenses > 0 ||
              cardExpenses > 0 ||
              cardCreditExpenses > 0 ||
              transferExpenses > 0) ? (
              <>
                <Separator className="my-2" />
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                  Egresos del turno
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Efectivo</p>
                    <p className="tabular-nums text-destructive">
                      −{formatMXN(cashExpenses)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tarj. débito</p>
                    <p className="tabular-nums text-destructive">
                      −{formatMXN(cardExpenses)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tarj. crédito</p>
                    <p className="tabular-nums text-destructive">
                      −{formatMXN(cardCreditExpenses)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Transferencia</p>
                    <p className="tabular-nums text-destructive">
                      −{formatMXN(transferExpenses)}
                    </p>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          <MethodSection
            icon={Banknote}
            label="Efectivo contado"
            expected={expectedCash}
            counted={cashCounted}
            onChange={setCashCounted}
            required
            helper="Apertura + cobros − egresos en efectivo."
          />

          <MethodSection
            icon={CardIcon}
            label="Tarjeta de débito confirmada"
            expected={expectedCard}
            counted={cardCounted}
            onChange={setCardCounted}
            helper="Compara contra el reporte de tu terminal (transacciones con tarjeta de débito)."
          />

          <MethodSection
            icon={CardIcon}
            label="Tarjeta de crédito confirmada"
            expected={expectedCardCredit}
            counted={cardCreditCounted}
            onChange={setCardCreditCounted}
            helper="Compara contra el reporte de tu terminal (transacciones con tarjeta de crédito)."
          />

          <MethodSection
            icon={Landmark}
            label="Transferencia confirmada"
            expected={expectedTransfer}
            counted={transferCounted}
            onChange={setTransferCounted}
            helper="Compara contra el estado de cuenta (descontando egresos por transferencia)."
          />

          <div className="space-y-1.5">
            <Label htmlFor="close_notes">Notas (opcional)</Label>
            <Textarea
              id="close_notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Justificación de diferencias, observaciones del turno…"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Cerrar caja
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
