import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, ScrollText } from 'lucide-react'
import { usePrescriptions } from './hooks'
import { PrescriptionDetailDialog } from './PrescriptionDetailDialog'
import { useMe } from '@/features/auth/hooks'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'
import { Badge } from '@/shared/ui/badge'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function PrescriptionsTab({ patientId }: { patientId: number }) {
  const { data: me } = useMe()
  const canCreate = me?.permissions.includes('prescriptions.create') ?? false
  const prescriptions = usePrescriptions(patientId)
  const [openId, setOpenId] = useState<number | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Recetas</h2>
          <p className="text-sm text-muted-foreground">
            Recetas emitidas. Cada una se imprime para firma y sello físicos del dentista.
          </p>
        </div>
        {canCreate ? (
          <Button asChild>
            <Link to={`/pacientes/${patientId}/recetas/nueva`}>
              <Plus className="size-4" /> Nueva receta
            </Link>
          </Button>
        ) : null}
      </div>

      {prescriptions.isPending ? (
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      ) : prescriptions.data?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center space-y-2">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted">
              <ScrollText className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Este paciente no tiene recetas todavía.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {prescriptions.data?.map((rx) => (
            <li key={rx.id}>
              <button
                type="button"
                onClick={() => setOpenId(rx.id)}
                className="w-full text-left rounded-md border bg-card p-4 shadow-sm hover:shadow-md hover:border-primary/40 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <ScrollText className="size-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {rx.code}{' '}
                        <span className="text-muted-foreground font-normal">
                          · {rx.items.length}{' '}
                          {rx.items.length === 1 ? 'medicamento' : 'medicamentos'}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {rx.specialist_name}
                        {rx.specialist_cedula ? ` · Céd. ${rx.specialist_cedula}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="secondary">{formatDate(rx.issued_at)}</Badge>
                  </div>
                </div>
                {rx.items.length > 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground truncate">
                    {rx.items
                      .map((it) => `${it.medication} (${it.dosage})`)
                      .slice(0, 3)
                      .join(' · ')}
                    {rx.items.length > 3 ? ` · +${rx.items.length - 3} más` : ''}
                  </p>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}

      <PrescriptionDetailDialog
        patientId={patientId}
        prescriptionId={openId}
        onOpenChange={(o) => !o && setOpenId(null)}
      />
    </div>
  )
}
