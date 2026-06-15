import { usePrintOnLoad } from '@/shared/lib/use-print-on-load'
import { DEFAULT_BRAND_NAME } from '@/shared/lib/brand'
import { Navigate, useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useCharge } from './hooks'
import { useBranding } from '@/shared/theme/ThemeProvider'
import { formatMXN } from '@/shared/lib/utils'
import type { PaymentMethod } from '@/shared/types/cash'

const METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  card: 'Tarj. déb.',
  card_credit: 'Tarj. créd.',
  transfer: 'Transfer.',
  credit: 'Saldo',
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

/**
 * Ticket de pago en formato impresora térmica (58mm o 80mm). Auto-imprime al
 * cargar; el ancho del papel y el contenido se controlan desde la
 * configuración del tenant.
 */
export function PrintChargeTicketPage() {
  const params = useParams<{ id: string }>()
  const id = params.id ? Number(params.id) : undefined
  const charge = useCharge(id)
  const { branding } = useBranding()

  const width = branding?.ticket_width ?? '80mm'
  const showLogo = branding?.ticket_show_logo ?? true
  const showAddress = branding?.ticket_show_address ?? true
  const showCedulas = branding?.ticket_show_cedulas ?? false
  const footer = branding?.ticket_footer_message ?? ''

  const ready = !!charge.data && !charge.isPending

  usePrintOnLoad(ready)

  if (!id || Number.isNaN(id)) return <Navigate to="/caja" replace />

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center bg-white">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const c = charge.data!
  const items = c.items ?? []
  const payments = c.payments ?? []
  // Tickets son de un pago — el último pago es el "nuevo". Pero también
  // podemos mostrar todos. Aquí mostramos el desglose completo para que
  // sirva como comprobante final.

  // Ancho del cuerpo del ticket: el @page define el papel, el body se ajusta.
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
            {branding?.brand_name ?? DEFAULT_BRAND_NAME}
          </p>
          {showAddress && branding?.address ? (
            <p className="text-[10px]">{branding.address}</p>
          ) : null}
          {showAddress && branding?.phones && branding.phones.length > 0 ? (
            <p className="text-[10px]">Tel. {branding.phones.join(' · ')}</p>
          ) : null}
          {branding?.rfc ? (
            <p className="text-[10px]">RFC {branding.rfc}</p>
          ) : null}
          {showCedulas && branding?.cedulas_clinica && branding.cedulas_clinica.length > 0 ? (
            <p className="text-[10px]">Céd. {branding.cedulas_clinica.join(', ')}</p>
          ) : null}
        </div>

        <div className="border-t border-dashed border-black my-1" />

        <p className="text-center font-semibold tracking-wide">COMPROBANTE</p>
        <p className="text-center text-[10px]">
          {c.code ?? `CHG-${c.id}`} · {formatDateTime(c.created_at)}
        </p>

        <div className="border-t border-dashed border-black my-1" />

        {/* Paciente */}
        <div className="mb-1">
          <p>
            <span className="font-semibold">Paciente:</span>{' '}
            {c.patient_name ?? '—'}
          </p>
          {c.created_by_name ? (
            <p className="text-[10px]">Atendió: {c.created_by_name}</p>
          ) : null}
        </div>

        <div className="border-t border-dashed border-black my-1" />

        {/* Items */}
        {items.length > 0 ? (
          <table className="w-full" style={{ fontSize: '10px' }}>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td className="align-top pr-1">
                    <p className="leading-tight">{it.treatment_name}</p>
                    {it.quantity > 1 ? (
                      <p className="text-[9px] opacity-80">
                        {it.quantity} × {formatMXN(it.unit_price)}
                      </p>
                    ) : null}
                    {it.specialist_name ? (
                      <p className="text-[9px] opacity-80">
                        {it.specialist_name}
                      </p>
                    ) : null}
                    {it.discount_amount > 0 ? (
                      <p className="text-[9px] opacity-80">
                        Descuento: −{formatMXN(it.discount_amount)}
                      </p>
                    ) : null}
                  </td>
                  <td className="align-top text-right tabular-nums whitespace-nowrap">
                    {formatMXN(it.line_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}

        <div className="border-t border-dashed border-black my-1" />

        {/* Totales */}
        <div className="space-y-0.5">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatMXN(c.subtotal)}</span>
          </div>
          {c.discount_total > 0 ? (
            <div className="flex justify-between">
              <span>Descuentos</span>
              <span className="tabular-nums">−{formatMXN(c.discount_total)}</span>
            </div>
          ) : null}
          <div className="flex justify-between font-bold text-[12px] border-t border-black mt-1 pt-1">
            <span>TOTAL</span>
            <span className="tabular-nums">{formatMXN(c.total)}</span>
          </div>
          <div className="flex justify-between">
            <span>Pagado</span>
            <span className="tabular-nums">{formatMXN(c.paid_total)}</span>
          </div>
          {c.balance > 0 ? (
            <div className="flex justify-between font-semibold">
              <span>Saldo pendiente</span>
              <span className="tabular-nums">{formatMXN(c.balance)}</span>
            </div>
          ) : null}
        </div>

        {/* Pagos */}
        {payments.length > 0 ? (
          <>
            <div className="border-t border-dashed border-black my-1" />
            <p className="text-[10px] font-semibold uppercase tracking-wide">
              Pagos
            </p>
            <table className="w-full" style={{ fontSize: '10px' }}>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="pr-1 whitespace-nowrap">{formatDate(p.paid_at)}</td>
                    <td className="pr-1">{METHOD_LABEL[p.method]}</td>
                    <td className="text-right tabular-nums">
                      {formatMXN(p.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {payments.some((p) => p.reference) ? (
              <div className="text-[9px] opacity-80 mt-1">
                {payments
                  .filter((p) => p.reference)
                  .map((p) => (
                    <p key={`ref-${p.id}`}>
                      Ref. {METHOD_LABEL[p.method]}: {p.reference}
                    </p>
                  ))}
              </div>
            ) : null}
          </>
        ) : null}

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
          {c.code ?? `CHG-${c.id}`}
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
