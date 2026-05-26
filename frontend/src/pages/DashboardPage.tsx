import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Banknote,
  BellRing,
  CalendarDays,
  CreditCard,
  HandCoins,
  Lock,
  Microscope,
  Phone,
  Plus,
  ReceiptText,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useDashboard } from '@/features/dashboard/hooks'
import { useMe } from '@/features/auth/hooks'
import { Card, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Skeleton } from '@/shared/ui/skeleton'
import { cn, formatMXN } from '@/shared/lib/utils'

const STATUS_DOT: Record<string, string> = {
  scheduled: 'bg-slate-400',
  confirmed: 'bg-primary',
  arrived: 'bg-amber-400',
  in_room: 'bg-amber-600',
  completed: 'bg-emerald-500',
  no_show: 'bg-rose-500',
  cancelled: 'bg-muted-foreground',
}

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Programada',
  confirmed: 'Confirmada',
  arrived: 'En sala',
  in_room: 'En consulta',
  completed: 'Completada',
  no_show: 'No-show',
  cancelled: 'Cancelada',
}

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDayShort(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
  })
}

function pctDelta(curr: number, prev: number): number | null {
  if (prev === 0) return curr === 0 ? 0 : null
  return ((curr - prev) / prev) * 100
}

function Trend({ delta }: { delta: number | null }) {
  if (delta === null) {
    return (
      <span className="text-[10px] text-muted-foreground">
        — sin referencia
      </span>
    )
  }
  if (Math.abs(delta) < 0.5) {
    return (
      <span className="text-[10px] text-muted-foreground">sin cambio</span>
    )
  }
  const up = delta > 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[10px] font-medium',
        up ? 'text-emerald-600' : 'text-rose-600',
      )}
    >
      {up ? (
        <TrendingUp className="size-3" />
      ) : (
        <TrendingDown className="size-3" />
      )}
      {Math.abs(delta).toFixed(0)}% vs ayer
    </span>
  )
}

type KpiTone = 'default' | 'success' | 'warning' | 'danger' | 'info'

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'default',
  to,
}: {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  icon: LucideIcon
  tone?: KpiTone
  to?: string
}) {
  const toneStyles: Record<KpiTone, { badge: string; bar: string }> = {
    default: { badge: 'bg-primary/10 text-primary', bar: 'bg-primary' },
    success: { badge: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500' },
    warning: { badge: 'bg-amber-100 text-amber-700', bar: 'bg-amber-500' },
    danger: { badge: 'bg-rose-100 text-rose-700', bar: 'bg-rose-500' },
    info: { badge: 'bg-sky-100 text-sky-700', bar: 'bg-sky-500' },
  }
  const styles = toneStyles[tone]

  const inner = (
    <Card
      className={cn(
        'h-full overflow-hidden transition-shadow relative',
        to && 'hover:shadow-md cursor-pointer',
      )}
    >
      <span
        className={cn('absolute inset-x-0 top-0 h-1', styles.bar)}
        aria-hidden
      />
      <CardContent className="p-5 pt-6 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <span
            className={cn(
              'grid size-8 place-items-center rounded-md',
              styles.badge,
            )}
          >
            <Icon className="size-4" />
          </span>
        </div>
        <p className="text-2xl font-semibold tabular-nums text-foreground">
          {value}
        </p>
        {hint ? <div className="text-xs">{hint}</div> : null}
      </CardContent>
    </Card>
  )
  return to ? (
    <Link to={to} className="block h-full">
      {inner}
    </Link>
  ) : (
    inner
  )
}

function QuickAction({
  to,
  label,
  icon: Icon,
}: {
  to: string
  label: string
  icon: LucideIcon
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-lg border bg-card p-3 hover:border-primary/50 hover:bg-primary/5 transition-colors"
    >
      <span className="grid size-9 place-items-center rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        <Icon className="size-4" />
      </span>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </Link>
  )
}

export function DashboardPage() {
  const { data: me } = useMe()
  const dashboard = useDashboard()
  const firstName = me?.name?.split(' ')[0] ?? ''
  const today = new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())

  const isAdmin = me?.roles.includes('admin') ?? false
  const canOperate = me?.permissions.includes('cash.operate') ?? false
  const canViewReports = me?.permissions.includes('reports.view') ?? false
  const canCreateCharges = me?.permissions.includes('charges.create') ?? false
  const canManageAppointments =
    me?.permissions.includes('appointments.manage') ?? false
  const canReadBasicPatient =
    me?.permissions.includes('patients.read_basic') ?? false
  const canManageRecalls = me?.permissions.includes('recalls.manage') ?? false
  const canManage = me?.permissions.includes('patients.manage') ?? false
  // Si el usuario no tiene NINGÚN permiso en el dashboard, mostramos un
  // mensaje amistoso pidiendo configurar roles.
  const hasAnyDashboardPerm =
    canOperate ||
    canViewReports ||
    canCreateCharges ||
    canManageAppointments ||
    canReadBasicPatient ||
    canManageRecalls ||
    isAdmin

  const d = dashboard.data
  const revenueDelta = d
    ? pctDelta(d.kpis.revenue_today, d.kpis.revenue_yesterday)
    : null

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6">
      {/* Saludo */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground capitalize">{today}</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Hola, {firstName} 👋
          </h1>
        </div>
        {d?.cash_session ? (
          <Link to="/caja">
            <Badge className="bg-emerald-100 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 px-3 py-1.5">
              <Lock className="size-3.5 mr-1" />
              Caja abierta · {formatMXN(d.cash_session.payments_total)}
            </Badge>
          </Link>
        ) : canOperate ? (
          <Link to="/caja">
            <Badge variant="outline" className="text-muted-foreground px-3 py-1.5">
              <Lock className="size-3.5 mr-1" />
              Caja cerrada
            </Badge>
          </Link>
        ) : null}
      </header>

      {!hasAnyDashboardPerm ? (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center space-y-3">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-muted">
              <Lock className="size-6 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Tu cuenta aún no tiene un rol asignado
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Pídele a un administrador que te configure desde el módulo de
              Usuarios. Por ahora no puedes acceder a ningún módulo.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {/* KPIs */}
      {hasAnyDashboardPerm && dashboard.isPending ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : hasAnyDashboardPerm && d ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {canOperate || canViewReports ? (
            <KpiCard
              label="Cobros del día"
              value={formatMXN(d.kpis.revenue_today)}
              icon={ReceiptText}
              to="/caja"
              hint={<Trend delta={revenueDelta} />}
            />
          ) : null}
          {canOperate || canCreateCharges ? (
            <KpiCard
              label="Saldos pendientes"
              value={formatMXN(d.kpis.pending_balance_total)}
              icon={HandCoins}
              to="/caja/saldos"
              hint={
                <span className="text-muted-foreground">
                  en{' '}
                  <span className="font-medium text-foreground tabular-nums">
                    {d.kpis.pending_balance_count}
                  </span>{' '}
                  {d.kpis.pending_balance_count === 1 ? 'cobro' : 'cobros'}
                </span>
              }
            />
          ) : null}
          {canManageAppointments ? (
            <KpiCard
              label="Citas de hoy"
              value={d.kpis.appointments_today_count}
              icon={CalendarDays}
              to="/agenda"
              hint={
                <span className="text-muted-foreground">
                  {d.upcoming_appointments.length > 0
                    ? `Próxima ${formatTime(d.upcoming_appointments[0]?.starts_at ?? null)}`
                    : 'No quedan próximas'}
                </span>
              }
            />
          ) : null}
          {canManageRecalls ? (
            <KpiCard
              label="Recalls vencidos"
              value={d.kpis.recalls_overdue_count}
              icon={AlertTriangle}
              to="/recalls"
              hint={
                <span className="text-muted-foreground">
                  <span className="font-medium text-foreground tabular-nums">
                    {d.kpis.recalls_this_week_count}
                  </span>{' '}
                  esta semana
                </span>
              }
            />
          ) : null}
        </div>
      ) : null}

      {/* Acciones rápidas — solo las que el usuario puede ejecutar */}
      {hasAnyDashboardPerm ? (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Acciones rápidas
              </h2>
              <p className="text-xs text-muted-foreground">
                Lo que más usas, a un clic
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {canCreateCharges ? (
                <QuickAction to="/caja/nuevo" label="Nuevo cobro" icon={Plus} />
              ) : null}
              {canManageAppointments ? (
                <QuickAction to="/agenda" label="Agendar cita" icon={CalendarDays} />
              ) : null}
              {canManage ? (
                <QuickAction to="/pacientes" label="Nuevo paciente" icon={Users} />
              ) : null}
              {canOperate || canCreateCharges ? (
                <QuickAction
                  to="/caja/saldos"
                  label="Saldos por cobrar"
                  icon={HandCoins}
                />
              ) : null}
              {canManageRecalls ? (
                <QuickAction to="/recalls" label="Recalls" icon={BellRing} />
              ) : null}
              {me?.permissions.includes('labs.manage') ? (
                <QuickAction
                  to="/laboratorios"
                  label="Laboratorios"
                  icon={Microscope}
                />
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Grid principal: gráfica + caja del día */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Ingresos últimos 14 días */}
        <Card className="lg:col-span-2">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Ingresos últimos 14 días
                </h2>
                <p className="text-xs text-muted-foreground">
                  Cobros confirmados por día
                </p>
              </div>
              {d ? (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total periodo</p>
                  <p className="text-lg font-semibold tabular-nums">
                    {formatMXN(
                      d.revenue_series.reduce((s, p) => s + p.total, 0),
                    )}
                  </p>
                </div>
              ) : null}
            </div>
            {dashboard.isPending ? (
              <Skeleton className="h-56 w-full" />
            ) : d ? (
              <div className="h-56 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={d.revenue_series}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="var(--border)"
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDayShort}
                      tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => formatMXN(Number(v))}
                      tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                      tickLine={false}
                      axisLine={false}
                      width={70}
                    />
                    <Tooltip
                      formatter={(v) => formatMXN(Number(v))}
                      labelFormatter={(l) =>
                        new Date(String(l) + 'T00:00:00').toLocaleDateString(
                          'es-MX',
                          {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          },
                        )
                      }
                      cursor={{ fill: 'var(--accent)', opacity: 0.5 }}
                      contentStyle={{
                        backgroundColor: 'var(--popover)',
                        color: 'var(--popover-foreground)',
                        border: '1px solid var(--border)',
                        borderRadius: '0.5rem',
                        fontSize: '12px',
                      }}
                    />
                    <Bar
                      dataKey="total"
                      fill="var(--primary)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Caja del día */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Caja de hoy
              </h2>
              <Link
                to="/caja"
                className="text-xs text-primary hover:underline"
              >
                Ver detalle
              </Link>
            </div>

            {dashboard.isPending ? (
              <Skeleton className="h-40 w-full" />
            ) : d?.cash_session ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Fondo apertura</span>
                  <span className="tabular-nums">
                    {formatMXN(d.cash_session.opening_amount)}
                  </span>
                </div>
                <div className="space-y-2 rounded-md bg-muted/40 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Cobros del turno
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Banknote className="size-3" /> Efectivo
                      </p>
                      <p className="tabular-nums font-medium">
                        {formatMXN(
                          d.cash_session.payments_by_method?.cash ?? 0,
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <CreditCard className="size-3" /> Tarjeta
                      </p>
                      <p className="tabular-nums font-medium">
                        {formatMXN(
                          d.cash_session.payments_by_method?.card ?? 0,
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Transf.</p>
                      <p className="tabular-nums font-medium">
                        {formatMXN(
                          d.cash_session.payments_by_method?.transfer ?? 0,
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                {d.cash_session.expenses_total > 0 ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <TrendingDown className="size-3" /> Egresos
                    </span>
                    <span className="tabular-nums text-destructive">
                      −{formatMXN(d.cash_session.expenses_total)}
                    </span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between font-semibold border-t pt-2">
                  <span>Neto</span>
                  <span className="tabular-nums">
                    {formatMXN(
                      d.cash_session.payments_total -
                        d.cash_session.expenses_total,
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="mx-auto grid size-10 place-items-center rounded-full bg-muted mb-2">
                  <Lock className="size-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  No tienes caja abierta
                </p>
                {canOperate ? (
                  <Button size="sm" asChild>
                    <Link to="/caja">Abrir caja</Link>
                  </Button>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Listas: próximas citas + recalls urgentes */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Próximas citas de hoy
                </h2>
                <p className="text-xs text-muted-foreground">
                  {d?.upcoming_appointments.length ?? 0}{' '}
                  {d?.upcoming_appointments.length === 1
                    ? 'cita'
                    : 'citas'}{' '}
                  por delante
                </p>
              </div>
              <Link
                to="/agenda"
                className="text-xs text-primary hover:underline"
              >
                Ver agenda
              </Link>
            </div>
            {dashboard.isPending ? (
              <Skeleton className="h-40 w-full" />
            ) : d?.upcoming_appointments.length === 0 ? (
              <div className="text-center py-6">
                <div className="mx-auto grid size-10 place-items-center rounded-full bg-muted mb-2">
                  <CalendarDays className="size-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No quedan citas por delante hoy.
                </p>
              </div>
            ) : (
              <ul className="divide-y">
                {d?.upcoming_appointments.map((a) => (
                  <li key={a.id} className="py-2.5 flex items-center gap-3">
                    <div className="text-center w-14 shrink-0">
                      <p className="text-xs font-mono text-foreground tabular-nums">
                        {formatTime(a.starts_at)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatTime(a.ends_at)}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {a.patient_id ? (
                          <Link
                            to={`/pacientes/${a.patient_id}`}
                            className="hover:underline"
                          >
                            {a.patient_name ?? '—'}
                          </Link>
                        ) : (
                          a.patient_name ?? '—'
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {a.treatment_name ?? 'Consulta'}
                        {a.specialist_name ? ` · ${a.specialist_name}` : ''}
                      </p>
                    </div>
                    <span
                      className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"
                      title={STATUS_LABEL[a.status] ?? a.status}
                    >
                      <span
                        className={cn(
                          'inline-block size-2 rounded-full',
                          STATUS_DOT[a.status] ?? 'bg-muted',
                        )}
                      />
                      {STATUS_LABEL[a.status] ?? a.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Recalls urgentes
                </h2>
                <p className="text-xs text-muted-foreground">
                  Vencidos y por vencer esta semana
                </p>
              </div>
              <Link
                to="/recalls"
                className="text-xs text-primary hover:underline"
              >
                Ver todos
              </Link>
            </div>
            {dashboard.isPending ? (
              <Skeleton className="h-40 w-full" />
            ) : d?.urgent_recalls.length === 0 ? (
              <div className="text-center py-6">
                <div className="mx-auto grid size-10 place-items-center rounded-full bg-muted mb-2">
                  <Sparkles className="size-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No hay recalls urgentes. ¡Bien!
                </p>
              </div>
            ) : (
              <ul className="divide-y">
                {d?.urgent_recalls.map((r) => {
                  const overdue = (r.days_until_due ?? 0) < 0
                  return (
                    <li key={r.id} className="py-2.5 flex items-center gap-3">
                      <span
                        className={cn(
                          'grid size-8 shrink-0 place-items-center rounded-full',
                          overdue
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700',
                        )}
                      >
                        {overdue ? (
                          <AlertTriangle className="size-4" />
                        ) : (
                          <BellRing className="size-4" />
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          <Link
                            to={`/pacientes/${r.patient_id}`}
                            className="hover:underline"
                          >
                            {r.patient_name ?? '—'}
                          </Link>
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {r.recall_label ?? r.treatment_name ?? '—'}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'text-[11px] font-medium tabular-nums whitespace-nowrap',
                          overdue
                            ? 'text-rose-600'
                            : 'text-amber-600',
                        )}
                      >
                        {overdue
                          ? `Hace ${Math.abs(r.days_until_due ?? 0)}d`
                          : `En ${r.days_until_due ?? 0}d`}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Saldos pendientes (caja/reportes) + Labs vencidos (labs) */}
      {(canOperate || canViewReports || me?.permissions.includes('labs.manage')) && d ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {canOperate ? (
            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">
                      Top pacientes con saldo
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Los 5 con mayor saldo por cobrar
                    </p>
                  </div>
                  <Link
                    to="/caja/saldos"
                    className="text-xs text-primary hover:underline"
                  >
                    Ver saldos
                  </Link>
                </div>
                {d.top_pending_balances.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="mx-auto grid size-10 place-items-center rounded-full bg-muted mb-2">
                      <HandCoins className="size-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Sin saldos pendientes. ¡Caja al día!
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y">
                    {d.top_pending_balances.map((p) => (
                      <li
                        key={p.patient_id}
                        className="py-2.5 flex items-center gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            <Link
                              to={`/pacientes/${p.patient_id}`}
                              className="hover:underline"
                            >
                              {p.patient_name ?? '—'}
                            </Link>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {p.charges_count}{' '}
                            {p.charges_count === 1 ? 'cobro' : 'cobros'}
                          </p>
                        </div>
                        <span className="text-sm font-semibold tabular-nums text-rose-600">
                          {formatMXN(p.total_balance)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Resumen general
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Estado de la clínica
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Pacientes activos
                  </p>
                  <p className="text-xl font-semibold tabular-nums">
                    {d.kpis.patients_total}
                  </p>
                  <Link
                    to="/pacientes"
                    className="text-[11px] text-primary hover:underline"
                  >
                    Ver pacientes →
                  </Link>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Pagos del día — efectivo
                  </p>
                  <p className="text-xl font-semibold tabular-nums">
                    {formatMXN(d.payments_by_method_today.cash)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Tarjeta {formatMXN(d.payments_by_method_today.card)} ·
                    Transf {formatMXN(d.payments_by_method_today.transfer)}
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Labs atrasados
                  </p>
                  <p
                    className={cn(
                      'text-xl font-semibold tabular-nums',
                      d.kpis.lab_orders_overdue_count > 0
                        ? 'text-rose-600'
                        : '',
                    )}
                  >
                    {d.kpis.lab_orders_overdue_count}
                  </p>
                  <Link
                    to="/laboratorios"
                    className="text-[11px] text-primary hover:underline"
                  >
                    Ver órdenes →
                  </Link>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Recalls esta semana
                  </p>
                  <p className="text-xl font-semibold tabular-nums">
                    {d.kpis.recalls_this_week_count}
                  </p>
                  <Link
                    to="/recalls"
                    className="text-[11px] text-primary hover:underline"
                  >
                    Ver cola →
                  </Link>
                </div>
              </div>
              {isAdmin ? (
                <div className="pt-2 border-t">
                  <Link
                    to="/reportes"
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <Phone className="size-3" /> Más detalle en Reportes
                  </Link>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
