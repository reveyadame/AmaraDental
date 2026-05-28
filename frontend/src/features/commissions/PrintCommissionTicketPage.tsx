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
  transfer: 'Transfer.',
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

/**
 * Ticket del pago de comisiones en formato impresora térmica (58mm o 80mm).
 * Reaprovecha la configuración de ticket del tenant (ancho, logo, pie). El
 * recibo en hoja carta vive en `PrintCommissionPaymentPage`.
 */
export function PrintCommissionTicketPage() {
  const params = useParams<{ id: string }>()
  const id = params.id ? Number(params.id) : undefined
  const payment = useCommissionPayment(id)
  const { branding } = useBranding()

  const width = branding?.ticket_width ?? '80mm'
  const showLogo = branding?.ticket_show_logo ?? true
  const showAddress = branding?.ticket_show_address ?? true
  const footer = branding?.ticket_footer_message ?? ''

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
  const items = p.items ?? []
  const widthPx = width === '58mm' ? 220 : 300

  return (
    <main
      className="min-h-screen bg-white text-black p-3"
      style={{ fontFamily: '"Courier New", ui-monospace, monospace' }}
    >
      <div
        className="mx-auto"
        style={{ width: widthPx, fontSize: '11px', lineHeight: 1.35 }}
      >
        {/* Encabezado */}
        <div className="text-center space-y-1 mb-2">
          {showLogo && branding?.logo_url ? (
            <img
              src={branding.logo_url}
              alt=""
              className="mx-auto"
              style={{ maxHeight: 48, width: 'auto' }}
            />
          ) : null}
          <p className="font-bold text-[13px]">
            {branding?.brand_name ?? 'CIO Dent'}
          </p>
          {showAddress && branding?.address ? (
            <p className="text-[10px]">{branding.address}</p>
          ) : null}
          {showAddress && branding?.phones && branding.phones.length > 0 ? (
            <p className="text-[10px]">Tel. {branding.phones.join(' · ')}</p>
          ) : null}
          {branding?.rfc ? <p className="text-[10px]">RFC {branding.rfc}</p> : null}
        </div>

        <div className="border-t border-dashed border-black my-1" />

        <p className="text-center font-semibold tracking-wide">
          PAGO DE COMISIONES
        </p>
        <p className="text-center text-[10px]">
          PC-{String(p.id).padStart(6, '0')} · {formatDateTime(p.paid_at)}
        </p>

        <div className="border-t border-dashed border-black my-1" />

        {/* Especialista */}
        <div className="mb-1">
          <p>
            <span className="font-semibold">Especialista:</span>{' '}
            {p.specialist_name ?? '—'}
          </p>
          {p.created_by_name ? (
            <p className="text-[10px]">Pagó: {p.created_by_name}</p>
          ) : null}
          <p className="text-[10px]">
            Método: {METHOD_LABEL[p.method] ?? p.method}
            {p.reference ? ` · Ref. ${p.reference}` : ''}
          </p>
        </div>

        {/* Comisiones incluidas */}
        {items.length > 0 ? (
          <>
            <div className="border-t border-dashed border-black my-1" />
            <table className="w-full" style={{ fontSize: '10px' }}>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id}>
                    <td className="align-top pr-1">
                      <p className="leading-tight">{it.treatment_name}</p>
                      <p className="text-[9px] opacity-80">
                        {it.patient_name ?? '—'}
                        {it.charge_code ? ` · ${it.charge_code}` : ''}
                      </p>
                    </td>
                    <td className="align-top text-right tabular-nums whitespace-nowrap">
                      {formatMXN(it.commission_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : null}

        <div className="border-t border-dashed border-black my-1" />

        {/* Total */}
        <div className="flex justify-between font-bold text-[12px] border-t border-black mt-1 pt-1">
          <span>TOTAL PAGADO</span>
          <span className="tabular-nums">{formatMXN(p.amount)}</span>
        </div>

        {p.notes ? (
          <>
            <div className="border-t border-dashed border-black my-1" />
            <p className="text-[10px] whitespace-pre-wrap">
              <span className="font-semibold">Notas:</span> {p.notes}
            </p>
          </>
        ) : null}

        {/* Firma de recibido */}
        <div className="mt-8 text-center">
          <div className="border-t border-black mx-6 pt-1" />
          <p className="text-[10px]">Recibí conforme</p>
          <p className="text-[10px] opacity-80">{p.specialist_name ?? '—'}</p>
        </div>

        {/* Pie configurable */}
        {footer ? (
          <>
            <div className="border-t border-dashed border-black my-2" />
            <div className="text-center text-[10px] whitespace-pre-wrap">
              {footer}
            </div>
          </>
        ) : null}

        <div className="text-center text-[9px] opacity-70 mt-3">
          PC-{String(p.id).padStart(6, '0')}
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: ${width} auto; margin: 4mm; }
          body { background: white; margin: 0; }
        }
        @media screen {
          body { background: #f5f5f5; }
        }
      `}</style>
    </main>
  )
}
