import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts'
import { usePaymentsReport } from './hooks'
import { Kpi } from './Kpi'
import { ReportError } from './ReportError'
import type { DateRange } from './DateRangePicker'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'
import { formatMXN } from '@/shared/lib/utils'

const METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
}

const METHOD_COLORS: Record<string, string> = {
  cash: '#10b981',
  card: '#3b82f6',
  transfer: '#f59e0b',
}

function formatDay(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
  })
}

export function PaymentsReportPanel({ range }: { range: DateRange }) {
  const report = usePaymentsReport({ date_from: range.from, date_to: range.to })

  if (report.isError) {
    return <ReportError error={report.error} onRetry={() => report.refetch()} />
  }
  if (report.isPending) return <Skeleton className="h-64 w-full" />
  if (!report.data) return null

  const r = report.data

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi
          label="Total cobrado"
          value={formatMXN(r.totals.total)}
          hint={`${r.totals.count} pagos`}
        />
        {r.by_method.map((m) => (
          <Kpi
            key={m.method}
            label={METHOD_LABELS[m.method] ?? m.method}
            value={formatMXN(m.total)}
            hint={
              r.totals.total > 0
                ? `${((m.total / r.totals.total) * 100).toFixed(1)}%`
                : null
            }
          />
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribución por método</CardTitle>
          </CardHeader>
          <CardContent>
            {r.by_method.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">Sin cobros.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={r.by_method.map((m) => ({
                      name: METHOD_LABELS[m.method] ?? m.method,
                      value: m.total,
                      method: m.method,
                    }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                  >
                    {r.by_method.map((m) => (
                      <Cell key={m.method} fill={METHOD_COLORS[m.method] ?? '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatMXN(Number(value))}
                    contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cobros por día</CardTitle>
          </CardHeader>
          <CardContent>
            {r.by_day.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">Sin cobros.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart
                  data={r.by_day.map((d) => ({ day: formatDay(d.day), total: d.total }))}
                >
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
      </div>

      {r.by_user.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cobros por usuario (cobrador)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {r.by_user.map((u) => (
                <li
                  key={u.user_id ?? u.user_name}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-foreground">{u.user_name}</p>
                    <p className="text-xs text-muted-foreground">{u.count} pagos</p>
                  </div>
                  <p className="tabular-nums font-medium">{formatMXN(u.total)}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
