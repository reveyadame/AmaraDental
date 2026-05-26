import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useCommissionPayment } from './hooks'
import { useBranding } from '@/shared/theme/ThemeProvider'
import { formatMXN } from '@/shared/lib/utils'
import type { PaymentMethod } from '@/shared/types/cash'

const METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-MX', {
    dateStyle: 'long',
    timeStyle: 'short',
  })
}

/**
 * Hoja imprimible del recibo de pago de comisiones. Tamaño carta, auto-print.
 */
export function PrintCommissionPaymentPage() {
  const params = useParams<{ id: string }>()
  const id = params.id ? Number(params.id) : undefined
  const payment = useCommissionPayment(id)
  const { branding } = useBranding()

  const ready = !!payment.data && !payment.isPending

  useEffect(() => {
    if (!ready) return
    const t = window.setTimeout(() => window.print(), 350)
    return () => window.clearTimeout(t)
  }, [ready])

  if (!id || Number.isNaN(id)) return <Navigate to="/comisiones" replace />

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center bg-white">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const p = payment.data!
  const now = new Date().toLocaleString('es-MX', {
    dateStyle: 'long',
    timeStyle: 'short',
  })

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
              {branding?.razon_social ? (
                <p className="text-xs text-gray-600">{branding.razon_social}</p>
              ) : null}
              {branding?.address ? (
                <p className="text-xs text-gray-600">{branding.address}</p>
              ) : null}
              <p className="text-xs text-gray-600">
                {branding?.phones && branding.phones.length > 0
                  ? `Tel: ${branding.phones.join(' · ')}`
                  : ''}
                {branding?.rfc ? ` · RFC: ${branding.rfc}` : ''}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold uppercase tracking-wide">
              Recibo de pago de comisiones
            </p>
            <p className="text-xs text-gray-600 font-mono">
              PC-{String(p.id).padStart(6, '0')}
            </p>
            <p className="text-xs text-gray-600">{formatDateTime(p.paid_at)}</p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-500">
              Especialista
            </p>
            <p className="font-semibold">{p.specialist_name ?? '—'}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wide text-gray-500">
              Monto pagado
            </p>
            <p className="text-2xl font-bold tabular-nums">{formatMXN(p.amount)}</p>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-4 text-sm border-y py-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-500">Método</p>
            <p>{METHOD_LABEL[p.method] ?? p.method}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-500">
              Referencia
            </p>
            <p className="font-mono text-xs">{p.reference ?? '—'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-500">
              Registrado por
            </p>
            <p>{p.created_by_name ?? '—'}</p>
          </div>
        </section>

        {p.items && p.items.length > 0 ? (
          <section>
            <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-2">
              Comisiones incluidas ({p.items.length}{' '}
              {p.items.length === 1 ? 'item' : 'items'})
            </p>
            <table className="w-full text-xs border">
              <thead className="bg-gray-50">
                <tr className="border-b">
                  <th className="text-left px-3 py-2 font-medium">Cobro</th>
                  <th className="text-left px-3 py-2 font-medium">Paciente</th>
                  <th className="text-left px-3 py-2 font-medium">Tratamiento</th>
                  <th className="text-right px-3 py-2 font-medium whitespace-nowrap">
                    Base
                  </th>
                  <th className="text-right px-3 py-2 font-medium">Comisión</th>
                </tr>
              </thead>
              <tbody>
                {p.items.map((it) => (
                  <tr key={it.id} className="border-b last:border-b-0">
                    <td className="px-3 py-1.5 font-mono">
                      {it.charge_code ?? `CHG-${it.charge_id}`}
                    </td>
                    <td className="px-3 py-1.5">{it.patient_name ?? '—'}</td>
                    <td className="px-3 py-1.5">{it.treatment_name}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">
                      {formatMXN(it.line_total)}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums font-medium">
                      {formatMXN(it.commission_amount)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-semibold">
                  <td colSpan={4} className="px-3 py-2 text-right">
                    Total pagado
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatMXN(p.amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
        ) : null}

        {p.notes ? (
          <section>
            <p className="text-[10px] uppercase tracking-wide text-gray-500">Notas</p>
            <p className="text-sm whitespace-pre-wrap">{p.notes}</p>
          </section>
        ) : null}

        <section className="pt-16 grid grid-cols-2 gap-12">
          <div className="text-center">
            <div className="border-t-2 border-black pt-2 mx-4 min-h-[60px]" />
            <p className="text-xs font-medium">Recibí conforme</p>
            <p className="text-[11px] text-gray-700 mt-0.5">
              {p.specialist_name ?? '—'}
            </p>
          </div>
          <div className="text-center">
            <div className="border-t-2 border-black pt-2 mx-4 min-h-[60px]" />
            <p className="text-xs font-medium">Pagado por</p>
            <p className="text-[11px] text-gray-700 mt-0.5">
              {p.created_by_name ?? '—'}
            </p>
          </div>
        </section>

        <footer className="text-[10px] text-gray-500 border-t pt-3 mt-8 flex justify-between">
          <span>Impreso: {now}</span>
          <span>{branding?.brand_name ?? 'CIO Dent'}</span>
        </footer>
      </div>

      <style>{`
        @media print {
          body { background: white; }
          @page { margin: 1.5cm; size: letter; }
        }
      `}</style>
    </main>
  )
}
