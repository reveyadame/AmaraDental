import { useMemo } from 'react'
import { Lock, Sparkles } from 'lucide-react'
import {
  APPOINTMENT_STATUS_LABELS,
  type AgendaBlock,
  type Appointment,
  type AppointmentStatus,
} from '@/shared/types/agenda'
import { cn } from '@/shared/lib/utils'
import { AppointmentStatusMenu } from './AppointmentStatusMenu'
import { colorForSpecialist } from './specialistColors'

// Rango horario visible y escala. 56px por hora ≈ look de Google Calendar.
const HOUR_START = 7
const HOUR_END = 22
const HOUR_PX = 56
const HOURS = HOUR_END - HOUR_START
const GRID_HEIGHT = HOURS * HOUR_PX
const GUTTER_W = 56

interface StatusStyle {
  bg: string
  text: string
  accent: string
  dot: string
}

const STATUS_STYLE: Record<AppointmentStatus, StatusStyle> = {
  scheduled: { bg: 'bg-sky-50 hover:bg-sky-100', text: 'text-sky-900', accent: 'border-l-sky-500', dot: 'bg-sky-500' },
  confirmed: { bg: 'bg-blue-100 hover:bg-blue-200', text: 'text-blue-900', accent: 'border-l-blue-600', dot: 'bg-blue-600' },
  arrived: { bg: 'bg-amber-50 hover:bg-amber-100', text: 'text-amber-900', accent: 'border-l-amber-500', dot: 'bg-amber-500' },
  in_room: { bg: 'bg-amber-100 hover:bg-amber-200', text: 'text-amber-950', accent: 'border-l-amber-600', dot: 'bg-amber-600' },
  completed: { bg: 'bg-emerald-50 hover:bg-emerald-100', text: 'text-emerald-900', accent: 'border-l-emerald-600', dot: 'bg-emerald-600' },
  no_show: { bg: 'bg-rose-50 hover:bg-rose-100', text: 'text-rose-900', accent: 'border-l-rose-500', dot: 'bg-rose-500' },
  cancelled: { bg: 'bg-muted hover:bg-muted/80', text: 'text-muted-foreground line-through', accent: 'border-l-muted-foreground/40', dot: 'bg-muted-foreground' },
}

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

const HOUR_ROWS = Array.from({ length: HOURS }, (_, i) => HOUR_START + i)

interface PositionedAppt {
  appt: Appointment
  top: number
  height: number
  leftPct: number
  widthPct: number
}

/** Empaqueta citas solapadas en columnas lado a lado, como Google Calendar. */
function layoutAppointments(appts: Appointment[], day: Date): PositionedAppt[] {
  const dayMid = startOfDay(day).getTime()
  const winStart = dayMid + HOUR_START * 3_600_000
  const winEnd = dayMid + HOUR_END * 3_600_000

  const items = appts
    .filter((a) => {
      const s = +new Date(a.starts_at)
      const e = +new Date(a.ends_at)
      return e > winStart && s < winEnd
    })
    .map((a) => {
      const s = +new Date(a.starts_at)
      const e = +new Date(a.ends_at)
      const startMin = Math.max(0, (s - winStart) / 60_000)
      const rawEnd = Math.min(HOURS * 60, (e - winStart) / 60_000)
      return { appt: a, startMin, endMin: Math.max(rawEnd, startMin + 15) }
    })
    .sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin)

  const out: PositionedAppt[] = []
  let cluster: typeof items = []
  let clusterEnd = -Infinity

  const flush = () => {
    const colEnds: number[] = []
    const colOf: number[] = []
    cluster.forEach((it, idx) => {
      let placed = -1
      for (let c = 0; c < colEnds.length; c++) {
        if ((colEnds[c] ?? -Infinity) <= it.startMin) {
          colEnds[c] = it.endMin
          placed = c
          break
        }
      }
      if (placed < 0) {
        colEnds.push(it.endMin)
        placed = colEnds.length - 1
      }
      colOf[idx] = placed
    })
    const total = colEnds.length || 1
    cluster.forEach((it, idx) => {
      const col = colOf[idx] ?? 0
      out.push({
        appt: it.appt,
        top: (it.startMin / 60) * HOUR_PX,
        height: Math.max(18, ((it.endMin - it.startMin) / 60) * HOUR_PX),
        leftPct: (col / total) * 100,
        widthPct: 100 / total,
      })
    })
    cluster = []
    clusterEnd = -Infinity
  }

  for (const it of items) {
    if (cluster.length && it.startMin >= clusterEnd) flush()
    cluster.push(it)
    clusterEnd = Math.max(clusterEnd, it.endMin)
  }
  if (cluster.length) flush()
  return out
}

interface TimedBlock {
  block: AgendaBlock
  top: number
  height: number
}

/** Separa los bloqueos del día en banda "todo el día" y bloques con hora. */
function splitBlocks(blocks: AgendaBlock[], day: Date) {
  const dayMid = startOfDay(day).getTime()
  const nextMid = dayMid + 24 * 3_600_000
  const winStart = dayMid + HOUR_START * 3_600_000

  const allDay: AgendaBlock[] = []
  const timed: TimedBlock[] = []

  for (const b of blocks) {
    const s = +new Date(b.starts_at)
    const e = +new Date(b.ends_at)
    if (e <= dayMid || s >= nextMid) continue

    const coversWholeDay = s <= dayMid && e >= nextMid
    const startMin = Math.max(0, (s - winStart) / 60_000)
    const endMin = Math.min(HOURS * 60, (e - winStart) / 60_000)

    if (b.all_day || coversWholeDay || endMin <= startMin) {
      allDay.push(b)
      continue
    }
    timed.push({
      block: b,
      top: (startMin / 60) * HOUR_PX,
      height: Math.max(18, ((endMin - startMin) / 60) * HOUR_PX),
    })
  }
  return { allDay, timed }
}

interface Props {
  days: Date[]
  appointments: Appointment[]
  blocks?: AgendaBlock[]
  colorBySpecialist?: boolean
  selectedId?: number | null
  onSelectAppointment: (a: Appointment) => void
  onSelectBlock?: (b: AgendaBlock) => void
  onPickSlot?: (slot: Date) => void
}

export function AgendaTimeGrid({
  days,
  appointments,
  blocks = [],
  colorBySpecialist = false,
  selectedId = null,
  onSelectAppointment,
  onSelectBlock,
  onPickSlot,
}: Props) {
  const isWeek = days.length > 1
  const now = new Date()

  const perDay = useMemo(
    () =>
      days.map((d) => ({
        date: d,
        appts: layoutAppointments(appointments, d),
        ...splitBlocks(blocks, d),
      })),
    [days, appointments, blocks],
  )

  const hasAllDay = perDay.some((d) => d.allDay.length > 0)

  const pickSlot = (e: React.MouseEvent<HTMLDivElement>, day: Date) => {
    if (!onPickSlot) return
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const totalMin = Math.max(0, Math.min(HOURS * 60, (y / HOUR_PX) * 60))
    const rounded = Math.floor(totalMin / 30) * 30
    const slot = startOfDay(day)
    slot.setMinutes(HOUR_START * 60 + rounded)
    onPickSlot(slot)
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
      <div style={{ minWidth: isWeek ? 760 : undefined }}>
        {/* Cabecera de días (sticky) */}
        <div className="sticky top-0 z-20 flex border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div
            className="sticky left-0 z-30 shrink-0 border-r bg-card"
            style={{ width: GUTTER_W }}
          />
          {perDay.map(({ date }) => {
            const isToday = sameDay(date, now)
            const weekday = date.toLocaleDateString('es-MX', {
              weekday: isWeek ? 'short' : 'long',
            })
            return (
              <div
                key={date.toISOString()}
                className="flex-1 min-w-0 border-l first:border-l-0 px-1 py-2 text-center"
              >
                <div
                  className={cn(
                    'text-[11px] uppercase tracking-wide truncate',
                    isToday ? 'text-primary font-semibold' : 'text-muted-foreground',
                  )}
                >
                  {weekday}
                </div>
                <div
                  className={cn(
                    'mx-auto mt-1 grid size-9 place-items-center rounded-full text-lg font-semibold transition-colors',
                    isToday
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground',
                  )}
                >
                  {date.getDate()}
                </div>
              </div>
            )
          })}
        </div>

        {/* Banda de "todo el día" / agenda cerrada */}
        {hasAllDay ? (
          <div className="flex border-b bg-muted/20">
            <div
              className="sticky left-0 z-30 shrink-0 border-r bg-card px-2 py-1.5 text-right text-[10px] uppercase tracking-wide text-muted-foreground"
              style={{ width: GUTTER_W }}
            >
              Todo el día
            </div>
            {perDay.map(({ date, allDay }) => (
              <div
                key={date.toISOString()}
                className="flex-1 min-w-0 border-l first:border-l-0 p-1 space-y-1"
              >
                {allDay.map((b) => (
                  <button
                    key={`allday-${b.id}`}
                    type="button"
                    onClick={() => onSelectBlock?.(b)}
                    title={b.notes ?? b.title}
                    className="flex w-full items-center gap-1 rounded border border-dashed border-muted-foreground/40 bg-[repeating-linear-gradient(45deg,_var(--muted)_0_6px,_transparent_6px_12px)] px-1.5 py-1 text-left text-[11px] text-muted-foreground hover:bg-muted/60 transition"
                  >
                    <Lock className="size-3 shrink-0" />
                    <span className="truncate font-medium">{b.title}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        ) : null}

        {/* Cuerpo de la grilla */}
        <div className="flex pt-2">
          {/* Eje de horas — fijo durante el scroll horizontal */}
          <div
            className="sticky left-0 z-40 shrink-0 border-r bg-card"
            style={{ width: GUTTER_W, height: GRID_HEIGHT }}
          >
            {HOUR_ROWS.map((h, i) => (
              <span
                key={h}
                className="absolute right-2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground tabular-nums"
                style={{ top: i * HOUR_PX }}
              >
                {String(h).padStart(2, '0')}:00
              </span>
            ))}
          </div>

          {/* Columnas por día */}
          {perDay.map(({ date, appts, timed }) => {
            const isToday = sameDay(date, now)
            return (
              <div
                key={date.toISOString()}
                className="relative flex-1 min-w-0 border-l first:border-l-0"
                style={{ height: GRID_HEIGHT }}
              >
                {/* Capa de click para crear cita */}
                <div
                  className="absolute inset-0 cursor-pointer"
                  onClick={(e) => pickSlot(e, date)}
                  aria-label="Crear cita"
                />

                {/* Líneas de hora */}
                {HOUR_ROWS.map((h, i) => (
                  <div
                    key={h}
                    className="pointer-events-none absolute inset-x-0 border-t border-border/60"
                    style={{ top: i * HOUR_PX }}
                  />
                ))}
                <div
                  className="pointer-events-none absolute inset-x-0 border-t border-border/60"
                  style={{ top: GRID_HEIGHT }}
                />

                {/* Bloqueos con hora */}
                {timed.map(({ block, top, height }) => (
                  <button
                    key={`block-${block.id}`}
                    type="button"
                    onClick={() => onSelectBlock?.(block)}
                    title={block.title}
                    className="absolute inset-x-0.5 z-10 overflow-hidden rounded border border-dashed border-muted-foreground/40 bg-[repeating-linear-gradient(45deg,_var(--muted)_0_6px,_transparent_6px_12px)] px-1.5 py-0.5 text-left text-muted-foreground hover:bg-muted/60 transition"
                    style={{ top, height }}
                  >
                    <span className="flex items-center gap-1 text-[10px] font-medium">
                      <Lock className="size-3 shrink-0" />
                      <span className="truncate">{block.title}</span>
                    </span>
                  </button>
                ))}

                {/* Citas */}
                {appts.map(({ appt, top, height, leftPct, widthPct }) => {
                  const style = STATUS_STYLE[appt.status]
                  const specColor = colorBySpecialist
                    ? colorForSpecialist(appt.specialist_id)
                    : null
                  const compact = height < 38
                  const selected = selectedId === appt.id
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
                      title={`${formatTime(appt.starts_at)} · ${appt.patient_name ?? ''}${
                        appt.patient_is_first_visit ? ' · Primera vez' : ''
                      }`}
                      className={cn(
                        'group absolute z-20 overflow-hidden rounded-md border-l-4 px-1.5 py-0.5 text-left shadow-sm transition cursor-pointer',
                        style.bg,
                        style.text,
                        specColor ? specColor.leftBorder : style.accent,
                        selected && 'ring-2 ring-primary ring-offset-1',
                      )}
                      style={{
                        top,
                        height,
                        left: `calc(${leftPct}% + 2px)`,
                        width: `calc(${widthPct}% - 4px)`,
                      }}
                    >
                      <div className="flex items-start gap-1">
                        <div className="min-w-0 flex-1 leading-tight">
                          {compact ? (
                            <p className="truncate text-[11px] font-semibold">
                              <span className="font-medium tabular-nums opacity-80">
                                {formatTime(appt.starts_at)}
                              </span>{' '}
                              {appt.patient_is_first_visit ? (
                                <Sparkles
                                  className="inline size-3 -mt-0.5 mr-0.5 text-lime-700"
                                  aria-label="Primera vez"
                                />
                              ) : null}
                              {appt.patient_name ?? '—'}
                            </p>
                          ) : (
                            <>
                              <p className="truncate text-[10px] font-medium tabular-nums opacity-80">
                                {formatTime(appt.starts_at)}–{formatTime(appt.ends_at)}
                              </p>
                              <p className="truncate text-xs font-semibold flex items-center gap-1">
                                {appt.patient_is_first_visit ? (
                                  <Sparkles
                                    className="size-3 shrink-0 text-lime-700"
                                    aria-label="Primera vez"
                                  />
                                ) : null}
                                <span className="truncate">{appt.patient_name ?? '—'}</span>
                              </p>
                              {appt.treatment_name ? (
                                <p className="truncate text-[10px] opacity-80">
                                  {appt.treatment_name}
                                </p>
                              ) : null}
                              {colorBySpecialist && appt.specialist_name ? (
                                <p className="truncate text-[10px] opacity-70">
                                  {appt.specialist_name}
                                </p>
                              ) : null}
                            </>
                          )}
                        </div>
                        <div className="opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                          <AppointmentStatusMenu appointment={appt} />
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Línea de "ahora" solo en la columna de hoy */}
                {isToday ? <NowLine /> : null}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function NowLine() {
  const now = new Date()
  const min = (now.getHours() - HOUR_START) * 60 + now.getMinutes()
  if (min < 0 || min > HOURS * 60) return null
  const top = (min / 60) * HOUR_PX
  return (
    <div className="pointer-events-none absolute inset-x-0 z-30" style={{ top }}>
      <div className="absolute -left-1 -top-[5px] size-2.5 rounded-full bg-rose-500" />
      <div className="h-[2px] bg-rose-500" />
    </div>
  )
}

export function StatusLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
      {(Object.keys(APPOINTMENT_STATUS_LABELS) as AppointmentStatus[]).map((key) => (
        <span key={key} className="inline-flex items-center gap-1.5">
          <span className={cn('inline-block size-2.5 rounded-full', STATUS_STYLE[key].dot)} />
          {APPOINTMENT_STATUS_LABELS[key]}
        </span>
      ))}
    </div>
  )
}
