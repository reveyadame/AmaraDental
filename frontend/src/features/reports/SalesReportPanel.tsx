import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useSalesReport } from './hooks'
import { Kpi } from './Kpi'
import { ReportError } from './ReportError'
import type { DateRange } from './DateRangePicker'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import { formatMXN } from '@/shared/lib/utils'

function formatDay(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
  })
}

export function SalesReportPanel({ range }: { range: DateRange }) {
  const report = useSalesReport({ date_from: range.from, date_to: range.to })

  if (report.isError) {
    return <ReportError error={report.error} onRetry={() => report.refetch()} />
  }
  if (report.isPending) {
    return <Skeleton className="h-64 w-full" />
  }
  if (!report.data) return null

  const r = report.data

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi
          label="Ventas brutas"
          value={formatMXN(r.totals.gross)}
          hint={`${r.totals.lines} líneas`}
        />
        <Kpi
          label="Descuentos"
          value={`− ${formatMXN(r.totals.discount)}`}
          hint={r.totals.gross > 0 ? `${((r.totals.discount / r.totals.gross) * 100).toFixed(1)}% del bruto` : null}
        />
        <Kpi label="Ventas netas" value={formatMXN(r.totals.net)} />
        <Kpi
          label="Cobros emitidos"
          value={r.totals.charges.toLocaleString('es-MX')}
          hint={r.totals.charges > 0 ? `${formatMXN(r.totals.net / r.totals.charges)} promedio` : null}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ventas por día</CardTitle>
        </CardHeader>
        <CardContent>
          {r.by_day.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              Sin ventas en el rango.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={r.by_day.map((d) => ({ day: formatDay(d.day), total: d.total }))}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => formatMXN(v).replace(/\.00$/, '')}
                  width={80}
                />
                <Tooltip
                  formatter={(value) => formatMXN(Number(value))}
                  contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top tratamientos</CardTitle>
          </CardHeader>
          <CardContent>
            {r.by_treatment.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">Sin datos.</p>
            ) : (
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Tratamiento</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {r.by_treatment.slice(0, 10).map((t) => (
                    <TableRow key={t.treatment_id ?? t.treatment_name}>
                      <TableCell className="truncate max-w-[16rem]">{t.treatment_name}</TableCell>
                      <TableCell className="text-right tabular-nums">{t.qty}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMXN(t.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ventas por especialista</CardTitle>
          </CardHeader>
          <CardContent>
            {r.by_specialist.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">Sin datos.</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(220, r.by_specialist.length * 40)}>
                <BarChart
                  data={r.by_specialist.map((s) => ({ name: s.specialist_name, total: s.total }))}
                  layout="vertical"
                  margin={{ left: 8, right: 16 }}
                >
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => formatMXN(v).replace(/\.00$/, '')}
                  />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip
                    formatter={(value) => formatMXN(Number(value))}
                    contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}
                  />
                  <Bar dataKey="total" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
