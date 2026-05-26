import { useMemo } from 'react'
import { AlertTriangle, BellRing, type LucideIcon, Microscope } from 'lucide-react'
import { useRecalls } from '@/features/recalls/hooks'
import { useLabOrders } from '@/features/labs/hooks'

export type NotificationSeverity = 'info' | 'warning' | 'danger'

export interface AppNotification {
  id: string
  /** Categoría para futuras extensiones (filtros, agrupación, etc.) */
  type:
    | 'recall_overdue'
    | 'recall_due_soon'
    | 'lab_overdue'
  title: string
  description: string
  /** Ruta del front a la que lleva al hacer clic en la notificación. */
  href: string
  /** Fecha relevante en ISO (due_on, scheduled_at, etc.). */
  date?: string | null
  severity: NotificationSeverity
  icon: LucideIcon
}

/**
 * Agrega las distintas fuentes de notificaciones del sistema en una sola
 * lista normalizada. Es 100% derivada de queries existentes — para sumar
 * una nueva fuente basta con encadenar otra query y mapearla.
 */
export function useNotifications() {
  const overdue = useRecalls({ window: 'overdue', per_page: 25 })
  const thisWeek = useRecalls({ window: 'this_week', per_page: 25 })
  const labs = useLabOrders({ overdue: true, per_page: 25 })

  const isLoading = overdue.isPending || thisWeek.isPending || labs.isPending

  const items = useMemo<AppNotification[]>(() => {
    const list: AppNotification[] = []

    overdue.data?.data.forEach((r) => {
      list.push({
        id: `recall-overdue-${r.id}`,
        type: 'recall_overdue',
        title: `Recall vencido · ${r.patient_name ?? 'paciente'}`,
        description: `${r.recall_label ?? r.treatment_name ?? 'Tratamiento'} — venció hace ${Math.abs(r.days_until_due ?? 0)} días`,
        href: '/recalls',
        date: r.due_on,
        severity: 'danger',
        icon: AlertTriangle,
      })
    })

    thisWeek.data?.data.forEach((r) => {
      list.push({
        id: `recall-week-${r.id}`,
        type: 'recall_due_soon',
        title: `Recall esta semana · ${r.patient_name ?? 'paciente'}`,
        description: `${r.recall_label ?? r.treatment_name ?? 'Tratamiento'} — en ${r.days_until_due ?? 0} días`,
        href: '/recalls',
        date: r.due_on,
        severity: 'warning',
        icon: BellRing,
      })
    })

    labs.data?.data.forEach((o) => {
      list.push({
        id: `lab-overdue-${o.id}`,
        type: 'lab_overdue',
        title: `Orden de lab atrasada · ${o.patient_name ?? 'paciente'}`,
        description: `${o.work_type ?? 'Trabajo'} en ${o.lab_name} — esperada ${o.due_on ?? '—'}`,
        href: '/laboratorios',
        date: o.due_on,
        severity: 'danger',
        icon: Microscope,
      })
    })

    // Más urgente primero: danger → warning → info; dentro de cada nivel, las
    // fechas más viejas (más atrasadas) arriba.
    const severityRank: Record<NotificationSeverity, number> = {
      danger: 0,
      warning: 1,
      info: 2,
    }
    return list.sort((a, b) => {
      const s = severityRank[a.severity] - severityRank[b.severity]
      if (s !== 0) return s
      if (!a.date) return 1
      if (!b.date) return -1
      return a.date.localeCompare(b.date)
    })
  }, [overdue.data, thisWeek.data, labs.data])

  return {
    items,
    count: items.length,
    dangerCount: items.filter((n) => n.severity === 'danger').length,
    isLoading,
  }
}
