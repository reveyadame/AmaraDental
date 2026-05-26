import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { usePatient } from '@/features/patients/hooks'
import { usePatientAccount } from './hooks'
import { useBranding } from '@/shared/theme/ThemeProvider'
import { formatMXN } from '@/shared/lib/utils'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  partial: 'Parcial',
  paid: 'Pagado',
  cancelled: 'Cancelado',
}

/**
 * Estado de cuenta imprimible del paciente. A4, auto-print al cargar.
 */
export function PrintAccountStatementPage() {
  const params = useParams<{ id: string }>()
  const patientId = params.id ? Number(params.id) : undefined
  const patient = usePatient(patientId)
  const account = usePatientAccount(patientId)
  const { branding } = useBranding()

  const ready = !!patient.data && !!account.data && !patient.isPending && !account.isPending

  useEffect(() => {
    if (!ready) return
    const id = window.setTimeout(() => window.print(), 350)
    return () => window.clearTimeout(id)
  }, [ready])

  if (!patientId || Number.isNaN(patientId)) return <Navigate to="/pacientes" replace />

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center bg-white">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const p = patient.data!
  const a = account.data!
  const now = new Date().toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })

  return (
    <main className="bg-white text-black min-h-screen p-6 sm:p-10 print:p-0">
      <div className="mx-auto max-w-3xl space-y-6">
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
            <p className="text-sm font-semibold uppercase tracking-wide">Estado de cuenta</p>
            <p className="text-xs text-gray-600">{now}</p>
          </div>
        </header>

        <section className="grid grid-cols-3 gap-4 text-sm border-b pb-3">
          <div className="col-span-3 sm:col-span-2">
            <p className="text-[10px] uppercase tracking-wide text-gray-500">Paciente</p>
            <p className="font-medium">{p.full_name}</p>
            {p.curp ? <p className="text-xs text-gray-600 font-mono">CURP {p.curp}</p> : null}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-500">Edad · Sexo</p>
            <p>
              {p.age != null ? `${p.age} años` : '—'}
              {p.gender
                ? ` · ${p.gender === 'F' ? 'Femenino' : p.gender === 'M' ? 'Masculino' : 'Otro'}`
                : ''}
            </p>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-3 text-sm">
          <div className="rounded border p-3">
            <p className="text-[10px] uppercase tracking-wide text-gray-500">Facturado</p>
            <p className="font-semibold tabular-nums">{formatMXN(a.totals.invoiced)}</p>
            <p className="text-xs text-gray-600 mt-0.5">
              {a.totals.charges_count} cobros · {formatMXN(a.totals.discounts)} en descuentos
            </p>
          </div>
          <div className="rounded border p-3">
            <p className="text-[10px] uppercase tracking-wide text-gray-500">Pagado</p>
            <p className="font-semibold tabular-nums">{formatMXN(a.totals.paid)}</p>
          </div>
          <div
            className={
              'rounded border p-3 ' +
              (a.totals.balance > 0 ? 'border-amber-500 bg-amber-50' : '')
            }
          >
            <p className="text-[10px] uppercase tracking-wide text-gray-500">Saldo pendiente</p>
            <p
              className={
                'font-semibold tabular-nums text-lg ' +
                (a.totals.balance > 0 ? 'text-amber-800' : '')
              }
            >
              {formatMXN(a.totals.balance)}
            </p>
            {a.totals.pending_count > 0 ? (
              <p className="text-xs text-amber-800 mt-0.5">
                {a.totals.pending_count}{' '}
                {a.totals.pending_count === 1 ? 'cobro con saldo' : 'cobros con saldo'}
              </p>
            ) : null}
          </div>
        </section>

        <section>
          <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-2">
            Detalle de cobros
          </p>
          {a.charges.length === 0 ? (
            <p className="text-sm text-gray-600 italic">Sin cobros registrados.</p>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1 px-2">Fecha</th>
                  <th className="text-left py-1 px-2">Folio</th>
                  <th className="text-left py-1 px-2">Concepto</th>
                  <th className="text-right py-1 px-2">Total</th>
                  <th className="text-right py-1 px-2">Pagado</th>
                  <th className="text-right py-1 px-2">Saldo</th>
                  <th className="text-left py-1 px-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {a.charges.map((c) => (
                  <tr key={c.id} className="border-b align-top">
                    <td className="py-1 px-2 whitespace-nowrap">{formatDate(c.created_at)}</td>
                    <td className="py-1 px-2 font-mono">{c.code ?? `CHG-${c.id}`}</td>
                    <td className="py-1 px-2">
                      {c.items && c.items.length > 0
                        ? c.items
                            .map((it) => it.treatment_name + (it.quantity > 1 ? ` ×${it.quantity}` : ''))
                            .join(' · ')
                        : '—'}
                    </td>
                    <td className="py-1 px-2 text-right tabular-nums">{formatMXN(c.total)}</td>
                    <td className="py-1 px-2 text-right tabular-nums">{formatMXN(c.paid_total)}</td>
                    <td
                      className={
                        'py-1 px-2 text-right tabular-nums ' +
                        (c.balance > 0 && c.status !== 'cancelled' ? 'font-semibold' : '')
                      }
                    >
                      {c.balance > 0 ? formatMXN(c.balance) : '—'}
                    </td>
                    <td className="py-1 px-2">{STATUS_LABEL[c.status] ?? c.status}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-black font-semibold">
                  <td colSpan={3} className="py-1.5 px-2 text-right">
                    Totales
                  </td>
                  <td className="py-1.5 px-2 text-right tabular-nums">
                    {formatMXN(a.totals.invoiced)}
                  </td>
                  <td className="py-1.5 px-2 text-right tabular-nums">
                    {formatMXN(a.totals.paid)}
                  </td>
                  <td className="py-1.5 px-2 text-right tabular-nums">
                    {formatMXN(a.totals.balance)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          )}
        </section>

        <footer className="text-[10px] text-gray-500 border-t pt-3">
          Documento informativo emitido por {branding?.brand_name ?? 'CIO Dent'} el {now}.
          Este estado de cuenta no constituye comprobante fiscal.
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
