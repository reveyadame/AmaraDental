import { useState } from 'react'
import { BadgeCheck, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useDeleteMembershipPlan, useMembershipPlans } from './hooks'
import { MembershipPlanFormDialog } from './MembershipPlanFormDialog'
import { useMe } from '@/features/auth/hooks'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Skeleton } from '@/shared/ui/skeleton'
import { formatMXN } from '@/shared/lib/utils'
import type { MembershipPlan } from '@/shared/types/membership'

export function MembershipPlansPanel() {
  const { data: me } = useMe()
  const isAdmin = me?.roles.includes('admin') ?? false
  const plans = useMembershipPlans()
  const remove = useDeleteMembershipPlan()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<MembershipPlan | null>(null)

  const onNew = () => {
    setEditing(null)
    setOpen(true)
  }
  const onEdit = (p: MembershipPlan) => {
    setEditing(p)
    setOpen(true)
  }
  const onDelete = (p: MembershipPlan) => {
    if (!window.confirm(`¿Eliminar plan "${p.name}"?`)) return
    remove.mutate(p.id, {
      onSuccess: () => toast.success('Plan eliminado'),
      onError: () => toast.error('No fue posible eliminar'),
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">
          {plans.data?.length ?? 0} planes definidos
        </p>
        {isAdmin ? (
          <Button onClick={onNew}>
            <Plus className="size-4" /> Nuevo plan
          </Button>
        ) : null}
      </div>

      {plans.isPending ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : (plans.data?.length ?? 0) === 0 ? (
        <Card className="p-10 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted mb-2">
            <Sparkles className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Aún no hay planes de membresía.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.data!.map((p) => (
            <Card key={p.id} className="p-5 space-y-3 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    {p.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {p.valid_months} meses de vigencia
                  </p>
                </div>
                <Badge variant={p.active ? 'default' : 'secondary'}>
                  {p.active ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>

              <div>
                <p className="text-2xl font-semibold tabular-nums">
                  {formatMXN(p.annual_price)}
                </p>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  precio anual
                </p>
              </div>

              {p.description ? (
                <p className="text-xs text-muted-foreground line-clamp-3">{p.description}</p>
              ) : null}

              <div className="text-xs space-y-1">
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <BadgeCheck className="size-3.5" />
                  {(p.treatments?.length ?? 0)} tratamientos incluidos
                </p>
                {p.default_discount_percent > 0 ? (
                  <p className="text-muted-foreground">
                    +{p.default_discount_percent}% en el resto del catálogo
                  </p>
                ) : null}
              </div>

              {isAdmin ? (
                <div className="pt-2 mt-auto flex gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onEdit(p)}
                  >
                    <Pencil className="size-3.5" /> Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => onDelete(p)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      <MembershipPlanFormDialog open={open} onOpenChange={setOpen} plan={editing} />
    </div>
  )
}
