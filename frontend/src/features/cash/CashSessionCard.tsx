import { useState } from 'react'
import { Lock, LockOpen, Wallet } from 'lucide-react'
import { useCurrentCashSession } from './hooks'
import { OpenSessionDialog } from './OpenSessionDialog'
import { CloseSessionDialog } from './CloseSessionDialog'
import { useMe } from '@/features/auth/hooks'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Skeleton } from '@/shared/ui/skeleton'
import { Separator } from '@/shared/ui/separator'
import { formatMXN } from '@/shared/lib/utils'

function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

// La caja es global y puede durar abierta varios días (clínicas con corte
// semanal). Mostramos hace cuánto se abrió para que el corte no se asuma diario.
function formatOpenDuration(iso: string | null): string | null {
  if (!iso) return null
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 60) return 'hace menos de 1 h'
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  return `hace ${days} ${days === 1 ? 'día' : 'días'}`
}

export function CashSessionCard() {
  const { data: me } = useMe()
  const canOperate = me?.permissions.includes('cash.operate') ?? false
  const session = useCurrentCashSession()
  const [openDialog, setOpenDialog] = useState(false)
  const [closeDialog, setCloseDialog] = useState(false)

  if (session.isPending) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!session.data) {
    return (
      <>
        <Card className="border-dashed">
          <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid size-12 place-items-center rounded-full bg-muted">
                <Wallet className="size-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Caja cerrada</p>
                <p className="text-sm text-muted-foreground">
                  Abre tu sesión para empezar a registrar cobros.
                </p>
              </div>
            </div>
            {canOperate ? (
              <Button onClick={() => setOpenDialog(true)}>
                <LockOpen className="size-4" /> Abrir caja
              </Button>
            ) : null}
          </CardContent>
        </Card>
        <OpenSessionDialog open={openDialog} onOpenChange={setOpenDialog} />
      </>
    )
  }

  const s = session.data
  // Ingresos: dinero realmente recibido en pagos (efectivo + tarjetas +
  // transferencia). NO incluye saldo a favor usado ni resta egresos.
  const totalCobrado = s.payments_summary?.total ?? 0
  const cashTotal = s.payments_summary?.by_method?.cash ?? 0
  const cardTotal = s.payments_summary?.by_method?.card ?? 0
  const cardCreditTotal = s.payments_summary?.by_method?.card_credit ?? 0
  const transferTotal = s.payments_summary?.by_method?.transfer ?? 0
  const creditTotal = s.payments_summary?.by_method?.credit ?? 0
  const count = s.payments_summary?.count ?? 0

  // Egresos del periodo y efectivo físico esperado en el cajón.
  const egresos = s.expenses_summary?.total ?? 0
  const cashExpenses = s.expenses_summary?.by_method?.cash ?? 0
  const efectivoEnCaja = s.opening_amount + cashTotal - cashExpenses
  const openDuration = formatOpenDuration(s.opened_at)

  return (
    <>
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
                <Wallet className="size-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Caja abierta</p>
                <p className="text-xs text-muted-foreground">
                  Abierta por {s.opened_by_name ?? s.user_name ?? '—'} ·{' '}
                  {formatDateTime(s.opened_at)}
                  {openDuration ? ` · ${openDuration}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-100 text-emerald-900 border border-emerald-200 hover:bg-emerald-100">
                Abierta
              </Badge>
              {canOperate ? (
                <Button variant="outline" onClick={() => setCloseDialog(true)}>
                  <Lock className="size-4" /> Cerrar caja
                </Button>
              ) : null}
            </div>
          </div>

          <Separator />

          {/* Nivel 1 — las cifras que importan de un vistazo. */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Apertura</p>
              <p className="tabular-nums text-foreground font-medium">
                {formatMXN(s.opening_amount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Total cobrado ({count})
              </p>
              <p className="tabular-nums text-foreground font-medium">
                {formatMXN(totalCobrado)}
              </p>
              <p className="text-[10px] text-muted-foreground/80 leading-tight">
                dinero recibido en pagos
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Egresos</p>
              <p className="tabular-nums text-rose-700 dark:text-rose-400 font-medium">
                {egresos > 0 ? `−${formatMXN(egresos)}` : formatMXN(0)}
              </p>
            </div>
            <div className="rounded-lg bg-primary/5 border border-primary/15 -m-1 p-3">
              <p className="text-xs text-muted-foreground">
                Efectivo esperado en caja
              </p>
              <p className="tabular-nums text-foreground font-semibold text-lg leading-tight">
                {formatMXN(efectivoEnCaja)}
              </p>
              <p className="text-[10px] text-muted-foreground/80 leading-tight">
                apertura + efectivo − egresos en efectivo
              </p>
            </div>
          </div>

          <Separator />

          {/* Nivel 2 — desglose por método de pago (secundario). */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Desglose por método de pago
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Efectivo</p>
                <p className="tabular-nums text-foreground font-medium">
                  {formatMXN(cashTotal)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tarj. débito</p>
                <p className="tabular-nums text-foreground font-medium">
                  {formatMXN(cardTotal)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tarj. crédito</p>
                <p className="tabular-nums text-foreground font-medium">
                  {formatMXN(cardCreditTotal)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Transferencia</p>
                <p className="tabular-nums text-foreground font-medium">
                  {formatMXN(transferTotal)}
                </p>
              </div>
            </div>
            {creditTotal > 0 ? (
              <p className="text-[11px] text-muted-foreground">
                Saldo a favor usado: {formatMXN(creditTotal)} · no es ingreso de
                caja, no suma al total cobrado.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
      <CloseSessionDialog open={closeDialog} onOpenChange={setCloseDialog} session={s} />
    </>
  )
}
