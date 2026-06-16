import type { Invoice } from './api'
import { InvoicesList } from './InvoicesList'

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })

/**
 * Renovación + historial de facturas INLINE. Usado por el panel de super-admin
 * (detalle de clínica), donde sí queremos los registros a la vista.
 */
export function BillingDetailsView({
  renewsAt,
  invoices,
}: {
  renewsAt: string | null
  invoices: Invoice[]
}) {
  if (!renewsAt && invoices.length === 0) return null

  return (
    <div className="space-y-3">
      {renewsAt ? (
        <p className="text-sm text-muted-foreground">
          Renueva el <span className="font-medium text-foreground">{fmtDate(renewsAt)}</span>.
        </p>
      ) : null}

      {invoices.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Facturas
          </p>
          <InvoicesList invoices={invoices} />
        </div>
      ) : null}
    </div>
  )
}
