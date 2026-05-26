import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Plus, ReceiptText, Sparkles, Trash2, X } from 'lucide-react'
import { useCreateCharge, useCurrentCashSession } from './hooks'
import { openChargeTicket } from './openChargeTicket'
import { useBranding } from '@/shared/theme/ThemeProvider'
import { PatientPicker } from './PatientPicker'
import { useTreatments } from '@/features/treatments/hooks'
import { useDiscounts } from '@/features/discounts/hooks'
import { useSpecialists } from '@/features/specialists/hooks'
import { useMe } from '@/features/auth/hooks'
import { useCurrentPatientMembership } from '@/features/memberships/hooks'
import type { Patient } from '@/shared/types/patient'
import type { PaymentMethod } from '@/shared/types/cash'
import type { ChargeItemPayload } from './api'
import { accent } from '@/shared/lib/module-accents'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Separator } from '@/shared/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { cn, formatMXN } from '@/shared/lib/utils'

interface ItemDraft {
  uid: string
  treatment_id: string
  specialist_id: string
  quantity: number
  discount_id: string
}

interface PaymentDraft {
  uid: string
  method: PaymentMethod
  amount: string
  reference: string
}

function uid(): string {
  return Math.random().toString(36).slice(2, 11)
}

function newItem(): ItemDraft {
  return {
    uid: uid(),
    treatment_id: '',
    specialist_id: '',
    quantity: 1,
    discount_id: '',
  }
}

function newPayment(suggestedAmount = 0): PaymentDraft {
  return {
    uid: uid(),
    method: 'cash',
    amount: suggestedAmount > 0 ? String(suggestedAmount) : '',
    reference: '',
  }
}

export function NewChargePage() {
  const navigate = useNavigate()
  const { data: me } = useMe()
  const session = useCurrentCashSession()
  const treatments = useTreatments({ only_active: true })
  const discounts = useDiscounts()
  const specialists = useSpecialists()
  const create = useCreateCharge()
  const { branding } = useBranding()

  const canOperate = me?.permissions.includes('charges.create') ?? false

  const [patient, setPatient] = useState<Patient | null>(null)
  const membership = useCurrentPatientMembership(patient?.id)
  const [editPatient, setEditPatient] = useState(false)
  const [items, setItems] = useState<ItemDraft[]>([newItem()])
  const [payments, setPayments] = useState<PaymentDraft[]>([])
  const [notes, setNotes] = useState('')

  if (!canOperate) return <Navigate to="/caja" replace />

  const treatmentMap = useMemo(() => {
    const m = new Map<number, { base_price: number; name: string; code: string | null }>()
    treatments.data?.forEach((t) =>
      m.set(t.id, { base_price: t.base_price, name: t.name, code: t.code }),
    )
    return m
  }, [treatments.data])

  const discountMap = useMemo(() => {
    const m = new Map<number, { type: 'percent' | 'amount'; value: number }>()
    discounts.data?.forEach((d) => m.set(d.id, { type: d.type, value: d.value }))
    return m
  }, [discounts.data])

  // Detalle de cada tratamiento incluido en la membresía: porcentaje y cuota
  // anual ya consumida (calculada por el backend).
  const membershipTreatmentMap = useMemo(() => {
    const m = new Map<
      number,
      { discountPercent: number | null; annualQuota: number | null }
    >()
    membership.data?.plan?.treatments?.forEach((t) =>
      m.set(t.id, {
        discountPercent: t.discount_percent,
        annualQuota: t.annual_quota,
      }),
    )
    return m
  }, [membership.data])

  const remainingQuotaMap = useMemo(() => {
    const m = new Map<number, number | null>()
    membership.data?.usage?.forEach((u) =>
      m.set(u.treatment_id, u.remaining),
    )
    return m
  }, [membership.data])

  interface LineResult {
    subtotal: number
    discount: number
    total: number
    membershipPercent: number | null
    coveredQty: number
    uncoveredQty: number
  }

  const EMPTY_LINE: LineResult = {
    subtotal: 0,
    discount: 0,
    total: 0,
    membershipPercent: null,
    coveredQty: 0,
    uncoveredQty: 0,
  }

  /**
   * Calcula el split de cada línea EN ORDEN, llevando la cuenta de la cuota
   * ya consumida por líneas previas del mismo tratamiento dentro del mismo
   * cobro. Esto evita que dos líneas pidan la misma cuota disponible y ambas
   * obtengan el descuento.
   */
  const lineResults = useMemo<Map<string, LineResult>>(() => {
    const consumedInDraft = new Map<number, number>()
    const result = new Map<string, LineResult>()
    const plan = membership.data?.plan

    for (const it of items) {
      if (!it.treatment_id) {
        result.set(it.uid, EMPTY_LINE)
        continue
      }
      const treatmentId = Number(it.treatment_id)
      const treatment = treatmentMap.get(treatmentId)
      if (!treatment) {
        result.set(it.uid, EMPTY_LINE)
        continue
      }
      const subtotal = treatment.base_price * it.quantity
      let discount = 0
      let membershipPercent: number | null = null
      let coveredQty = 0
      let uncoveredQty = it.quantity

      if (it.discount_id) {
        // Descuento manual: tiene prioridad sobre la membresía.
        const d = discountMap.get(Number(it.discount_id))
        if (d) {
          discount = d.type === 'percent' ? subtotal * (d.value / 100) : d.value
          if (discount > subtotal) discount = subtotal
        }
      } else if (plan) {
        const entry = membershipTreatmentMap.get(treatmentId)
        if (entry) {
          const pct = entry.discountPercent === null ? 100 : entry.discountPercent
          if (pct > 0) {
            // Calcula cuota disponible: restante en backend menos lo ya usado
            // por líneas anteriores en este draft.
            const remainingFromBackend = remainingQuotaMap.get(treatmentId)
            const alreadyInDraft = consumedInDraft.get(treatmentId) ?? 0
            let available: number
            if (
              entry.annualQuota === null ||
              remainingFromBackend === null ||
              remainingFromBackend === undefined
            ) {
              available = it.quantity // ilimitado
            } else {
              available = Math.max(0, remainingFromBackend - alreadyInDraft)
            }
            coveredQty = Math.min(it.quantity, available)
            uncoveredQty = it.quantity - coveredQty
            if (coveredQty > 0) {
              membershipPercent = pct
              discount = +(
                treatment.base_price * coveredQty * (pct / 100)
              ).toFixed(2)
              if (discount > subtotal) discount = subtotal
              consumedInDraft.set(
                treatmentId,
                alreadyInDraft + coveredQty,
              )
            }
          }
        } else if (plan.default_discount_percent > 0) {
          // No listado: descuento default sobre todo (sin cuota).
          coveredQty = it.quantity
          uncoveredQty = 0
          membershipPercent = plan.default_discount_percent
          discount = +(
            subtotal * (plan.default_discount_percent / 100)
          ).toFixed(2)
          if (discount > subtotal) discount = subtotal
        }
      }
      result.set(it.uid, {
        subtotal,
        discount,
        total: subtotal - discount,
        membershipPercent,
        coveredQty,
        uncoveredQty,
      })
    }
    return result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, treatmentMap, discountMap, membershipTreatmentMap, remainingQuotaMap, membership.data])

  const lineOf = (uid: string): LineResult => lineResults.get(uid) ?? EMPTY_LINE

  const totals = useMemo(() => {
    let subtotal = 0
    let discount = 0
    for (const it of items) {
      const c = lineResults.get(it.uid) ?? EMPTY_LINE
      subtotal += c.subtotal
      discount += c.discount
    }
    const total = subtotal - discount
    const paid = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0)
    return {
      subtotal: +subtotal.toFixed(2),
      discount: +discount.toFixed(2),
      total: +total.toFixed(2),
      paid: +paid.toFixed(2),
      balance: +(total - paid).toFixed(2),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, payments, lineResults])

  const updateItem = (uid: string, patch: Partial<ItemDraft>) =>
    setItems((p) => p.map((it) => (it.uid === uid ? { ...it, ...patch } : it)))
  const removeItem = (uid: string) =>
    setItems((p) => (p.length > 1 ? p.filter((it) => it.uid !== uid) : p))

  const updatePayment = (uid: string, patch: Partial<PaymentDraft>) =>
    setPayments((p) => p.map((it) => (it.uid === uid ? { ...it, ...patch } : it)))
  const removePayment = (uid: string) =>
    setPayments((p) => p.filter((it) => it.uid !== uid))

  const validate = (): string | null => {
    if (!patient) return 'Selecciona un paciente'
    const filledItems = items.filter((it) => it.treatment_id)
    if (filledItems.length === 0) return 'Agrega al menos un tratamiento'
    if (totals.paid > totals.total + 0.001) return 'Los pagos exceden el total a cobrar'
    return null
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) {
      toast.error(err)
      return
    }
    create.mutate(
      {
        patient_id: patient!.id,
        notes: notes || null,
        items: items
          .filter((it) => it.treatment_id)
          .flatMap((it): ChargeItemPayload[] => {
            const treatmentId = Number(it.treatment_id)
            const treatment = treatmentMap.get(treatmentId)
            const hasManualDiscount = !!it.discount_id
            const specialistId = it.specialist_id
              ? Number(it.specialist_id)
              : null
            const discountId = it.discount_id ? Number(it.discount_id) : null
            const line = lineOf(it.uid)

            // Con descuento manual o sin tratamiento válido: una sola línea.
            if (hasManualDiscount || !treatment) {
              return [
                {
                  treatment_id: treatmentId,
                  specialist_id: specialistId,
                  quantity: it.quantity,
                  discount_id: discountId,
                  unit_price_override: null,
                },
              ]
            }

            // Si la membresía no cubre nada en esta línea, una sola línea regular.
            if (line.coveredQty === 0 || line.membershipPercent === null) {
              return [
                {
                  treatment_id: treatmentId,
                  specialist_id: specialistId,
                  quantity: it.quantity,
                  discount_id: null,
                  unit_price_override: null,
                },
              ]
            }

            const coveredOverride = +(
              treatment.base_price * (1 - line.membershipPercent / 100)
            ).toFixed(2)

            const lines: ChargeItemPayload[] = [
              {
                treatment_id: treatmentId,
                specialist_id: specialistId,
                quantity: line.coveredQty,
                discount_id: null,
                unit_price_override: coveredOverride,
              },
            ]
            if (line.uncoveredQty > 0) {
              lines.push({
                treatment_id: treatmentId,
                specialist_id: specialistId,
                quantity: line.uncoveredQty,
                discount_id: null,
                unit_price_override: null,
              })
            }
            return lines
          }),
        payments: payments
          .filter((p) => Number(p.amount) > 0)
          .map((p) => ({
            method: p.method,
            amount: Number(p.amount),
            reference: p.reference || null,
          })),
      },
      {
        onSuccess: (c) => {
          // Solo ofrecemos imprimir cuando hubo pagos. Cobros sin pago (saldo
          // pendiente) no requieren ticket.
          const hasPayment = c.payments && c.payments.length > 0
          if (hasPayment && branding?.ticket_auto_print) {
            openChargeTicket(c.id)
          } else if (hasPayment) {
            toast.success('Cobro registrado', {
              action: {
                label: 'Imprimir ticket',
                onClick: () => openChargeTicket(c.id),
              },
              duration: 6000,
            })
          } else {
            toast.success('Cobro registrado')
          }
          navigate('/caja', { replace: true })
        },
        onError: (err: unknown) => {
          const errs =
            err && typeof err === 'object' && 'response' in err
              ? (err as {
                  response?: { data?: { errors?: Record<string, string[]>; message?: string } }
                }).response?.data
              : undefined
          const first = errs?.errors ? Object.values(errs.errors)[0]?.[0] : errs?.message
          toast.error(first ?? 'No fue posible registrar el cobro')
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

      <header className="flex items-center gap-3">
        <div className={`grid size-10 place-items-center rounded-lg ${accent('cash').badge}`}>
          <ReceiptText className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Nuevo cobro
          </h1>
          <p className="text-sm text-muted-foreground">
            Captura tratamientos, descuentos y pagos.
          </p>
        </div>
      </header>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Paciente */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="grid size-5 place-items-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
                1
              </span>
              Paciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {patient && !editPatient ? (
              <div className="flex items-center gap-3 rounded-md border bg-card p-3">
                <span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  {patient.first_name[0]}
                  {patient.last_name[0]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {patient.full_name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {patient.email ?? patient.mobile_phone ?? patient.phone ?? '—'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditPatient(true)}
                >
                  Cambiar
                </Button>
              </div>
            ) : (
              <PatientPicker
                selected={null}
                onSelect={(p) => {
                  setPatient(p)
                  setEditPatient(false)
                }}
              />
            )}

            {patient && membership.data ? (
              <div className="mt-3 rounded-md border border-primary/30 bg-primary/5 p-3 text-xs flex items-start gap-2">
                <Sparkles className="size-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">
                    Membresía activa: {membership.data.plan_name}
                  </p>
                  <p className="text-muted-foreground">
                    Los tratamientos cubiertos aplicarán el descuento automáticamente.
                    Aplica un descuento manual en la línea para sobreescribirlo.
                  </p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Tratamientos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="grid size-5 place-items-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
                2
              </span>
              Tratamientos
            </CardTitle>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setItems((p) => [...p, newItem()])}
            >
              <Plus className="size-4" /> Agregar
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((it, idx) => {
              const line = lineOf(it.uid)
              return (
                <div key={it.uid} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Línea {idx + 1}
                    </p>
                    {items.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeItem(it.uid)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1 -mr-1"
                        aria-label="Eliminar línea"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    ) : null}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Tratamiento</Label>
                    <Select
                      value={it.treatment_id}
                      onValueChange={(v) => updateItem(it.uid, { treatment_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona…" />
                      </SelectTrigger>
                      <SelectContent>
                        {treatments.data?.map((t) => (
                          <SelectItem key={t.id} value={String(t.id)}>
                            <span>{t.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {formatMXN(t.base_price)}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Especialista</Label>
                      <Select
                        value={it.specialist_id || 'none'}
                        onValueChange={(v) =>
                          updateItem(it.uid, { specialist_id: v === 'none' ? '' : v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sin asignar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin asignar</SelectItem>
                          {specialists.data?.map((s) => (
                            <SelectItem key={s.id} value={String(s.id)}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Cantidad</Label>
                      <Input
                        type="number"
                        min={1}
                        max={999}
                        value={it.quantity}
                        onChange={(e) =>
                          updateItem(it.uid, {
                            quantity: Math.max(1, Number(e.target.value) || 1),
                          })
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Descuento</Label>
                      <Select
                        value={it.discount_id || 'none'}
                        onValueChange={(v) =>
                          updateItem(it.uid, { discount_id: v === 'none' ? '' : v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sin descuento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin descuento</SelectItem>
                          {discounts.data?.map((d) => (
                            <SelectItem key={d.id} value={String(d.id)}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {it.treatment_id ? (
                    <div className="space-y-2 border-t pt-3 text-sm">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 text-muted-foreground flex-wrap">
                          <span>{formatMXN(line.subtotal)}</span>
                          {line.discount > 0 ? (
                            <span>− {formatMXN(line.discount)}</span>
                          ) : null}
                          {line.membershipPercent !== null && line.coveredQty > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-[10px] px-2 py-0.5 font-medium">
                              <Sparkles className="size-3" />
                              Membresía cubre {line.coveredQty}
                              {line.membershipPercent < 100
                                ? ` · ${line.membershipPercent}%`
                                : ' · sin costo'}
                            </span>
                          ) : null}
                          {line.uncoveredQty > 0 && line.coveredQty > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] px-2 py-0.5 font-medium">
                              {line.uncoveredQty} a precio normal
                            </span>
                          ) : null}
                        </div>
                        <span className="font-semibold tabular-nums text-foreground">
                          {formatMXN(line.total)}
                        </span>
                      </div>
                      {line.uncoveredQty > 0 && line.coveredQty > 0 ? (
                        <p className="text-[11px] text-muted-foreground">
                          La cuota anual de la membresía solo cubre {line.coveredQty} de{' '}
                          {it.quantity}. El resto se cobra al precio del catálogo.
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Resumen */}
        <Card>
          <CardContent className="p-5 space-y-1 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatMXN(totals.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Descuentos</span>
              <span className="tabular-nums">− {formatMXN(totals.discount)}</span>
            </div>
            <Separator className="my-1" />
            <div className="flex items-center justify-between font-semibold text-base">
              <span>Total</span>
              <span className="tabular-nums">{formatMXN(totals.total)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Pagos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="grid size-5 place-items-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
                3
              </span>
              Pagos
              <span className="text-xs font-normal text-muted-foreground">
                (opcional)
              </span>
            </CardTitle>
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
          </CardHeader>
          <CardContent className="space-y-3">
            {!session.data ? (
              <p className="text-xs rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-3 text-foreground">
                Tu sesión de caja está cerrada. Puedes guardar el cobro como pendiente y
                registrar los pagos después.
              </p>
            ) : null}

            {payments.length === 0 ? (
              <p className="text-xs text-muted-foreground rounded-md border border-dashed p-3 text-center">
                Sin pagos = el cobro queda pendiente, podrás abonar después desde su detalle.
              </p>
            ) : (
              payments.map((p, idx) => (
                <div key={p.uid} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Método</Label>
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
                    <div className="space-y-1.5">
                      <Label className="text-xs">Monto</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        value={p.amount}
                        onChange={(e) => updatePayment(p.uid, { amount: e.target.value })}
                        className="tabular-nums"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Referencia (opcional)</Label>
                    <Input
                      value={p.reference}
                      onChange={(e) => updatePayment(p.uid, { reference: e.target.value })}
                      placeholder={
                        p.method === 'card'
                          ? 'Últimos 4 dígitos'
                          : p.method === 'transfer'
                            ? 'Folio o referencia'
                            : 'Nota corta'
                      }
                    />
                  </div>
                </div>
              ))
            )}

            {payments.length > 0 ? (
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
            ) : null}
          </CardContent>
        </Card>

        {/* Notas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notas (opcional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones del cobro…"
            />
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/caja')}
            disabled={create.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={create.isPending || !patient}
            className="sm:min-w-56"
          >
            {create.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {totals.total === 0
              ? 'Registrar (cubierto por membresía)'
              : `Registrar cobro · ${formatMXN(totals.total)}`}
          </Button>
        </div>
      </form>
    </div>
  )
}
