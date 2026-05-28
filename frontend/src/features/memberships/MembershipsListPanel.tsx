import { useState } from 'react'
import { Ban, Plus, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { useCancelMembership, useMemberships } from './hooks'
import { SellMembershipDialog } from './SellMembershipDialog'
import { useMe } from '@/features/auth/hooks'
import { useConfirm } from '@/shared/ui/confirm'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Skeleton } from '@/shared/ui/skeleton'
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
import { cn, formatMXN } from '@/shared/lib/utils'
import type { Membership } from '@/shared/types/membership'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function daysLeft(endsOn: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(endsOn + 'T00:00:00')
  return Math.round((end.getTime() - today.getTime()) / 86_400_000)
}

function statusBadge(m: Membership) {
  if (m.status === 'cancelled') {
    return <Badge variant="destructive">Cancelada</Badge>
  }
  if (m.status === 'expired') {
    return <Badge variant="secondary">Vencida</Badge>
  }
  const left = daysLeft(m.ends_on)
  if (left < 0) return <Badge variant="secondary">Vencida</Badge>
  if (left <= 30) {
    return (
      <Badge className="bg-amber-500 hover:bg-amber-500/90 text-white">
        Por vencer · {left} d
      </Badge>
    )
  }
  return <Badge>Activa</Badge>
}

export function MembershipsListPanel() {
  const { data: me } = useMe()
  const canSell = me?.permissions.includes('memberships.manage') ?? false
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const memberships = useMemberships({
    status: statusFilter === 'all' ? undefined : statusFilter,
    per_page: 50,
  })
  const cancel = useCancelMembership()
  const confirm = useConfirm()
  const [open, setOpen] = useState(false)

  const onCancel = async (m: Membership) => {
    const ok = await confirm({
      title: `¿Cancelar la membresía de ${m.patient_name}?`,
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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            {memberships.data?.data.length ?? 0} membresías
          </p>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="active">Activas</SelectItem>
              <SelectItem value="expired">Vencidas</SelectItem>
              <SelectItem value="cancelled">Canceladas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {canSell ? (
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" /> Vender membresía
          </Button>
        ) : null}
      </div>

      <Card>
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Vigencia</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Pagado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {memberships.isPending ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : (memberships.data?.data.length ?? 0) === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-14 text-center">
                  <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted mb-2">
                    <Sparkles className="size-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Aún no hay membresías vendidas.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              memberships.data!.data.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <Link
                      to={`/pacientes/${m.patient_id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {m.patient_name ?? '—'}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{m.plan_name ?? '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(m.starts_on)} → {formatDate(m.ends_on)}
                  </TableCell>
                  <TableCell>{statusBadge(m)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMXN(m.price_paid)}
                  </TableCell>
                  <TableCell className="text-right">
                    {canSell && m.status === 'active' ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className={cn('text-destructive')}
                        onClick={() => onCancel(m)}
                      >
                        <Ban className="size-3.5" /> Cancelar
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <SellMembershipDialog open={open} onOpenChange={setOpen} />
    </div>
  )
}
