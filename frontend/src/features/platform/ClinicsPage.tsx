import { useState } from 'react'
import { toast } from 'sonner'
import { Building2, Eye, Loader2, MoreHorizontal, Power, PowerOff, Trash2 } from 'lucide-react'
import { usePlans, useTenants, useUpdateTenant } from './hooks'
import { NewClinicDialog } from './NewClinicDialog'
import { ClinicDetailDialog } from './ClinicDetailDialog'
import { DeleteClinicDialog } from './DeleteClinicDialog'
import { BillingStateBadge, UsageBar } from './clinic-ui'
import { relativeFrom } from './clinic-format'
import { useConfirm } from '@/shared/ui/confirm'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import type { PlatformTenant } from './api'

export function ClinicsPage() {
  const tenants = useTenants()
  const plans = usePlans()
  const update = useUpdateTenant()
  const confirm = useConfirm()
  const [detailId, setDetailId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PlatformTenant | null>(null)

  const changePlan = (t: PlatformTenant, key: string) => {
    if (key === t.plan?.key) return
    update.mutate(
      { id: t.id, plan_key: key },
      {
        onSuccess: () => toast.success('Plan actualizado'),
        onError: (e) => toast.error(getApiErrorMessage(e, 'No fue posible cambiar el plan')),
      },
    )
  }

  const toggle = async (t: PlatformTenant) => {
    const suspend = t.status === 'active'
    if (suspend) {
      const ok = await confirm({
        title: `¿Suspender ${t.name}?`,
        description: 'La clínica no podrá acceder al sistema hasta que la reactives.',
        variant: 'destructive',
        confirmText: 'Suspender',
      })
      if (!ok) return
    }
    update.mutate(
      { id: t.id, status: suspend ? 'suspended' : 'active' },
      {
        onSuccess: () => toast.success(suspend ? 'Clínica suspendida' : 'Clínica reactivada'),
        onError: (e) => toast.error(getApiErrorMessage(e, 'No fue posible cambiar el estado')),
      },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clínicas</h1>
          <p className="text-sm text-muted-foreground">
            Administra las clínicas suscritas a Amara Dental.
          </p>
        </div>
        <NewClinicDialog />
      </div>

      <Card className="overflow-hidden p-0">
        {tenants.isPending ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : tenants.data && tenants.data.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clínica</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Uso</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Alta</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.data.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <button
                      className="text-left font-medium hover:underline"
                      onClick={() => setDetailId(t.id)}
                    >
                      {t.name}
                    </button>
                    <p className="font-mono text-xs text-muted-foreground">{t.slug}</p>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={t.plan?.key ?? ''}
                      onValueChange={(key) => changePlan(t, key)}
                      disabled={update.isPending}
                    >
                      <SelectTrigger className="h-8 w-[140px]">
                        <SelectValue placeholder="Sin plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.data?.map((p) => (
                          <SelectItem key={p.key} value={p.key}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <UsageBar usage={t.usage} />
                  </TableCell>
                  <TableCell>
                    {t.billing_lite ? <BillingStateBadge state={t.billing_lite.state} /> : '—'}
                  </TableCell>
                  <TableCell>
                    {t.status === 'active' ? (
                      <Badge variant="secondary">Activa</Badge>
                    ) : (
                      <Badge variant="destructive">Suspendida</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {relativeFrom(t.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="size-8">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setDetailId(t.id)}>
                          <Eye className="size-4" /> Ver detalle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggle(t)}>
                          {t.status === 'active' ? (
                            <>
                              <PowerOff className="size-4" /> Suspender
                            </>
                          ) : (
                            <>
                              <Power className="size-4" /> Reactivar
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(t)}>
                          <Trash2 className="size-4" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="grid place-items-center gap-2 py-16 text-center">
            <Building2 className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Aún no hay clínicas. Crea la primera.</p>
          </div>
        )}
      </Card>

      <ClinicDetailDialog
        tenantId={detailId}
        onOpenChange={(open) => {
          if (!open) setDetailId(null)
        }}
        onRequestDelete={(t) => {
          setDetailId(null)
          setDeleteTarget(t)
        }}
      />

      <DeleteClinicDialog
        tenant={deleteTarget}
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      />
    </div>
  )
}
