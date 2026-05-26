import { useMemo } from 'react'
import { Lock } from 'lucide-react'
import type { AgendaBlock, Appointment } from '@/shared/types/agenda'
import { Card, CardContent } from '@/shared/ui/card'
import { cn } from '@/shared/lib/utils'
import { AppointmentStatusMenu } from './AppointmentStatusMenu'
import { colorForSpecialist } from './specialistColors'

const STATUS_BG: Record<string, string> = {
  scheduled: 'bg-slate-100 border-slate-300 text-slate-900',
  confirmed: 'bg-primary/15 border-primary/40 text-primary',
  arrived: 'bg-amber-100 border-amber-400 text-amber-900',
  in_room: 'bg-amber-200 border-amber-500 text-amber-900',
  completed: 'bg-emerald-100 border-emerald-400 text-emerald-900',
  no_show: 'bg-rose-100 border-rose-400 text-rose-900',
  cancelled: 'bg-muted text-muted-foreground line-through border-dashed',
}

function startOfWeek(d: Date): Date {
  const x = new Date(d)
  const day = x.getDay() // 0 = domingo
  const diff = day === 0 ? -6 : 1 - day // semana inicia en lunes
  x.setDate(x.getDate() + diff)
  x.setHours(0, 0, 0, 0)
  return x
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function formatDayLabel(d: Date): string {
  return d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

export function AgendaWeekView({
  date,
  appointments,
  blocks = [],
  colorBySpecialist = false,
  onSelectAppointment,
  onSelectBlock,
  onPickDay,
}: {
  date: Date
  appointments: Appointment[]
  blocks?: AgendaBlock[]
  colorBySpecialist?: boolean
  onSelectAppointment: (a: Appointment) => void
  onSelectBlock?: (b: AgendaBlock) => void
  onPickDay?: (day: Date) => void
}) {
  const week = useMemo(() => {
    const start = startOfWeek(date)
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }, [date])

  const byDay = useMemo(() => {
    const map = new Map<string, Appointment[]>()
    for (const a of appointments) {
      const k = new Date(a.starts_at).toDateString()
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(a)
    }
    return map
  }, [appointments])

  const blocksByDay = useMemo(() => {
    const map = new Map<string, AgendaBlock[]>()
    for (const b of blocks) {
      // Un bloqueo puede abarcar varios días — aquí lo asociamos a la fecha
      // de inicio para mostrarlo en su día principal. Bloqueos multi-día
      // se replican por cada día tocado.
      const s = new Date(b.starts_at)
      const e = new Date(b.ends_at)
      const cur = new Date(s)
      cur.setHours(0, 0, 0, 0)
      const endDay = new Date(e)
      endDay.setHours(0, 0, 0, 0)
      while (cur.getTime() <= endDay.getTime()) {
        const k = cur.toDateString()
        if (!map.has(k)) map.set(k, [])
        map.get(k)!.push(b)
        cur.setDate(cur.getDate() + 1)
      }
    }
    return map
  }, [blocks])

  const today = new Date().toDateString()

  return (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <div className="grid grid-cols-7 min-w-[840px]">
          {week.map((d) => {
            const dayKey = d.toDateString()
            const list = (byDay.get(dayKey) ?? []).sort(
              (a, b) =>
                new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
            )
            const dayBlocks = blocksByDay.get(dayKey) ?? []
            const isToday = dayKey === today
            return (
              <div
                key={dayKey}
                className={cn(
                  'border-r last:border-r-0 flex flex-col min-h-[420px]',
                  isToday && 'bg-primary/5',
                )}
              >
                <button
                  type="button"
                  onClick={() => onPickDay?.(d)}
                  className="border-b px-3 py-2 text-left hover:bg-accent transition-colors"
                >
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {formatDayLabel(d).split(' ')[0]}
                  </p>
                  <p
                    className={cn(
                      'text-lg font-semibold',
                      isToday ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    {d.getDate()}
                  </p>
                </button>
                <div className="flex-1 p-1.5 space-y-1.5">
                  {dayBlocks.map((b) => (
                    <button
                      key={`block-${b.id}-${dayKey}`}
                      type="button"
                      onClick={() => onSelectBlock?.(b)}
                      className="w-full text-left rounded-md border border-dashed border-muted-foreground/40 bg-[repeating-linear-gradient(45deg,_var(--muted)_0_8px,_transparent_8px_16px)] px-2 py-1.5 text-muted-foreground hover:bg-muted/60 transition cursor-pointer"
                      title={b.title}
                    >
                      <p className="text-[10px] font-medium flex items-center gap-1">
                        <Lock className="size-3 shrink-0" />
                        <span className="truncate">{b.title}</span>
                      </p>
                      {!b.all_day ? (
                        <p className="text-[10px] opacity-80 tabular-nums">
                          {formatTime(b.starts_at)}–{formatTime(b.ends_at)}
                        </p>
                      ) : null}
                    </button>
                  ))}
                  {list.length === 0 && dayBlocks.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground text-center pt-3">
                      Sin citas
                    </p>
                  ) : (
                    list.map((a) => {
                      const specColor = colorBySpecialist
                        ? colorForSpecialist(a.specialist_id)
                        : null
                      return (
                      <div
                        key={a.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => onSelectAppointment(a)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            onSelectAppointment(a)
                          }
                        }}
                        className={cn(
                          'group w-full text-left rounded-md border px-2 py-1.5 shadow-sm hover:ring-2 hover:ring-primary/40 transition cursor-pointer',
                          STATUS_BG[a.status],
                          specColor ? `${specColor.leftBorder} border-l-4` : '',
                        )}
                      >
                        <div className="flex items-start gap-1">
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-medium tabular-nums">
                              {formatTime(a.starts_at)}
                            </p>
                            <p className="text-xs font-semibold truncate">
                              {a.patient_name ?? '—'}
                            </p>
                            {a.treatment_name ? (
                              <p className="text-[10px] truncate opacity-80">
                                {a.treatment_name}
                              </p>
                            ) : null}
                          </div>
                          <AppointmentStatusMenu appointment={a} />
                        </div>
                      </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
