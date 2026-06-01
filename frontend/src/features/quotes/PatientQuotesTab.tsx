import { Link } from 'react-router-dom'
import { FileText, Plus } from 'lucide-react'
import { useQuotes } from './hooks'
import { useAuth } from '@/shared/auth/permissions'
import type { Patient } from '@/shared/types/patient'
import { QUOTE_STATUS_BADGE } from '@/shared/types/quote'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Skeleton } from '@/shared/ui/skeleton'
import { formatMXN } from '@/shared/lib/utils'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

interface Props {
  patient: Patient
}

export function PatientQuotesTab({ patient }: Props) {
  const { can } = useAuth()
  const canManage = can('quotes.manage')

  // Reusa el listado paginado de cotizaciones filtrando por paciente. Tope
  // generoso porque no esperamos tantas por paciente.
  const quotes = useQuotes({ patient_id: patient.id, per_page: 100 })

  if (quotes.isPending) {
    return <Skeleton className="h-40 w-full" />
  }

  const list = quotes.data?.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">
          {list.length} {list.length === 1 ? 'cotización' : 'cotizaciones'}
        </p>
        {canManage ? (
          <Button asChild>
            <Link to={`/cotizaciones/nueva?patient_id=${patient.id}`}>
              <Plus className="size-4" /> Nueva cotización
            </Link>
          </Button>
        ) : null}
      </div>

      {list.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted mb-2">
            <FileText className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Este paciente aún no tiene cotizaciones.
          </p>
          {canManage ? (
            <Button asChild variant="link" className="mt-1">
              <Link to={`/cotizaciones/nueva?patient_id=${patient.id}`}>
                Crear la primera cotización
              </Link>
            </Button>
          ) : null}
        </Card>
      ) : (
        <div className="space-y-2">
          {list.map((q) => {
            const badge = QUOTE_STATUS_BADGE[q.status]
            return (
              <Link
                key={q.id}
                to={`/cotizaciones/${q.id}`}
                className="block"
              >
                <Card className="p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:items-center hover:bg-accent/40 transition-colors">
                  <div className="sm:col-span-4">
                    <p className="font-medium text-foreground">
                      {q.code ?? `#${q.id}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Creada {formatDate(q.created_at)}
                    </p>
                  </div>
                  <div className="sm:col-span-3 flex items-center gap-1.5 flex-wrap">
                    <Badge className={badge.className}>{badge.label}</Badge>
                    {q.is_expired ? (
                      <Badge className="bg-amber-100 text-amber-900 border border-amber-200 hover:bg-amber-100">
                        Vencida
                      </Badge>
                    ) : null}
                  </div>
                  <div className="sm:col-span-3 text-xs text-muted-foreground">
                    Vigencia: {formatDate(q.valid_until)}
                  </div>
                  <div className="sm:col-span-2 text-right tabular-nums font-semibold">
                    {formatMXN(q.total)}
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
