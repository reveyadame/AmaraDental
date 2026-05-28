import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { FileText, Pencil, Plus, Search, ShieldCheck, Trash2 } from 'lucide-react'
import {
  useConsentTemplatesCatalog,
  useDeleteConsentTemplate,
} from '@/features/consent-templates/hooks'
import { ConsentTemplateFormDialog } from '@/features/consent-templates/ConsentTemplateFormDialog'
import { useAuth } from '@/shared/auth/permissions'
import { useConfirm } from '@/shared/ui/confirm'
import type { ConsentTemplate } from '@/shared/types/patient'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Skeleton } from '@/shared/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'

export function ConsentTemplatesPage() {
  const { isAdmin, can } = useAuth()
  const canManage = can('catalogs.manage')
  const templates = useConsentTemplatesCatalog()
  const del = useDeleteConsentTemplate()
  const confirm = useConfirm()
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<ConsentTemplate | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const rows = useMemo(() => {
    const list = templates.data ?? []
    const needle = q.trim().toLowerCase()
    if (!needle) return list
    return list.filter(
      (t) =>
        t.title.toLowerCase().includes(needle) ||
        (t.treatment_type ?? '').toLowerCase().includes(needle),
    )
  }, [templates.data, q])

  // Catálogo del rol Catálogos (catalogs.manage); admin incluido.
  if (!canManage) return <Navigate to="/" replace />

  const onDelete = async (t: ConsentTemplate) => {
    const ok = await confirm({
      title: `¿Eliminar plantilla "${t.title}"?`,
      description:
        'Los consentimientos ya firmados conservan su texto; esta acción solo elimina la plantilla.',
      confirmText: 'Eliminar',
      variant: 'destructive',
    })
    if (!ok) return
    del.mutate(t.id, {
      onSuccess: () => toast.success('Plantilla eliminada'),
      onError: () => toast.error('No fue posible eliminar'),
    })
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Plantillas de consentimiento
          </h1>
          <p className="text-sm text-muted-foreground">
            Redacta y administra los textos de consentimiento informado que se firman en el
            expediente (NOM-004).
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" /> Nueva plantilla
        </Button>
      </header>

      <Card className="p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por título o tipo de tratamiento…"
            className="pl-9"
          />
        </div>
      </Card>

      <Card>
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow>
              <TableHead>Plantilla</TableHead>
              <TableHead>Tipo de tratamiento</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.isPending ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-14 text-center">
                  <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted mb-2">
                    <ShieldCheck className="size-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {q
                      ? `Sin resultados para "${q}"`
                      : 'Aún no hay plantillas de consentimiento.'}
                  </p>
                  {!q ? (
                    <Button variant="link" onClick={() => setCreateOpen(true)}>
                      Crear la primera plantilla
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 text-muted-foreground shrink-0" />
                      <span className="font-medium text-foreground">{t.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {t.treatment_type ? (
                      <Badge variant="outline" className="font-normal">
                        {t.treatment_type}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {t.active ? (
                      <Badge className="bg-emerald-100 text-emerald-900 border border-emerald-200 hover:bg-emerald-100">
                        Activa
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inactiva</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(t)}>
                      <Pencil className="size-4" />
                    </Button>
                    {isAdmin ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => onDelete(t)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <ConsentTemplateFormDialog open={createOpen} onOpenChange={setCreateOpen} />

      {editing ? (
        <ConsentTemplateFormDialog
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          template={editing}
        />
      ) : null}
    </div>
  )
}
