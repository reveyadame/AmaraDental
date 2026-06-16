import { Receipt } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { InvoicesList } from './InvoicesList'
import type { Invoice } from './api'

/** Botón "Ver pagos" que abre el historial de facturas en un modal. */
export function PaymentsDialog({ invoices }: { invoices: Invoice[] }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Receipt className="size-4" /> Ver pagos
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Historial de pagos</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          <InvoicesList invoices={invoices} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
