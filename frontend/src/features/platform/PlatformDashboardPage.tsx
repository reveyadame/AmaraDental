import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Building2, CheckCircle2, Loader2, Users, UserCog } from 'lucide-react'
import { useStats } from './hooks'
import type { PlatformStats } from './api'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

const PLAN_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#06b6d4', '#a855f7', '#94a3b8']

const SUB_LABELS: Record<keyof PlatformStats['by_subscription'], { label: string; color: string }> = {
  active: { label: 'Activas', color: 'text-emerald-600' },
  trial: { label: 'En prueba', color: 'text-sky-600' },
  past_due: { label: 'Morosas', color: 'text-amber-600' },
  canceled: { label: 'Canceladas', color: 'text-rose-600' },
  none: { label: 'Sin pago', color: 'text-muted-foreground' },
}

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Building2
  label: string
  value: string | number
  hint?: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  )
}

export function PlatformDashboardPage() {
  const stats = useStats()

  if (stats.isPending) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (stats.isError || !stats.data) {
    return <p className="text-sm text-muted-foreground">No se pudieron cargar las métricas.</p>
  }

  const d = stats.data
  const planChart = d.by_plan.filter((p) => p.count > 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Resumen general de Amara Dental.</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Building2}
          label="Clínicas"
          value={d.totals.tenants}
          hint={`${d.totals.active} activas · ${d.totals.suspended} suspendidas`}
        />
        <KpiCard
          icon={CheckCircle2}
          label="Suscripciones activas"
          value={d.by_subscription.active}
          hint={`${d.by_subscription.trial} en prueba`}
        />
        <KpiCard icon={Users} label="Pacientes" value={d.totals.patients.toLocaleString('es-MX')} />
        <KpiCard icon={UserCog} label="Usuarios" value={d.totals.users.toLocaleString('es-MX')} />
      </div>

      {/* Crecimiento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Crecimiento de clínicas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={d.growth} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(value, name) => [value as number, name === 'new' ? 'Altas' : 'Total']}
                  labelStyle={{ fontSize: 12 }}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Legend
                  formatter={(value) => (value === 'new' ? 'Altas del mes' : 'Total acumulado')}
                  wrapperStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="new" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Line type="monotone" dataKey="total" stroke="#22c55e" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Distribución por plan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribución por plan</CardTitle>
          </CardHeader>
          <CardContent>
            {planChart.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Aún no hay clínicas.</p>
            ) : (
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <div className="h-48 w-48 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={planChart}
                        dataKey="count"
                        nameKey="name"
                        innerRadius={48}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {planChart.map((_, i) => (
                          <Cell key={i} fill={PLAN_COLORS[i % PLAN_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="flex-1 space-y-2">
                  {planChart.map((p, i) => (
                    <li key={p.key} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span
                          className="size-3 rounded-sm"
                          style={{ backgroundColor: PLAN_COLORS[i % PLAN_COLORS.length] }}
                        />
                        {p.name}
                      </span>
                      <span className="font-medium">{p.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estado de suscripciones */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estado de suscripciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(Object.keys(SUB_LABELS) as (keyof typeof SUB_LABELS)[]).map((key) => (
                <div key={key} className="rounded-lg border p-3">
                  <p className={`text-2xl font-semibold ${SUB_LABELS[key].color}`}>
                    {d.by_subscription[key]}
                  </p>
                  <p className="text-xs text-muted-foreground">{SUB_LABELS[key].label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
