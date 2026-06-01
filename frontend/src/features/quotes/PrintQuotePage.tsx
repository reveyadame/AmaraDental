import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useQuote } from './hooks'
import { usePatient } from '@/features/patients/hooks'
import { useBranding } from '@/shared/theme/ThemeProvider'
import { formatMXN } from '@/shared/lib/utils'
import { QUOTE_STATUS_BADGE } from '@/shared/types/quote'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Cotización imprimible en tamaño carta. Auto-imprime al cargar.
 */
export function PrintQuotePage() {
  const params = useParams<{ id: string }>()
  const id = params.id ? Number(params.id) : undefined
  const quote = useQuote(id)
  const patient = usePatient(quote.data?.patient_id)
  const { branding } = useBranding()

  const ready = !!quote.data && !!patient.data && !quote.isPending && !patient.isPending

  useEffect(() => {
    if (!ready) return
    const t = window.setTimeout(() => window.print(), 350)
    return () => window.clearTimeout(t)
  }, [ready])

  if (!id || Number.isNaN(id)) return <Navigate to="/cotizaciones" replace />

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center bg-white">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const q = quote.data!
  const p = patient.data!
  const badge = QUOTE_STATUS_BADGE[q.status]
  const now = new Date().toLocaleString('es-MX', {
    dateStyle: 'long',
    timeStyle: 'short',
  })

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
            <p className="text-sm font-semibold uppercase tracking-wide">Cotización</p>
            <p className="text-xs text-gray-600">{q.code ?? `#${q.id}`}</p>
            <p className="text-xs text-gray-600">{now}</p>
          </div>
        </header>

        <section className="grid grid-cols-3 gap-4 text-sm border-b pb-3">
          <div className="col-span-3 sm:col-span-2">
            <p className="text-[10px] uppercase tracking-wide text-gray-500">Paciente</p>
            <p className="font-medium">{p.full_name}</p>
            {p.email ? <p className="text-xs text-gray-600">{p.email}</p> : null}
            {p.mobile_phone || p.phone ? (
              <p className="text-xs text-gray-600">{p.mobile_phone ?? p.phone}</p>
            ) : null}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-500">Estado</p>
            <p className="font-medium">{badge.label}</p>
            {q.valid_until ? (
              <>
                <p className="text-[10px] uppercase tracking-wide text-gray-500 mt-2">
                  Vigencia
                </p>
                <p className="text-sm">{formatDate(q.valid_until)}</p>
              </>
            ) : null}
          </div>
        </section>

        <section>
          <table className="w-full text-sm">
            <thead className="border-b text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="text-left py-2 font-medium">Tratamiento</th>
                <th className="text-left py-2 font-medium">Especialista</th>
                <th className="text-right py-2 font-medium">Cant.</th>
                <th className="text-right py-2 font-medium">Precio</th>
                <th className="text-right py-2 font-medium">Desc.</th>
                <th className="text-right py-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {(q.items ?? []).map((it) => (
                <tr key={it.id} className="border-b border-gray-100">
                  <td className="py-2">
                    <p className="font-medium">{it.treatment_name}</p>
                    {it.treatment_code ? (
                      <p className="text-[10px] text-gray-500">{it.treatment_code}</p>
                    ) : null}
                  </td>
                  <td className="py-2 text-gray-600">{it.specialist_name ?? '—'}</td>
                  <td className="py-2 text-right tabular-nums">{it.quantity}</td>
                  <td className="py-2 text-right tabular-nums">
                    {formatMXN(it.unit_price)}
                  </td>
                  <td className="py-2 text-right tabular-nums text-gray-600">
                    {it.discount_amount > 0 ? `− ${formatMXN(it.discount_amount)}` : '—'}
                  </td>
                  <td className="py-2 text-right tabular-nums font-medium">
                    {formatMXN(it.line_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="flex justify-end">
          <div className="w-64 text-sm space-y-1">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatMXN(q.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Descuentos</span>
              <span className="tabular-nums">− {formatMXN(q.discount_total)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base border-t pt-2">
              <span>Total</span>
              <span className="tabular-nums">{formatMXN(q.total)}</span>
            </div>
          </div>
        </section>

        {q.notes ? (
          <section className="border-t pt-4 text-sm">
            <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">
              Notas
            </p>
            <p className="whitespace-pre-wrap">{q.notes}</p>
          </section>
        ) : null}

        <footer className="text-[10px] text-gray-500 border-t pt-3 space-y-1">
          <p>
            Esta cotización tiene fines informativos y no constituye comprobante
            fiscal. Sujeta a disponibilidad y vigencia indicada.
          </p>
          {q.valid_until ? (
            <p>Válida hasta el {formatDate(q.valid_until)}.</p>
          ) : null}
        </footer>
      </div>
    </main>
  )
}
