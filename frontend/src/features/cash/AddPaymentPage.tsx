import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Banknote,
  CreditCard as CardIcon,
  Landmark,
  Loader2,
  Wallet,
} from 'lucide-react'
import {
  useAddPayment,
  useCharge,
  useCurrentCashSession,
  usePatientAccount,
} from './hooks'
import { openChargeTicket } from './openChargeTicket'
import { useBranding } from '@/shared/theme/ThemeProvider'
import { useConfirm } from '@/shared/ui/confirm'
import type { PaymentMethod } from '@/shared/types/cash'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { Card, CardContent } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Skeleton } from '@/shared/ui/skeleton'
import { Separator } from '@/shared/ui/separator'
import { cn, formatMXN } from '@/shared/lib/utils'

const METHODS: { value: PaymentMethod; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'cash', label: 'Efectivo', icon: Banknote },
  { value: 'card', label: 'Débito', icon: CardIcon },
  { value: 'card_credit', label: 'Crédito', icon: CardIcon },
  { value: 'transfer', label: 'Transferencia', icon: Landmark },
  { value: 'credit', label: 'Saldo a favor', icon: Wallet },
]

const QUICK_AMOUNTS = [100, 200, 500, 1000] as const

function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
}

export function AddPaymentPage() {
  const params = useParams<{ id: string }>()
  const id = params.id ? Number(params.id) : undefined
  const navigate = useNavigate()
  const charge = useCharge(id)
  const session = useCurrentCashSession()
  const mutation = useAddPayment(id ?? 0)
  const { branding } = useBranding()
  const confirm = useConfirm()
  const account = usePatientAccount(charge.data?.patient_id)
  const availableCredit = account.data?.totals.credit_balance ?? 0

  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (charge.data && amount === '') {
      setAmount(String(charge.data.balance))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [charge.data])

  if (!id || Number.isNaN(id)) return <Navigate to="/caja" replace />

  const balance = charge.data?.balance ?? 0
  const value = Number(amount) || 0
  const remaining = +(balance - value).toFixed(2)
  const overpayment = +Math.max(0, value - balance).toFixed(2)
  const isPaid = charge.data?.status === 'paid'
  const isCancelled = charge.data?.status === 'cancelled'
  const blocked = !session.data || isPaid || isCancelled
  const exceedsCredit =
    method === 'credit' && value > availableCredit + 0.001

  const setAmountTo = (n: number) => setAmount(String(n))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (value <= 0) {
      toast.error('Monto inválido')
      return
    }
    if (exceedsCredit) {
      toast.error(
        `El saldo a favor disponible es ${formatMXN(availableCredit)}`,
      )
      return
    }
    // Si el monto excede el saldo pendiente, pedir confirmación para
    // registrar el excedente como saldo a favor del paciente.
    if (overpayment > 0.001) {
      const ok = await confirm({
        title: '¿Registrar excedente como saldo a favor?',
        description: (
          <span>
            El pago de <strong>{formatMXN(value)}</strong> excede en{' '}
            <strong className="text-emerald-700">
              {formatMXN(overpayment)}
            </strong>{' '}
            el saldo pendiente. El excedente se acreditará a la cuenta del
            paciente.
          </span>
        ),
        confirmText: 'Sí, registrar saldo a favor',
        cancelText: 'Volver',
      })
      if (!ok) return
    }
    mutation.mutate(
      {
        method,
        amount: value,
        reference: reference || null,
        notes: notes || null,
        overpayment_credit_amount: overpayment > 0 ? overpayment : undefined,
      },
      {
        onSuccess: (c) => {
          if (branding?.ticket_auto_print) {
            openChargeTicket(c.id)
          } else {
            toast.success(
              c.balance <= 0 ? 'Cobro pagado en su totalidad' : 'Pago registrado',
              {
                action: {
                  label: 'Imprimir ticket',
                  onClick: () => openChargeTicket(c.id),
                },
                duration: 6000,
              },
            )
          }
          navigate('/caja', { replace: true })
        },
        onError: (err: unknown) => {
          const msg =
            err && typeof err === 'object' && 'response' in err
              ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
              : undefined
          toast.error(msg ?? 'No fue posible registrar el pago')
        },
      },
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 space-y-6">
      <Link
        to="/caja"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Caja
      </Link>

      {charge.isPending || !charge.data ? (
        <Card>
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      ) : (
        <>
          <header className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">{charge.data.code}</span>
              <Badge
                variant={
                  charge.data.status === 'paid'
                    ? 'secondary'
                    : charge.data.status === 'partial'
                      ? 'default'
                      : charge.data.status === 'cancelled'
                        ? 'destructive'
                        : 'outline'
                }
              >
                {charge.data.status === 'pending' && 'Pendiente'}
                {charge.data.status === 'partial' && 'Parcial'}
                {charge.data.status === 'paid' && 'Pagado'}
                {charge.data.status === 'cancelled' && 'Cancelado'}
              </Badge>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Registrar pago
            </h1>
            <p className="text-sm text-muted-foreground">
              {charge.data.patient_name} · {formatDateTime(charge.data.created_at)}
            </p>
          </header>

          <Card>
            <CardContent className="p-5 space-y-1 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Total</span>
                <span className="tabular-nums">{formatMXN(charge.data.total)}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Pagado</span>
                <span className="tabular-nums">{formatMXN(charge.data.paid_total)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between font-semibold text-base">
                <span>Saldo pendiente</span>
                <span
                  className={
                    'tabular-nums ' + (balance <= 0 ? 'text-emerald-600' : 'text-foreground')
                  }
                >
                  {formatMXN(balance)}
                </span>
              </div>
            </CardContent>
          </Card>

          {blocked ? (
            <Card className="border-amber-300/60 bg-amber-50/40 dark:bg-amber-950/20">
              <CardContent className="p-4 text-sm">
                {isPaid ? (
                  <p className="text-foreground">
                    Este cobro ya está pagado en su totalidad. No hay nada por abonar.
                  </p>
                ) : isCancelled ? (
                  <p className="text-foreground">
                    Este cobro está cancelado. No puedes registrar pagos.
                  </p>
                ) : (
                  <p className="text-foreground">
                    Abre tu sesión de caja antes de registrar el pago.{' '}
                    <Link to="/caja" className="text-primary underline">
                      Ir a Caja
                    </Link>
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6">
              <Card>
                <CardContent className="p-5 space-y-5">
                  <div className="space-y-2">
                    <Label>Método de pago</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {METHODS.map((m) => {
                        const Icon = m.icon
                        const active = method === m.value
                        const disabled =
                          m.value === 'credit' && availableCredit <= 0
                        return (
                          <button
                            key={m.value}
                            type="button"
                            disabled={disabled}
                            onClick={() => {
                              setMethod(m.value)
                              // Si el método es credit, sugerir el menor entre
                              // saldo disponible y saldo pendiente.
                              if (m.value === 'credit') {
                                const max = Math.min(availableCredit, balance)
                                if (max > 0) setAmount(String(max.toFixed(2)))
                              }
                            }}
                            className={cn(
                              'flex flex-col items-center justify-center gap-1.5 rounded-md border p-3 text-sm transition-colors',
                              active
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'hover:bg-accent text-muted-foreground',
                              disabled && 'opacity-40 cursor-not-allowed hover:bg-transparent',
                            )}
                          >
                            <Icon className="size-5" />
                            <span>{m.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="amount">Monto</Label>
                      <button
                        type="button"
                        className="text-xs text-primary hover:underline"
                        onClick={() => setAmount(String(balance))}
                      >
                        Pagar saldo completo
                      </button>
                    </div>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min={0}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="text-2xl font-semibold h-14 tabular-nums"
                    />
                    <div className="flex flex-wrap gap-2 pt-1">
                      {QUICK_AMOUNTS.map((q) =>
                        q < balance ? (
                          <button
                            key={q}
                            type="button"
                            onClick={() => setAmountTo(q)}
                            className="text-xs rounded-full border px-3 py-1 hover:bg-accent transition"
                          >
                            +{formatMXN(q)}
                          </button>
                        ) : null,
                      )}
                    </div>
                    {method === 'credit' && availableCredit > 0 ? (
                      <p className="text-xs text-emerald-700">
                        Saldo a favor disponible: {formatMXN(availableCredit)}
                      </p>
                    ) : null}
                    {exceedsCredit ? (
                      <p className="text-xs text-destructive">
                        Excede el saldo a favor disponible.
                      </p>
                    ) : null}
                    {overpayment > 0 ? (
                      <p className="text-xs text-emerald-700">
                        Excedente de {formatMXN(overpayment)} se registrará como
                        saldo a favor del paciente.
                      </p>
                    ) : null}
                    <p className="text-xs text-muted-foreground tabular-nums">
                      Saldo después del pago:{' '}
                      <span
                        className={
                          'font-medium ' +
                          (remaining <= 0 ? 'text-emerald-600' : 'text-foreground')
                        }
                      >
                        {formatMXN(Math.max(0, remaining))}
                      </span>
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reference">
                      Referencia{' '}
                      <span className="text-xs text-muted-foreground">(opcional)</span>
                    </Label>
                    <Input
                      id="reference"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder={
                        method === 'card'
                          ? 'Últimos 4 dígitos de la tarjeta'
                          : method === 'transfer'
                            ? 'Folio o referencia de la transferencia'
                            : 'Nota corta'
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="notes">
                      Notas <span className="text-xs text-muted-foreground">(opcional)</span>
                    </Label>
                    <Textarea
                      id="notes"
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => navigate('/caja')}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={mutation.isPending || exceedsCredit || value <= 0}
                >
                  {mutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Registrar pago de {formatMXN(value || 0)}
                </Button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  )
}
