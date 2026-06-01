import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Loader2,
  Pencil,
  Printer,
  Send,
  Trash2,
  X,
} from 'lucide-react'
import {
  useDeleteQuote,
  useMarkQuoteAccepted,
  useMarkQuoteRejected,
  useMarkQuoteSent,
  useQuote,
  useReopenQuote,
} from './hooks'
import { ConvertQuoteDialog } from './ConvertQuoteDialog'
import { useAuth } from '@/shared/auth/permissions'
import { useConfirm } from '@/shared/ui/confirm'
import { accent } from '@/shared/lib/module-accents'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Separator } from '@/shared/ui/separator'
import { formatMXN } from '@/shared/lib/utils'
import { QUOTE_STATUS_BADGE } from '@/shared/types/quote'

function formatDate(s: string | null | undefined): string {
  if (!s) return '—'
  const d = new Date(s)
  return d.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(s: string | null | undefined): string {
  if (!s) return '—'
  const d = new Date(s)
  return d.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function QuoteDetailPage() {
  const params = useParams<{ id: string }>()
  const id = Number(params.id)
  const navigate = useNavigate()
  const confirm = useConfirm()
  const { can, isAdmin } = useAuth()
  const canManage = can('quotes.manage')
  const canConvert = canManage && can('charges.create')

  const quoteQuery = useQuote(id)
  const markSent = useMarkQuoteSent(id)
  const markAccepted = useMarkQuoteAccepted(id)
  const markRejected = useMarkQuoteRejected(id)
  const reopen = useReopenQuote(id)
  const del = useDeleteQuote()

  const [convertOpen, setConvertOpen] = useState(false)

  if (!canManage) return <Navigate to="/" replace />

  if (quoteQuery.isPending) {
    return (
      <div className="p-12 text-center text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin mx-auto" />
      </div>
    )
  }

  if (quoteQuery.error || !quoteQuery.data) {
    return (
      <div className="p-12 text-center text-sm text-muted-foreground">
        No fue posible cargar la cotización.
      </div>
    )
  }

  const q = quoteQuery.data
  const badge = QUOTE_STATUS_BADGE[q.status]

  const onDelete = async () => {
    if (
      !(await confirm({
        title: `¿Eliminar cotización ${q.code ?? `#${q.id}`}?`,
        description:
          q.status === 'converted'
            ? 'Esta cotización ya fue convertida en cobro. El cobro NO se eliminará.'
            : 'Esta acción no se puede deshacer.',
        variant: 'destructive',
        confirmText: 'Eliminar',
      }))
    )
      return
    del.mutate(id, {
      onSuccess: () => {
        toast.success('Cotización eliminada')
        navigate('/cotizaciones', { replace: true })
      },
      onError: () => toast.error('No fue posible eliminar la cotización'),
    })
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
      <Link
        to="/cotizaciones"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Cotizaciones
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`grid size-10 place-items-center rounded-lg ${accent('quotes').badge}`}>
            <FileText className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
              {q.code ?? `Cotización #${q.id}`}
              <Badge className={badge.className}>{badge.label}</Badge>
              {q.is_expired ? (
                <Badge className="bg-amber-100 text-amber-900 border border-amber-200 hover:bg-amber-100">
                  Vencida
                </Badge>
              ) : null}
            </h1>
            <p className="text-sm text-muted-foreground">
              {q.patient_name ?? 'Paciente'} · creada {formatDateTime(q.created_at)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/cotizaciones/${q.id}/imprimir`, '_blank')}
          >
            <Printer className="size-4" /> Imprimir
          </Button>

          {q.is_editable ? (
            <Button asChild variant="outline" size="sm">
              <Link to={`/cotizaciones/${q.id}/editar`}>
                <Pencil className="size-4" /> Editar
              </Link>
            </Button>
          ) : null}

          {q.status === 'draft' && q.is_editable ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markSent.mutate()}
              disabled={markSent.isPending}
            >
              <Send className="size-4" /> Marcar enviada
            </Button>
          ) : null}

          {q.is_editable && q.status !== 'accepted' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAccepted.mutate()}
              disabled={markAccepted.isPending}
            >
              <Check className="size-4" /> Aceptada
            </Button>
          ) : null}

          {q.is_editable ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markRejected.mutate()}
              disabled={markRejected.isPending}
            >
              <X className="size-4" /> Rechazar
            </Button>
          ) : null}

          {q.status === 'rejected' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => reopen.mutate()}
              disabled={reopen.isPending}
            >
              Reabrir
            </Button>
          ) : null}

          {canConvert && q.status !== 'converted' ? (
            (() => {
              const missingSpecialist = (q.items ?? []).some(
                (it) => it.specialist_id == null,
              )
              return (
                <Button
                  size="sm"
                  onClick={() => {
                    if (missingSpecialist) {
                      toast.error(
                        'Asigna un especialista a cada tratamiento antes de convertir en cobro',
                      )
                      return
                    }
                    setConvertOpen(true)
                  }}
                  title={
                    missingSpecialist
                      ? 'Faltan especialistas en algún tratamiento'
                      : undefined
                  }
                >
                  <ArrowRight className="size-4" /> Convertir en cobro
                </Button>
              )
            })()
          ) : null}

          {q.status === 'converted' && q.converted_charge_id ? (
            <Button asChild size="sm" variant="secondary">
              <Link to={`/caja/cobros/${q.converted_charge_id}/ticket`} target="_blank">
                Ver cobro generado
              </Link>
            </Button>
          ) : null}

          {isAdmin ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              disabled={del.isPending}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="size-4" /> Eliminar
            </Button>
          ) : null}
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumen</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Vigencia
            </p>
            <p className="font-medium">{formatDate(q.valid_until)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Enviada
            </p>
            <p className="font-medium">{formatDateTime(q.sent_at)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Aceptada
            </p>
            <p className="font-medium">{formatDateTime(q.accepted_at)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Convertida
            </p>
            <p className="font-medium">{formatDateTime(q.converted_at)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tratamientos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Tratamiento</th>
                  <th className="text-left px-4 py-2 font-medium">Especialista</th>
                  <th className="text-right px-4 py-2 font-medium">Cant.</th>
                  <th className="text-right px-4 py-2 font-medium">Precio</th>
                  <th className="text-right px-4 py-2 font-medium">Desc.</th>
                  <th className="text-right px-4 py-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {q.items?.map((it) => (
                  <tr key={it.id} className="border-t">
                    <td className="px-4 py-2">
                      <p className="font-medium text-foreground">{it.treatment_name}</p>
                      {it.treatment_code ? (
                        <p className="text-xs text-muted-foreground">
                          {it.treatment_code}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {it.specialist_name ?? '—'}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{it.quantity}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {formatMXN(it.unit_price)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                      {it.discount_amount > 0 ? `− ${formatMXN(it.discount_amount)}` : '—'}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums font-semibold">
                      {formatMXN(it.line_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t p-4 space-y-1 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatMXN(q.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Descuentos</span>
              <span className="tabular-nums">− {formatMXN(q.discount_total)}</span>
            </div>
            <Separator className="my-1" />
            <div className="flex items-center justify-between font-semibold text-base">
              <span>Total</span>
              <span className="tabular-nums">{formatMXN(q.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {q.notes ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap text-foreground">{q.notes}</p>
          </CardContent>
        </Card>
      ) : null}

      <ConvertQuoteDialog
        quote={q}
        open={convertOpen}
        onOpenChange={setConvertOpen}
        onConverted={(chargeId) => {
          // Navega al detalle del cobro (ticket) — opcional.
          navigate(`/cotizaciones/${q.id}`, { replace: true })
          void chargeId
        }}
      />
    </div>
  )
}
