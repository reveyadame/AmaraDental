import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Ban,
  BadgeCheck,
  CalendarRange,
  Plus,
  ReceiptText,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { useCancelMembership, useCurrentPatientMembership } from './hooks'
import { SellMembershipDialog } from './SellMembershipDialog'
import { useMe } from '@/features/auth/hooks'
import { useConfirm } from '@/shared/ui/confirm'
import type { Patient } from '@/shared/types/patient'
import type { MembershipUsage } from '@/shared/types/membership'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Skeleton } from '@/shared/ui/skeleton'
import { Separator } from '@/shared/ui/separator'
import { cn, formatMXN } from '@/shared/lib/utils'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function daysLeft(endsOn: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(endsOn + 'T00:00:00')
  return Math.round((end.getTime() - today.getTime()) / 86_400_000)
}

interface Props {
  patient: Patient
}

export function PatientMembershipTab({ patient }: Props) {
  const { data: me } = useMe()
  const canSell = me?.permissions.includes('memberships.manage') ?? false
  const membership = useCurrentPatientMembership(patient.id)
  const cancel = useCancelMembership()
  const confirm = useConfirm()
  const [open, setOpen] = useState(false)

  if (membership.isPending) {
    return <Skeleton className="h-40 w-full" />
  }

  if (!membership.data) {
    return (
      <>
        <Card className="p-10 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted mb-2">
            <Sparkles className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Este paciente no tiene una membresía vigente.
          </p>
          {canSell ? (
            <Button onClick={() => setOpen(true)}>
              <Plus className="size-4" /> Vender membresía
            </Button>
          ) : null}
        </Card>
        <SellMembershipDialog
          open={open}
          onOpenChange={setOpen}
          presetPatient={patient}
        />
      </>
    )
  }

  const m = membership.data
  const left = daysLeft(m.ends_on)
  const expiringSoon = left >= 0 && left <= 30

  const onCancel = async () => {
    const ok = await confirm({
      title: '¿Cancelar esta membresía?',
      description: 'Esto no genera devolución automática.',
      confirmText: 'Cancelar membresía',
      cancelText: 'Volver',
      variant: 'destructive',
    })
    if (!ok) return
    cancel.mutate(m.id, {
      onSuccess: () => toast.success('Membresía cancelada'),
      onError: () => toast.error('No fue posible cancelar'),
    })
  }

  return (
    <>
      <Card className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Plan vigente
            </p>
            <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="size-5 text-primary" /> {m.plan_name}
            </h3>
          </div>
          {expiringSoon ? (
            <Badge className="bg-amber-500 hover:bg-amber-500/90 text-white">
              Por vencer · {left} días
            </Badge>
          ) : (
            <Badge>Activa</Badge>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded-md border p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Vigencia
            </p>
            <p className="font-medium flex items-center gap-1.5 mt-1">
              <CalendarRange className="size-4 text-muted-foreground" />
              {formatDate(m.starts_on)} → {formatDate(m.ends_on)}
            </p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Pagado
            </p>
            <p className="font-medium tabular-nums mt-1">{formatMXN(m.price_paid)}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Beneficios
            </p>
            <p className="font-medium mt-1">
              {(m.plan?.treatments?.length ?? 0)} tratamientos incluidos
            </p>
            {m.plan && m.plan.default_discount_percent > 0 ? (
              <p className="text-xs text-muted-foreground">
                +{m.plan.default_discount_percent}% en el resto del catálogo
              </p>
            ) : null}
          </div>
        </div>

        {m.plan?.treatments && m.plan.treatments.length > 0 ? (
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
              Tratamientos cubiertos
            </p>
            <div className="rounded-md border divide-y">
              {m.plan.treatments.map((t) => {
                const usage: MembershipUsage | undefined = m.usage?.find(
                  (u) => u.treatment_id === t.id,
                )
                const consumed = usage?.consumed ?? 0
                const remaining = usage?.remaining ?? null
                const exhausted =
                  usage && usage.annual_quota !== null && (usage.remaining ?? 0) === 0
                return (
                  <div
                    key={t.id}
                    className="px-3 py-2 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:items-center text-sm"
                  >
                    <div className="sm:col-span-6 flex items-center gap-2">
                      <BadgeCheck
                        className={cn(
                          'size-4 shrink-0',
                          exhausted ? 'text-muted-foreground' : 'text-primary',
                        )}
                      />
                      <span className="flex-1 min-w-0 truncate">{t.name}</span>
                    </div>
                    <div className="sm:col-span-3 text-xs text-muted-foreground tabular-nums sm:text-right">
                      {t.discount_percent === null
                        ? 'Incluido'
                        : `${t.discount_percent}% desc.`}
                    </div>
                    <div className="sm:col-span-3 sm:text-right text-xs">
                      {usage && usage.annual_quota !== null ? (
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 tabular-nums',
                            exhausted
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-primary/10 text-primary',
                          )}
                        >
                          {consumed} / {usage.annual_quota}
                          {remaining !== null && remaining > 0
                            ? ` · ${remaining} restantes`
                            : ' · agotado'}
                        </span>
                      ) : usage ? (
                        <span className="text-muted-foreground">
                          Usado {consumed}× · ilimitado
                        </span>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}

        {m.history && m.history.length > 0 ? (
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
              Historial de aplicaciones
            </p>
            <div className="rounded-md border divide-y">
              {m.history.map((h) => (
                <div
                  key={h.id}
                  className="px-3 py-2 flex items-center gap-3 text-sm"
                >
                  <ReceiptText className="size-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{h.treatment_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {h.date
                        ? new Date(h.date).toLocaleDateString('es-MX', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                      {h.charge_code ? (
                        <>
                          {' · '}
                          <Link
                            to={`/caja/cobros/${h.charge_id}/pagar`}
                            className="hover:underline"
                          >
                            {h.charge_code}
                          </Link>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground tabular-nums">
                    <p>×{h.quantity}</p>
                    <p>{formatMXN(h.line_total)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {m.notes ? (
          <div className="text-sm">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
              Notas
            </p>
            <p className="whitespace-pre-wrap">{m.notes}</p>
          </div>
        ) : null}

        {canSell ? (
          <>
            <Separator />
            <div className="flex justify-end">
              <Button variant="outline" className="text-destructive" onClick={onCancel}>
                <Ban className="size-4" /> Cancelar membresía
              </Button>
            </div>
          </>
        ) : null}
      </Card>
      <SellMembershipDialog
        open={open}
        onOpenChange={setOpen}
        presetPatient={patient}
      />
    </>
  )
}
