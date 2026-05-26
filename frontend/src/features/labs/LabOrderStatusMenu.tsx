import { Check, MoreVertical } from 'lucide-react'
import { toast } from 'sonner'
import { useChangeLabOrderStatus } from './hooks'
import {
  LAB_ORDER_STATUS_LABELS,
  type LabOrder,
  type LabOrderStatus,
} from '@/shared/types/lab'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { cn } from '@/shared/lib/utils'

const STATUS_DOT: Record<LabOrderStatus, string> = {
  pending: 'bg-slate-400',
  in_progress: 'bg-amber-500',
  received: 'bg-emerald-500',
  delivered: 'bg-primary',
  cancelled: 'bg-muted-foreground',
}

interface Props {
  order: LabOrder
}

export function LabOrderStatusMenu({ order }: Props) {
  const mutation = useChangeLabOrderStatus()

  const onChange = (status: LabOrderStatus) => {
    if (status === order.status) return
    mutation.mutate(
      { id: order.id, status },
      {
        onSuccess: () =>
          toast.success(`Estado: ${LAB_ORDER_STATUS_LABELS[status]}`),
        onError: () => toast.error('No fue posible cambiar el estado'),
      },
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="opacity-70 hover:opacity-100 rounded p-1 hover:bg-black/5 dark:hover:bg-white/10 transition"
          aria-label="Cambiar estado"
        >
          <MoreVertical className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-52"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuLabel className="text-xs">Cambiar estado</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.keys(LAB_ORDER_STATUS_LABELS) as LabOrderStatus[]).map((s) => {
          const active = order.status === s
          return (
            <DropdownMenuItem
              key={s}
              onSelect={(e) => {
                e.preventDefault()
                onChange(s)
              }}
              className="gap-2"
              disabled={mutation.isPending}
            >
              <span
                className={cn(
                  'inline-block size-2 rounded-full shrink-0',
                  STATUS_DOT[s],
                )}
              />
              <span className="flex-1">{LAB_ORDER_STATUS_LABELS[s]}</span>
              {active ? <Check className="size-3.5 text-primary" /> : null}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
