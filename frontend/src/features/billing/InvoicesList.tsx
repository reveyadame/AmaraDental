import { ExternalLink } from 'lucide-react'
import type { Invoice } from './api'

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })

const STATUS_LABEL: Record<string, string> = {
  paid: 'Pagada',
  open: 'Pendiente',
  void: 'Anulada',
  uncollectible: 'Incobrable',
}

export function InvoicesList({ invoices }: { invoices: Invoice[] }) {
  if (invoices.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin pagos todavía.</p>
  }

  return (
    <ul className="divide-y rounded-md border text-sm">
      {invoices.map((inv, i) => (
        <li key={i} className="flex items-center justify-between gap-3 px-3 py-2">
          <span className="text-muted-foreground">{fmtDate(inv.date)}</span>
          <span className="font-medium">{inv.total}</span>
          <span className="text-xs text-muted-foreground">
            {STATUS_LABEL[inv.status] ?? inv.status}
          </span>
          {inv.url ? (
            <a
              href={inv.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <ExternalLink className="size-3.5" /> Ver
            </a>
          ) : (
            <span className="w-10" />
          )}
        </li>
      ))}
    </ul>
  )
}
