import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useCommissionsReport } from './hooks'
import { useSpecialists } from '@/features/specialists/hooks'
import { Kpi } from './Kpi'
import { ReportError } from './ReportError'
import type { DateRange } from './DateRangePicker'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
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
import { formatMXN } from '@/shared/lib/utils'

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function CommissionsReportPanel({ range }: { range: DateRange }) {
  const specialists = useSpecialists()
  const [specialistFilter, setSpecialistFilter] = useState<string>('all')
  const report = useCommissionsReport({
    date_from: range.from,
    date_to: range.to,
    specialist_id:
      specialistFilter !== 'all' ? Number(specialistFilter) : undefined,
  })

  if (report.isError) {
    return <ReportError error={report.error} onRetry={() => report.refetch()} />
  }
  if (report.isPending) return <Skeleton className="h-64 w-full" />
  if (!report.data) return null

  const r = report.data
  const avgPercent =
    r.totals.base > 0 ? (r.totals.commission / r.totals.base) * 100 : 0

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-muted-foreground">
          Comisiones devengadas: snapshot al momento de cobrar (no incluye cobros cancelados).
        </p>
        <Select value={specialistFilter} onValueChange={setSpecialistFilter}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Especialista" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los especialistas</SelectItem>
            {specialists.data?.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi
          label="Comisión total"
          value={formatMXN(r.totals.commission)}
          hint={`${r.totals.count} líneas`}
        />
        <Kpi
          label="Base facturada"
          value={formatMXN(r.totals.base)}
          hint="Suma de líneas con dentista asignado"
        />
        <Kpi
          label="% promedio"
          value={`${avgPercent.toFixed(1)}%`}
          hint="Comisión / base"
        />
        <Kpi
          label="Promedio por línea"
          value={r.totals.count > 0 ? formatMXN(r.totals.commission / r.totals.count) : '—'}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Por especialista</CardTitle>
        </CardHeader>
        <CardContent>
          {r.by_specialist.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              Sin datos en el rango.
            </p>
          ) : (
            <ResponsiveContainer
              width="100%"
              height={Math.max(220, r.by_specialist.length * 44)}
            >
              <BarChart
                data={r.by_specialist.map((s) => ({
                  name: s.specialist_name,
                  commission: s.commission,
                  base: s.line_total,
                }))}
                layout="vertical"
                margin={{ left: 8, right: 16 }}
              >
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => formatMXN(v).replace(/\.00$/, '')}
                />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={140} />
                <Tooltip
                  formatter={(value) => formatMXN(Number(value))}
                  contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}
                />
                <Bar dataKey="commission" name="Comisión" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalle por línea</CardTitle>
        </CardHeader>
        <CardContent>
          {r.items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">Sin datos.</p>
          ) : (
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Folio</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Tratamiento</TableHead>
                  <TableHead>Especialista</TableHead>
                  <TableHead className="text-right">Base</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead className="text-right">Comisión</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {r.items.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(it.charge_created_at)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {it.charge_code ?? `CHG-${it.charge_id}`}
                    </TableCell>
                    <TableCell className="truncate max-w-[10rem]">
                      {it.patient_name}
                    </TableCell>
                    <TableCell className="truncate max-w-[12rem]">
                      {it.treatment_name}
                    </TableCell>
                    <TableCell className="truncate max-w-[10rem] text-muted-foreground">
                      {it.specialist_name}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatMXN(it.line_total)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {it.commission_percent != null ? `${it.commission_percent}%` : '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatMXN(it.commission_amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
