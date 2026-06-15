import { toast } from 'sonner'
import { Building2, Loader2, Power, PowerOff } from 'lucide-react'
import { usePlans, useTenants, useUpdateTenant } from './hooks'
import { NewClinicDialog } from './NewClinicDialog'
import { useConfirm } from '@/shared/ui/confirm'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
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
                <TableHead>Subdominio</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.data.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{t.slug}</TableCell>
                  <TableCell>
                    <Select
                      value={t.plan?.key ?? ''}
                      onValueChange={(key) => changePlan(t, key)}
                      disabled={update.isPending}
                    >
                      <SelectTrigger className="h-8 w-[150px]">
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
                    {t.status === 'active' ? (
                      <Badge variant="secondary">Activa</Badge>
                    ) : (
                      <Badge variant="destructive">Suspendida</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggle(t)}
                      disabled={update.isPending}
                      className={t.status === 'active' ? 'text-destructive hover:text-destructive' : ''}
                    >
                      {t.status === 'active' ? (
                        <>
                          <PowerOff className="size-4" /> Suspender
                        </>
                      ) : (
                        <>
                          <Power className="size-4" /> Reactivar
                        </>
                      )}
                    </Button>
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
    </div>
  )
}
