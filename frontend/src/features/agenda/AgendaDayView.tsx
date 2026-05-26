import { useMemo } from 'react'
import { Lock } from 'lucide-react'
import {
  APPOINTMENT_STATUS_LABELS,
  type AgendaBlock,
  type Appointment,
} from '@/shared/types/agenda'
import { Card, CardContent } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { cn } from '@/shared/lib/utils'
import { AppointmentStatusMenu } from './AppointmentStatusMenu'
import { colorForSpecialist } from './specialistColors'

const HOUR_START = 7 // 07:00
const HOUR_END = 22 // 22:00 (exclusive) — cubre turnos vespertinos
const PX_PER_MIN = 1.2 // 72px por hora

const STATUS_BG: Record<string, string> = {
  scheduled: 'bg-slate-100 border-slate-300 text-slate-900',
  confirmed: 'bg-primary/15 border-primary/40 text-primary',
  arrived: 'bg-amber-100 border-amber-400 text-amber-900',
  in_room: 'bg-amber-200 border-amber-500 text-amber-900',
  completed: 'bg-emerald-100 border-emerald-400 text-emerald-900',
  no_show: 'bg-rose-100 border-rose-400 text-rose-900',
  cancelled: 'bg-muted text-muted-foreground line-through border-dashed',
}

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

export function AgendaDayView({
  date,
  appointments,
  blocks = [],
  colorBySpecialist = false,
  onSelectAppointment,
  onSelectBlock,
  onPickSlot,
}: {
  date: Date
  appointments: Appointment[]
  blocks?: AgendaBlock[]
  /** Cuando true, agrega una barra izquierda de color por dentista para
   *  poder distinguirlos cuando se ven todos en la misma vista. */
  colorBySpecialist?: boolean
  onSelectAppointment: (a: Appointment) => void
  onSelectBlock?: (b: AgendaBlock) => void
  onPickSlot?: (slot: Date) => void
}) {
  const day = startOfDay(date)

  const hourRows = useMemo(() => {
    const rows: Date[] = []
    for (let h = HOUR_START; h < HOUR_END; h++) {
      const d = new Date(day)
      d.setHours(h, 0, 0, 0)
      rows.push(d)
    }
    return rows
  }, [day])

  const totalMinutes = (HOUR_END - HOUR_START) * 60
  const totalHeight = totalMinutes * PX_PER_MIN

  const dayStart = day.getTime() + HOUR_START * 60 * 60_000
  const dayEnd = day.getTime() + HOUR_END * 60 * 60_000

  const items = useMemo(() => {
    return appointments
      .filter((a) => {
        const s = new Date(a.starts_at).getTime()
        const e = new Date(a.ends_at).getTime()
        return e > dayStart && s < dayEnd
      })
      .map((a) => {
        const s = new Date(a.starts_at).getTime()
        const e = new Date(a.ends_at).getTime()
        const startMin = Math.max(0, (s - dayStart) / 60_000)
        const endMin = Math.min(totalMinutes, (e - dayStart) / 60_000)
        return {
          appt: a,
          top: startMin * PX_PER_MIN,
          height: Math.max(28, (endMin - startMin) * PX_PER_MIN),
        }
      })
  }, [appointments, dayStart, dayEnd, totalMinutes])

  // Separamos los bloqueos en dos: los que aparecen como banda superior
  // (all-day, multi-día o totalmente fuera del horario visible) y los que
  // caen dentro de la grilla horaria. Los de banda nunca se "pierden" aunque
  // sean a las 23:00 o todo el día completo.
  const dayMidnight = day.getTime()
  const nextMidnight = day.getTime() + 24 * 60 * 60_000

  const { topBlocks, gridBlocks } = useMemo(() => {
    const top: typeof blocks = []
    const grid: Array<{ block: (typeof blocks)[number]; top: number; height: number }> = []
    for (const b of blocks) {
      const s = new Date(b.starts_at).getTime()
      const e = new Date(b.ends_at).getTime()
      // Si el bloque no toca el día actual, lo ignoramos.
      if (e <= dayMidnight || s >= nextMidnight) continue

      const coversWholeDay = s <= dayMidnight && e >= nextMidnight
      const startsBeforeVisible = s < dayStart
      const endsAfterVisible = e > dayEnd
      const isAllDayOrCoversEntireDay =
        b.all_day || coversWholeDay || (startsBeforeVisible && endsAfterVisible)

      if (isAllDayOrCoversEntireDay) {
        top.push(b)
        continue
      }

      // Bloques con horas — anclados al rango visible.
      const startMin = Math.max(0, (s - dayStart) / 60_000)
      const endMin = Math.min(totalMinutes, (e - dayStart) / 60_000)
      if (endMin <= startMin) {
        // Cae completamente fuera del horario visible → a la banda superior
        // para no perderlo (ej. bloqueo de 23:00–01:00).
        top.push(b)
        continue
      }
      grid.push({
        block: b,
        top: startMin * PX_PER_MIN,
        height: Math.max(22, (endMin - startMin) * PX_PER_MIN),
      })
    }
    return { topBlocks: top, gridBlocks: grid }
  }, [blocks, dayStart, dayEnd, totalMinutes, dayMidnight, nextMidnight])

  return (
    <Card>
      <CardContent className="p-0">
        {/* Banda superior con bloqueos all-day / multi-día / fuera del horario */}
        {topBlocks.length > 0 ? (
          <div className="border-b bg-muted/30 px-3 py-2 space-y-1">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Agenda cerrada · {topBlocks.length}{' '}
              {topBlocks.length === 1 ? 'bloqueo' : 'bloqueos'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {topBlocks.map((b) => (
                <button
                  key={`top-${b.id}`}
                  type="button"
                  onClick={() => onSelectBlock?.(b)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-muted-foreground/40 bg-[repeating-linear-gradient(45deg,_var(--muted)_0_8px,_transparent_8px_16px)] px-2 py-1 text-xs text-muted-foreground hover:bg-muted/60 transition"
                  title={b.notes ?? b.title}
                >
                  <Lock className="size-3" />
                  <span className="font-medium">{b.title}</span>
                  {b.all_day ? (
                    <span className="text-[10px] opacity-70">· todo el día</span>
                  ) : (
                    <span className="text-[10px] opacity-70 tabular-nums">
                      {formatTime(b.starts_at)}–{formatTime(b.ends_at)}
                    </span>
                  )}
                  {b.specialist_name ? (
                    <span className="text-[10px] opacity-70">
                      · {b.specialist_name}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="relative flex" style={{ height: totalHeight }}>
          {/* Eje de horas */}
          <div className="w-16 border-r bg-muted/20 shrink-0">
            {hourRows.map((h) => (
              <div
                key={h.toISOString()}
                className="text-[10px] text-muted-foreground text-right pr-2 -mt-1.5 font-mono"
                style={{ height: 60 * PX_PER_MIN }}
              >
                {h.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              </div>
            ))}
          </div>

          {/* Lienzo de citas */}
          <div className="relative flex-1">
            {/* Líneas de horas */}
            {hourRows.map((h, i) => (
              <button
                type="button"
                key={h.toISOString()}
                onClick={() => onPickSlot?.(new Date(h))}
                className={cn(
                  'absolute left-0 right-0 border-b border-dashed border-border/50 hover:bg-accent/40 transition-colors',
                  i === 0 && 'border-t',
                )}
                style={{
                  top: i * 60 * PX_PER_MIN,
                  height: 60 * PX_PER_MIN,
                }}
                aria-label={`Crear cita a las ${h.getHours()}:00`}
              />
            ))}

            {/* Bloqueos (van abajo de las citas, encima del lienzo) */}
            {gridBlocks.map(({ block, top, height }) => (
              <div
                key={`block-${block.id}`}
                role="button"
                tabIndex={0}
                onClick={() => onSelectBlock?.(block)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelectBlock?.(block)
                  }
                }}
                className="absolute left-1 right-1 rounded-md border border-dashed border-muted-foreground/40 bg-[repeating-linear-gradient(45deg,_var(--muted)_0_8px,_transparent_8px_16px)] px-2 py-1.5 text-left text-muted-foreground hover:bg-muted/60 transition cursor-pointer"
                style={{ top, height }}
                title={block.title}
              >
                <div className="flex items-center gap-1.5 text-[11px] font-medium">
                  <Lock className="size-3 shrink-0" />
                  <span className="truncate">{block.title}</span>
                </div>
                {block.specialist_name ? (
                  <p className="text-[10px] truncate opacity-80">
                    {block.specialist_name}
                  </p>
                ) : (
                  <p className="text-[10px] opacity-70">Toda la clínica</p>
                )}
              </div>
            ))}

            {/* Citas */}
            {items.map(({ appt, top, height }) => {
              const specColor = colorBySpecialist
                ? colorForSpecialist(appt.specialist_id)
                : null
              return (
              <div
                key={appt.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectAppointment(appt)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelectAppointment(appt)
                  }
                }}
                className={cn(
                  'group absolute left-1 right-1 rounded-md border px-2 py-1.5 text-left shadow-sm overflow-hidden hover:ring-2 hover:ring-primary/40 transition cursor-pointer',
                  STATUS_BG[appt.status] ?? 'bg-slate-100',
                  specColor ? `${specColor.leftBorder} border-l-4` : '',
                )}
                style={{ top, height }}
              >
                <div className="flex items-start gap-1">
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium tabular-nums">
                      {formatTime(appt.starts_at)}–{formatTime(appt.ends_at)}
                    </div>
                    <div className="text-xs font-semibold truncate">
                      {appt.patient_name ?? '—'}
                    </div>
                    {appt.treatment_name ? (
                      <div className="text-[10px] truncate opacity-80">
                        {appt.treatment_name}
                      </div>
                    ) : null}
                    {appt.specialist_name ? (
                      <div className="text-[10px] truncate opacity-80">
                        {appt.specialist_name}
                      </div>
                    ) : null}
                  </div>
                  <AppointmentStatusMenu appointment={appt} />
                </div>
              </div>
              )
            })}

            {/* Hora actual */}
            <NowLine day={day} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function NowLine({ day }: { day: Date }) {
  const now = new Date()
  const sameDay =
    now.getFullYear() === day.getFullYear() &&
    now.getMonth() === day.getMonth() &&
    now.getDate() === day.getDate()
  if (!sameDay) return null

  const min = (now.getHours() - HOUR_START) * 60 + now.getMinutes()
  if (min < 0 || min > (HOUR_END - HOUR_START) * 60) return null
  const top = min * PX_PER_MIN
  return (
    <div
      className="absolute left-0 right-0 pointer-events-none z-10"
      style={{ top }}
    >
      <div className="h-px bg-rose-500/80" />
      <div className="absolute -left-1 -top-1.5 size-3 rounded-full bg-rose-500" />
    </div>
  )
}

export function StatusLegend() {
  return (
    <div className="flex flex-wrap gap-1.5 text-xs">
      {Object.entries(APPOINTMENT_STATUS_LABELS).map(([key, label]) => (
        <Badge
          key={key}
          variant="outline"
          className={cn('font-normal border', STATUS_BG[key])}
        >
          {label}
        </Badge>
      ))}
    </div>
  )
}
