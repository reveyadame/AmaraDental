import { useEffect, useMemo, useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateMembership, useMembershipPlans } from './hooks'
import { PatientPicker } from '@/features/cash/PatientPicker'
import type { Patient } from '@/shared/types/patient'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { formatMXN } from '@/shared/lib/utils'
import { useAuth } from '@/shared/auth/permissions'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  presetPatient?: Patient | null
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function SellMembershipDialog({ open, onOpenChange, presetPatient }: Props) {
  const plans = useMembershipPlans({ only_active: true })
  const create = useCreateMembership()
  const { can } = useAuth()
  // Vender membresía con cobro requiere también el rol Caja. Si solo tiene
  // Membresías, dejamos vender la membresía sin generar el CHG y le
  // explicamos por qué.
  const canCreateCharges = can('charges.create')

  const [patient, setPatient] = useState<Patient | null>(presetPatient ?? null)
  const [planId, setPlanId] = useState<string>('')
  const [startsOn, setStartsOn] = useState<string>(today())
  const [price, setPrice] = useState<string>('')
  const [createCharge, setCreateCharge] = useState(true)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return
    setPatient(presetPatient ?? null)
    setPlanId('')
    setStartsOn(today())
    setPrice('')
    setCreateCharge(true)
    setNotes('')
  }, [open, presetPatient])

  const selectedPlan = useMemo(
    () => plans.data?.find((p) => String(p.id) === planId),
    [plans.data, planId],
  )

  useEffect(() => {
    if (selectedPlan && price === '') {
      setPrice(String(selectedPlan.annual_price))
    }
  }, [selectedPlan, price])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!patient) {
      toast.error('Selecciona un paciente')
      return
    }
    if (!planId) {
      toast.error('Selecciona un plan')
      return
    }
    const willCreateCharge = createCharge && canCreateCharges
    create.mutate(
      {
        patient_id: patient.id,
        membership_plan_id: Number(planId),
        starts_on: startsOn,
        price_paid: price !== '' ? Number(price) : null,
        notes: notes || null,
        create_charge: willCreateCharge,
      },
      {
        onSuccess: () => {
          toast.success(
            willCreateCharge
              ? 'Membresía vendida — se generó el cobro asociado'
              : 'Membresía registrada',
          )
          onOpenChange(false)
        },
        onError: (err: unknown) => {
          const errs =
            err && typeof err === 'object' && 'response' in err
              ? (err as { response?: { data?: { message?: string } } }).response?.data
              : undefined
          toast.error(errs?.message ?? 'No fue posible vender la membresía')
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" /> Vender membresía
          </DialogTitle>
          <DialogDescription>
            Inscribe a un paciente a un plan anual. Si activas el cobro, se generará un
            CHG asociado para registrar el pago.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Paciente</Label>
            <PatientPicker selected={patient} onSelect={setPatient} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="plan">Plan</Label>
            <Select value={planId} onValueChange={setPlanId}>
              <SelectTrigger id="plan">
                <SelectValue placeholder="Selecciona un plan…" />
              </SelectTrigger>
              <SelectContent>
                {(plans.data ?? []).map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name} — {formatMXN(p.annual_price)} ({p.valid_months}m)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPlan ? (
              <p className="text-[11px] text-muted-foreground">
                {selectedPlan.treatments?.length ?? 0} tratamientos incluidos
                {selectedPlan.default_discount_percent > 0
                  ? ` · ${selectedPlan.default_discount_percent}% de descuento en el resto`
                  : ''}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="starts_on">Inicio</Label>
              <Input
                id="starts_on"
                type="date"
                value={startsOn}
                onChange={(e) => setStartsOn(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price_paid">Precio cobrado</Label>
              <Input
                id="price_paid"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={
                  selectedPlan ? String(selectedPlan.annual_price) : '0.00'
                }
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones…"
            />
          </div>

          <label
            className={`flex items-start gap-2 rounded-md border p-3 ${
              canCreateCharges ? 'cursor-pointer' : 'opacity-70 cursor-not-allowed'
            }`}
          >
            <input
              type="checkbox"
              checked={createCharge && canCreateCharges}
              disabled={!canCreateCharges}
              onChange={(e) => setCreateCharge(e.target.checked)}
              className="mt-1 size-4 accent-primary cursor-pointer disabled:cursor-not-allowed"
            />
            <span className="text-sm leading-tight">
              <span className="font-medium block">Generar cobro asociado</span>
              <span className="text-xs text-muted-foreground">
                {canCreateCharges
                  ? 'Crea un CHG con el precio de la membresía. Requiere caja abierta.'
                  : 'Necesitas el rol Caja para generar el cobro. Pídele al administrador que te lo asigne o que Caja lo registre por ti.'}
              </span>
            </span>
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Vender membresía
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
