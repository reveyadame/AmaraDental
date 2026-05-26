import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useCashSession } from './hooks'
import { useBranding } from '@/shared/theme/ThemeProvider'
import { cn, formatMXN } from '@/shared/lib/utils'
import {
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategory,
  type PaymentMethod,
} from '@/shared/types/cash'

function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
}

const METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
}

/**
 * Hoja imprimible del corte de caja. A4, auto-print al cargar.
 */
export function PrintCashSessionPage() {
  const params = useParams<{ id: string }>()
  const id = params.id ? Number(params.id) : undefined
  const session = useCashSession(id)
  const { branding } = useBranding()

  const ready = !!session.data && !session.isPending

  useEffect(() => {
    if (!ready) return
    const t = window.setTimeout(() => window.print(), 350)
    return () => window.clearTimeout(t)
  }, [ready])

  if (!id || Number.isNaN(id)) return <Navigate to="/caja" replace />

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center bg-white">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const s = session.data!
  const totalCobrado = s.payments_summary?.total ?? 0
  const cashCollected = s.payments_summary?.by_method?.cash ?? 0
  const cardCollected = s.payments_summary?.by_method?.card ?? s.card_expected ?? 0
  const transferCollected =
    s.payments_summary?.by_method?.transfer ?? s.transfer_expected ?? 0
  const now = new Date().toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })

  return (
    <main className="bg-white text-black min-h-screen p-6 sm:p-10 print:p-0">
      <div className="mx-auto max-w-3xl space-y-5">
        <header className="flex items-start justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            {branding?.logo_url ? (
              <img src={branding.logo_url} alt="" className="h-12 w-auto" />
            ) : (
              <div className="grid size-12 place-items-center rounded-md bg-black text-white text-sm font-bold">
                {(branding?.brand_name ?? 'CD').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-xl font-semibold leading-tight">
                {branding?.brand_name ?? 'CIO Dent'}
              </p>
              {branding?.address ? (
                <p className="text-xs text-gray-600">{branding.address}</p>
              ) : null}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold uppercase tracking-wide">Corte de caja</p>
            <p className="text-xs text-gray-600 font-mono">#{s.id}</p>
            <p className="text-xs text-gray-600">{now}</p>
          </div>
        </header>

        <section className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-500">Usuario</p>
            <p className="font-medium">{s.user_name ?? '—'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-500">Apertura</p>
            <p>{formatDateTime(s.opened_at)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-500">Cierre</p>
            <p>{formatDateTime(s.closed_at)}</p>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 text-sm border rounded p-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-500">
              Fondo de apertura
            </p>
            <p className="tabular-nums">{formatMXN(s.opening_amount)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-500">Total cobrado</p>
            <p className="tabular-nums">{formatMXN(totalCobrado)}</p>
          </div>
        </section>

        <section>
          <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-2">
            Conciliación por método
          </p>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1 px-2">Método</th>
                <th className="text-right py-1 px-2">Esperado</th>
                <th className="text-right py-1 px-2">Contado / confirmado</th>
                <th className="text-right py-1 px-2">Diferencia</th>
              </tr>
            </thead>
            <tbody>
              <MethodRow
                label="Efectivo"
                expected={s.expected_cash ?? s.opening_amount + cashCollected}
                counted={s.closing_amount}
                difference={s.difference}
              />
              <MethodRow
                label="Tarjeta"
                expected={s.card_expected ?? cardCollected}
                counted={s.card_counted}
                difference={s.card_difference}
              />
              <MethodRow
                label="Transferencia"
                expected={s.transfer_expected ?? transferCollected}
                counted={s.transfer_counted}
                difference={s.transfer_difference}
              />
            </tbody>
          </table>
        </section>

        {s.close_notes ? (
          <section className="border-t pt-3">
            <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">
              Notas de cierre
            </p>
            <p className="text-sm whitespace-pre-wrap">{s.close_notes}</p>
          </section>
        ) : null}

        <section>
          <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-2">
            Pagos del turno{s.payments ? ` (${s.payments.length})` : ''}
          </p>
          {s.payments && s.payments.length > 0 ? (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1 px-2">Hora</th>
                  <th className="text-left py-1 px-2">Método</th>
                  <th className="text-right py-1 px-2">Monto</th>
                  <th className="text-left py-1 px-2">Referencia</th>
                </tr>
              </thead>
              <tbody>
                {s.payments.map((p) => (
                  <tr key={p.id} className="border-b">
                    <td className="py-1 px-2">
                      {p.paid_at
                        ? new Date(p.paid_at).toLocaleTimeString('es-MX', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="py-1 px-2">{METHOD_LABEL[p.method]}</td>
                    <td className="py-1 px-2 text-right tabular-nums">
                      {formatMXN(p.amount)}
                    </td>
                    <td className="py-1 px-2">{p.reference ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-600 italic">Sin pagos registrados.</p>
          )}
        </section>

        {s.expenses && s.expenses.length > 0 ? (
          <section>
            <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-2">
              Egresos del turno ({s.expenses.length}) — total −
              {formatMXN(s.expenses_summary?.total ?? 0)}
            </p>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1 px-2">Hora</th>
                  <th className="text-left py-1 px-2">Categoría</th>
                  <th className="text-left py-1 px-2">Descripción</th>
                  <th className="text-left py-1 px-2">Método</th>
                  <th className="text-right py-1 px-2">Monto</th>
                </tr>
              </thead>
              <tbody>
                {s.expenses.map((e) => (
                  <tr key={e.id} className="border-b">
                    <td className="py-1 px-2">
                      {e.paid_at
                        ? new Date(e.paid_at).toLocaleTimeString('es-MX', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="py-1 px-2">
                      {EXPENSE_CATEGORY_LABELS[
                        e.category as ExpenseCategory
                      ] ?? e.category}
                    </td>
                    <td className="py-1 px-2">{e.description}</td>
                    <td className="py-1 px-2">{METHOD_LABEL[e.method]}</td>
                    <td className="py-1 px-2 text-right tabular-nums">
                      −{formatMXN(e.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        <section className="pt-10 grid grid-cols-2 gap-12">
          <div className="text-center">
            <div className="border-t-2 border-black pt-2 mx-4 min-h-[60px]" />
            <p className="text-xs font-medium">Firma — Cajero</p>
            <p className="text-[10px] text-gray-700">{s.user_name ?? '—'}</p>
          </div>
          <div className="text-center">
            <div className="border-t-2 border-black pt-2 mx-4 min-h-[60px]" />
            <p className="text-xs font-medium">Firma — Recibe</p>
            <p className="text-[10px] text-gray-500">(quien recibe el efectivo)</p>
          </div>
        </section>

        <footer className="text-[10px] text-gray-500 border-t pt-3 mt-6">
          Corte generado por {branding?.brand_name ?? 'CIO Dent'} el {now}.
        </footer>
      </div>

      <style>{`
        @media print {
          body { background: white; }
          @page { margin: 1.5cm; size: A4; }
        }
      `}</style>
    </main>
  )
}

function MethodRow({
  label,
  expected,
  counted,
  difference,
}: {
  label: string
  expected: number | null
  counted: number | null
  difference: number | null
}) {
  const has = counted !== null && difference !== null
  return (
    <tr className="border-b align-top">
      <td className="py-1.5 px-2">{label}</td>
      <td className="py-1.5 px-2 text-right tabular-nums">{formatMXN(expected ?? 0)}</td>
      <td className="py-1.5 px-2 text-right tabular-nums">
        {has ? formatMXN(counted ?? 0) : '—'}
      </td>
      <td
        className={cn(
          'py-1.5 px-2 text-right tabular-nums font-medium',
          !has
            ? 'text-gray-500'
            : (difference ?? 0) === 0
              ? ''
              : (difference ?? 0) > 0
                ? 'text-emerald-700'
                : 'text-red-700',
        )}
      >
        {has ? `${(difference ?? 0) >= 0 ? '+' : ''}${formatMXN(difference ?? 0)}` : '—'}
      </td>
    </tr>
  )
}
