import { useState } from 'react'
import { toast } from 'sonner'
import { Check, Loader2, Smartphone, Sparkles, TriangleAlert } from 'lucide-react'
import { usePlans, useUpdatePlan } from './hooks'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import type { PlatformPlanFull } from './api'

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-sm"
    >
      <span
        className={cn(
          'relative h-5 w-9 rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-muted-foreground/30',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform',
            checked && 'translate-x-4',
          )}
        />
      </span>
      <span className="flex items-center gap-1">
        <Smartphone className="size-3.5 text-muted-foreground" /> {label}
      </span>
    </button>
  )
}

function PlanCard({ plan }: { plan: PlatformPlanFull }) {
  const update = useUpdatePlan()
  const [name, setName] = useState(plan.name)
  const [price, setPrice] = useState(plan.price_mxn?.toString() ?? '')
  const [unlimited, setUnlimited] = useState(plan.max_patients === null)
  const [maxPatients, setMaxPatients] = useState(plan.max_patients?.toString() ?? '')
  const [includesApp, setIncludesApp] = useState(plan.includes_app)
  const [stripePrice, setStripePrice] = useState(plan.stripe_price_id ?? '')

  const dirty =
    name !== plan.name ||
    (price === '' ? null : Number(price)) !== plan.price_mxn ||
    (unlimited ? null : maxPatients === '' ? null : Number(maxPatients)) !== plan.max_patients ||
    includesApp !== plan.includes_app ||
    (stripePrice || null) !== plan.stripe_price_id

  const save = () => {
    update.mutate(
      {
        id: plan.id,
        name: name.trim(),
        price_mxn: price === '' ? null : Number(price),
        max_patients: unlimited ? null : maxPatients === '' ? null : Number(maxPatients),
        includes_app: includesApp,
        stripe_price_id: stripePrice.trim() || null,
      },
      {
        onSuccess: () => toast.success(`Plan ${name} actualizado`),
        onError: (e) => toast.error(getApiErrorMessage(e, 'No fue posible guardar el plan')),
      },
    )
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          {plan.key === 'premium' ? <Sparkles className="size-4 text-amber-500" /> : null}
          {plan.name}
        </CardTitle>
        <Badge variant="outline" className="font-mono text-[10px] uppercase">
          {plan.key}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Nombre</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Precio mensual (MXN)</Label>
            <Input
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="—"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Límite de pacientes</Label>
            <Input
              type="number"
              min={1}
              value={unlimited ? '' : maxPatients}
              onChange={(e) => setMaxPatients(e.target.value)}
              disabled={unlimited}
              placeholder={unlimited ? 'Ilimitado' : '—'}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 rounded border-input accent-primary"
              checked={unlimited}
              onChange={(e) => setUnlimited(e.target.checked)}
            />
            Pacientes ilimitados
          </label>
          <Toggle checked={includesApp} onChange={setIncludesApp} label="Incluye app de pacientes" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Stripe Price ID</Label>
          <Input
            value={stripePrice}
            onChange={(e) => setStripePrice(e.target.value)}
            placeholder="price_..."
            className="font-mono text-xs"
          />
          {plan.stripe_ready ? (
            <p className="flex items-center gap-1 text-xs text-emerald-600">
              <Check className="size-3" /> Listo para cobrar
            </p>
          ) : (
            <p className="flex items-center gap-1 text-xs text-amber-600">
              <TriangleAlert className="size-3" /> Sin precio de Stripe (no se puede cobrar)
            </p>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between border-t pt-3">
          <span className="text-xs text-muted-foreground">
            {plan.tenants_count} {plan.tenants_count === 1 ? 'clínica' : 'clínicas'}
          </span>
          <Button size="sm" onClick={save} disabled={!dirty || update.isPending}>
            {update.isPending ? <Loader2 className="size-4 animate-spin" /> : null} Guardar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function PlansPage() {
  const plans = usePlans()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Planes</h1>
        <p className="text-sm text-muted-foreground">
          Configura los planes de suscripción. Stripe es la fuente de cobro: el precio aquí es de
          referencia y el cobro real usa el Price ID.
        </p>
      </div>

      {plans.isPending ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.data?.map((p) => <PlanCard key={p.id} plan={p} />)}
        </div>
      )}
    </div>
  )
}
