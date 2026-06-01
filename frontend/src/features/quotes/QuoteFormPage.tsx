import { useEffect, useMemo, useState } from 'react'
import {
  Link,
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, FileText, Loader2, Plus, Trash2 } from 'lucide-react'
import { useCreateQuote, useQuote, useUpdateQuote } from './hooks'
import { useTreatments } from '@/features/treatments/hooks'
import { useDiscounts } from '@/features/discounts/hooks'
import { useSpecialists } from '@/features/specialists/hooks'
import { usePatient } from '@/features/patients/hooks'
import { useAuth } from '@/shared/auth/permissions'
import { PatientPicker } from '@/features/cash/PatientPicker'
import type { Patient } from '@/shared/types/patient'
import type { QuoteItemPayload } from './api'
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
import { formatMXN } from '@/shared/lib/utils'

interface ItemDraft {
  uid: string
  treatment_id: string
  specialist_id: string
  quantity: number
  discount_id: string
  /** Precio manual; vacío = usar precio del catálogo. */
  unit_price_override: string
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
    unit_price_override: '',
  }
}

interface Props {
  mode: 'create' | 'edit'
}

export function QuoteFormPage({ mode }: Props) {
  const params = useParams<{ id?: string }>()
  const id = params.id ? Number(params.id) : undefined
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { can } = useAuth()

  // En modo `create` permitimos prellenar el paciente vía ?patient_id=X,
  // usado cuando se llega aquí desde el detalle del paciente.
  const presetPatientId =
    mode === 'create' && searchParams.get('patient_id')
      ? Number(searchParams.get('patient_id'))
      : undefined

  const existing = useQuote(mode === 'edit' ? id : undefined)
  const existingPatient = usePatient(
    mode === 'edit' ? existing.data?.patient_id : undefined,
  )
  const presetPatient = usePatient(presetPatientId)
  const treatments = useTreatments({ only_active: true })
  const discounts = useDiscounts()
  const specialists = useSpecialists()

  const createMut = useCreateQuote()
  const updateMut = useUpdateQuote(id ?? 0)

  const canManage = can('quotes.manage')

  const [patient, setPatient] = useState<Patient | null>(null)
  const [editPatient, setEditPatient] = useState(false)
  const [items, setItems] = useState<ItemDraft[]>([newItem()])
  const [notes, setNotes] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [hydrated, setHydrated] = useState(mode === 'create')

  // En modo create con ?patient_id, prefija el paciente al cargar.
  useEffect(() => {
    if (mode !== 'create' || !presetPatient.data || patient) return
    setPatient(presetPatient.data)
  }, [mode, presetPatient.data, patient])

  // Hidrata desde la cotización existente cuando estamos editando.
  useEffect(() => {
    if (mode !== 'edit' || !existing.data || !existingPatient.data || hydrated) return
    const q = existing.data
    setNotes(q.notes ?? '')
    setValidUntil(q.valid_until ?? '')
    setPatient(existingPatient.data)
    setItems(
      (q.items ?? []).map((it) => ({
        uid: uid(),
        treatment_id: it.treatment_id ? String(it.treatment_id) : '',
        specialist_id: it.specialist_id ? String(it.specialist_id) : '',
        quantity: it.quantity,
        discount_id: it.discount_id ? String(it.discount_id) : '',
        unit_price_override: '',
      })),
    )
    setHydrated(true)
  }, [mode, existing.data, existingPatient.data, hydrated])

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

  interface LineResult {
    subtotal: number
    discount: number
    total: number
  }

  const EMPTY_LINE: LineResult = { subtotal: 0, discount: 0, total: 0 }

  const lineResults = useMemo<Map<string, LineResult>>(() => {
    const result = new Map<string, LineResult>()
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
      const overrideNum = Number(it.unit_price_override)
      const unitPrice =
        it.unit_price_override !== '' && !Number.isNaN(overrideNum) && overrideNum >= 0
          ? overrideNum
          : treatment.base_price
      const subtotal = unitPrice * it.quantity
      let discount = 0
      if (it.discount_id) {
        const d = discountMap.get(Number(it.discount_id))
        if (d) {
          discount = d.type === 'percent' ? subtotal * (d.value / 100) : d.value
          if (discount > subtotal) discount = subtotal
        }
      }
      result.set(it.uid, {
        subtotal,
        discount,
        total: subtotal - discount,
      })
    }
    return result
  }, [items, treatmentMap, discountMap])

  const totals = useMemo(() => {
    let subtotal = 0
    let discount = 0
    for (const it of items) {
      const c = lineResults.get(it.uid) ?? EMPTY_LINE
      subtotal += c.subtotal
      discount += c.discount
    }
    return {
      subtotal: +subtotal.toFixed(2),
      discount: +discount.toFixed(2),
      total: +(subtotal - discount).toFixed(2),
    }
  }, [items, lineResults])

  if (!canManage) return <Navigate to="/" replace />

  if (mode === 'edit' && existing.isPending) {
    return (
      <div className="p-12 text-center text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin mx-auto" />
      </div>
    )
  }

  if (mode === 'edit' && existing.data && !existing.data.is_editable) {
    return (
      <div className="mx-auto max-w-xl p-8 text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          Esta cotización ya no se puede editar
          {existing.data.status === 'converted'
            ? ' porque fue convertida en cobro.'
            : ' porque fue rechazada.'}
        </p>
        <Button asChild variant="outline">
          <Link to="/cotizaciones">Volver al listado</Link>
        </Button>
      </div>
    )
  }

  const updateItem = (uid: string, patch: Partial<ItemDraft>) =>
    setItems((p) => p.map((it) => (it.uid === uid ? { ...it, ...patch } : it)))
  const removeItem = (uid: string) =>
    setItems((p) => (p.length > 1 ? p.filter((it) => it.uid !== uid) : p))

  const validate = (): string | null => {
    if (!patient) return 'Selecciona un paciente'
    const filled = items.filter((it) => it.treatment_id)
    if (filled.length === 0) return 'Agrega al menos un tratamiento'
    return null
  }

  const buildPayload = (): QuoteItemPayload[] =>
    items
      .filter((it) => it.treatment_id)
      .map((it): QuoteItemPayload => {
        const override = it.unit_price_override.trim()
        const overrideNum = Number(override)
        return {
          treatment_id: Number(it.treatment_id),
          specialist_id: it.specialist_id ? Number(it.specialist_id) : null,
          quantity: it.quantity,
          discount_id: it.discount_id ? Number(it.discount_id) : null,
          unit_price_override:
            override !== '' && !Number.isNaN(overrideNum) && overrideNum >= 0
              ? overrideNum
              : null,
        }
      })

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) {
      toast.error(err)
      return
    }

    const itemsPayload = buildPayload()

    if (mode === 'create') {
      createMut.mutate(
        {
          patient_id: patient!.id,
          notes: notes || null,
          valid_until: validUntil || null,
          items: itemsPayload,
        },
        {
          onSuccess: (q) => {
            toast.success('Cotización creada')
            navigate(`/cotizaciones/${q.id}`, { replace: true })
          },
          onError: (e: unknown) => {
            const msg =
              e && typeof e === 'object' && 'response' in e
                ? (e as { response?: { data?: { message?: string } } }).response?.data
                    ?.message
                : undefined
            toast.error(msg ?? 'No fue posible crear la cotización')
          },
        },
      )
    } else {
      updateMut.mutate(
        {
          notes: notes || null,
          valid_until: validUntil || null,
          items: itemsPayload,
        },
        {
          onSuccess: () => {
            toast.success('Cotización actualizada')
            navigate(`/cotizaciones/${id}`, { replace: true })
          },
          onError: (e: unknown) => {
            const msg =
              e && typeof e === 'object' && 'response' in e
                ? (e as { response?: { data?: { message?: string } } }).response?.data
                    ?.message
                : undefined
            toast.error(msg ?? 'No fue posible actualizar la cotización')
          },
        },
      )
    }
  }

  const submitting = createMut.isPending || updateMut.isPending

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 space-y-6">
      <Link
        to="/cotizaciones"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Cotizaciones
      </Link>

      <header className="flex items-center gap-3">
        <div className={`grid size-10 place-items-center rounded-lg ${accent('quotes').badge}`}>
          <FileText className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {mode === 'create' ? 'Nueva cotización' : 'Editar cotización'}
            {mode === 'edit' && existing.data?.code ? ` · ${existing.data.code}` : ''}
          </h1>
          <p className="text-sm text-muted-foreground">
            Captura los tratamientos a presupuestar. Podrás convertirla en cobro
            cuando el paciente acepte.
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
                {mode === 'create' ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditPatient(true)}
                  >
                    Cambiar
                  </Button>
                ) : null}
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
              const line = lineResults.get(it.uid) ?? EMPTY_LINE
              const treatment = it.treatment_id
                ? treatmentMap.get(Number(it.treatment_id))
                : null
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

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
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

                    <div className="space-y-1.5">
                      <Label className="text-xs">
                        Precio unit. {treatment ? '' : ''}
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        placeholder={treatment ? String(treatment.base_price) : '—'}
                        value={it.unit_price_override}
                        onChange={(e) =>
                          updateItem(it.uid, { unit_price_override: e.target.value })
                        }
                        className="tabular-nums"
                      />
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
                        </div>
                        <span className="font-semibold tabular-nums text-foreground">
                          {formatMXN(line.total)}
                        </span>
                      </div>
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

        {/* Vigencia y notas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vigencia y notas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5 max-w-xs">
              <Label className="text-xs">Vigencia (opcional)</Label>
              <Input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Después de esta fecha la cotización se marca como vencida.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notas</Label>
              <Textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Condiciones comerciales, observaciones para el paciente…"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/cotizaciones')}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={submitting || !patient}
            className="sm:min-w-56"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {mode === 'create'
              ? `Crear cotización · ${formatMXN(totals.total)}`
              : `Guardar cambios · ${formatMXN(totals.total)}`}
          </Button>
        </div>
      </form>
    </div>
  )
}
