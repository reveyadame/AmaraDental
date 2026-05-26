import { useMemo } from 'react'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Button } from '@/shared/ui/button'

export interface DateRange {
  from: string // yyyy-mm-dd
  to: string
}

interface Props {
  value: DateRange
  onChange: (next: DateRange) => void
}

function toDateInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function startOfWeek(d: Date): Date {
  const x = new Date(d)
  const day = x.getDay()
  const diff = day === 0 ? -6 : 1 - day
  x.setDate(x.getDate() + diff)
  return x
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}

export function presetToday(): DateRange {
  const today = new Date()
  const s = toDateInput(today)
  return { from: s, to: s }
}

export function presetThisWeek(): DateRange {
  const today = new Date()
  return { from: toDateInput(startOfWeek(today)), to: toDateInput(today) }
}

export function presetThisMonth(): DateRange {
  const today = new Date()
  return { from: toDateInput(startOfMonth(today)), to: toDateInput(today) }
}

export function presetLastMonth(): DateRange {
  const today = new Date()
  const firstThis = startOfMonth(today)
  const lastPrev = addDays(firstThis, -1)
  return { from: toDateInput(startOfMonth(lastPrev)), to: toDateInput(endOfMonth(lastPrev)) }
}

export function presetLast30Days(): DateRange {
  const today = new Date()
  return { from: toDateInput(addDays(today, -29)), to: toDateInput(today) }
}

export function DateRangePicker({ value, onChange }: Props) {
  const presets = useMemo(
    () => [
      { label: 'Hoy', range: presetToday() },
      { label: 'Esta semana', range: presetThisWeek() },
      { label: 'Este mes', range: presetThisMonth() },
      { label: 'Mes pasado', range: presetLastMonth() },
      { label: 'Últimos 30 días', range: presetLast30Days() },
    ],
    [],
  )

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => {
          const active = value.from === p.range.from && value.to === p.range.to
          return (
            <Button
              key={p.label}
              type="button"
              size="sm"
              variant={active ? 'default' : 'outline'}
              onClick={() => onChange(p.range)}
            >
              {p.label}
            </Button>
          )
        })}
      </div>
      <div className="grid grid-cols-2 gap-2 max-w-md">
        <div className="space-y-1">
          <Label htmlFor="rep-from" className="text-xs">
            Desde
          </Label>
          <Input
            id="rep-from"
            type="date"
            value={value.from}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="rep-to" className="text-xs">
            Hasta
          </Label>
          <Input
            id="rep-to"
            type="date"
            value={value.to}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
          />
        </div>
      </div>
    </div>
  )
}
