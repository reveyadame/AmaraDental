import { useState } from 'react'
import { Loader2, Search, ScrollText } from 'lucide-react'
import { useTemplates } from './hooks'
import type { PrescriptionTemplate } from '@/shared/types/prescription'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Badge } from '@/shared/ui/badge'
import { ROUTE_LABEL } from '@/shared/types/prescription'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (template: PrescriptionTemplate) => void
}

export function LoadTemplateDialog({ open, onOpenChange, onSelect }: Props) {
  const [q, setQ] = useState('')
  const debounced = useDebouncedValue(q, 250)
  const templates = useTemplates(debounced || undefined)
  const [previewId, setPreviewId] = useState<number | null>(null)

  const preview = templates.data?.find((t) => t.id === previewId) ?? null

  const apply = (t: PrescriptionTemplate) => {
    onSelect(t)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Cargar plantilla de receta</DialogTitle>
          <DialogDescription>
            Selecciona una plantilla — sus medicamentos reemplazarán los del formulario actual.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o categoría…"
            className="pl-9"
          />
        </div>

        <div className="grid sm:grid-cols-[1fr_1.2fr] gap-3 flex-1 min-h-0">
          <div className="overflow-y-auto border rounded-md">
            {templates.isPending ? (
              <p className="text-sm text-muted-foreground p-4 text-center">
                <Loader2 className="size-4 animate-spin inline mr-1.5" /> Cargando…
              </p>
            ) : templates.data?.length === 0 ? (
              <div className="p-6 text-center space-y-2">
                <ScrollText className="size-6 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {debounced
                    ? `Sin resultados para "${debounced}"`
                    : 'Aún no hay plantillas. Créalas desde Plantillas Rx.'}
                </p>
              </div>
            ) : (
              <ul className="divide-y">
                {templates.data?.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => setPreviewId(t.id)}
                      onDoubleClick={() => apply(t)}
                      className={
                        'w-full text-left px-3 py-2 hover:bg-accent transition-colors ' +
                        (previewId === t.id ? 'bg-accent' : '')
                      }
                    >
                      <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                        {t.category ? (
                          <Badge variant="outline" className="font-normal text-[10px]">
                            {t.category}
                          </Badge>
                        ) : null}
                        {(t.items_count ?? t.items.length)}{' '}
                        {(t.items_count ?? t.items.length) === 1
                          ? 'medicamento'
                          : 'medicamentos'}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="overflow-y-auto border rounded-md bg-muted/30 p-3">
            {!preview ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Elige una plantilla para verla.
              </p>
            ) : (
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Plantilla</p>
                  <p className="font-semibold text-foreground">{preview.name}</p>
                  {preview.description ? (
                    <p className="text-xs text-muted-foreground">{preview.description}</p>
                  ) : null}
                </div>
                <ol className="space-y-2">
                  {preview.items.map((it, idx) => (
                    <li key={(it.id ?? idx).toString()} className="rounded border bg-card p-2">
                      <p className="font-medium">
                        {idx + 1}. {it.medication}
                        {it.presentation ? (
                          <span className="text-muted-foreground font-normal">
                            {' '}
                            · {it.presentation}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{it.dosage}</span>
                        {it.route ? ` · vía ${ROUTE_LABEL[it.route] ?? it.route}` : ''}
                        {' · '}
                        {it.frequency} · {it.duration}
                      </p>
                      {it.instructions ? (
                        <p className="text-xs italic text-muted-foreground mt-0.5">
                          {it.instructions}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={!preview} onClick={() => preview && apply(preview)}>
            Usar plantilla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
