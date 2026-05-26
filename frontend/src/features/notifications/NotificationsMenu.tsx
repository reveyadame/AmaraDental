import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useNotifications, type AppNotification } from './useNotifications'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { cn } from '@/shared/lib/utils'

const SEVERITY_STYLES: Record<AppNotification['severity'], string> = {
  danger: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  info: 'bg-primary/10 text-primary',
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso + (iso.length === 10 ? 'T00:00:00' : '')).toLocaleDateString(
    'es-MX',
    { day: '2-digit', month: 'short' },
  )
}

export function NotificationsMenu() {
  const navigate = useNavigate()
  const { items, count, dangerCount, isLoading } = useNotifications()

  const onSelect = (n: AppNotification) => {
    navigate(n.href)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative grid size-9 place-items-center rounded-md text-foreground hover:bg-accent transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="size-5" />
        {count > 0 ? (
          <span
            className={cn(
              'absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold grid place-items-center text-white tabular-nums',
              dangerCount > 0 ? 'bg-rose-600' : 'bg-amber-500',
            )}
          >
            {count > 99 ? '99+' : count}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[70vh] overflow-y-auto p-0">
        <DropdownMenuLabel className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-semibold">Notificaciones</span>
          {count > 0 ? (
            <span className="text-xs text-muted-foreground tabular-nums">
              {count} {count === 1 ? 'pendiente' : 'pendientes'}
            </span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">
            Cargando…
          </div>
        ) : items.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <div className="mx-auto grid size-10 place-items-center rounded-full bg-muted mb-2">
              <Bell className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Sin notificaciones</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Estás al día.
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {items.map((n) => {
              const Icon = n.icon
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(n)}
                    className="w-full text-left flex gap-3 px-3 py-2.5 hover:bg-accent transition-colors"
                  >
                    <span
                      className={cn(
                        'grid size-8 shrink-0 place-items-center rounded-full',
                        SEVERITY_STYLES[n.severity],
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{n.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {n.description}
                      </p>
                      {n.date ? (
                        <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                          {formatDate(n.date)}
                        </p>
                      ) : null}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
