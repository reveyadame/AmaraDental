import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, Loader2, UserPlus } from 'lucide-react'
import { useCreateQuickPatient, usePatients } from './hooks'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import type { Patient } from '@/shared/types/patient'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Texto que ya escribió el usuario en el picker; se intenta dividir en
   *  nombre y apellido para prellenar. */
  initialName?: string
  /** Callback cuando el paciente queda creado — se usa para seleccionarlo
   *  automáticamente en el flujo que abrió este diálogo (p. ej. agenda). */
  onCreated: (p: Patient) => void
}

function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/)
  if (parts.length <= 1) return { first: parts[0] ?? '', last: '' }
  // Heurística sencilla: primera palabra es nombre, el resto apellido.
  return { first: parts[0] ?? '', last: parts.slice(1).join(' ') }
}

export function QuickPatientDialog({ open, onOpenChange, initialName, onCreated }: Props) {
  const create = useCreateQuickPatient()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [mobilePhone, setMobilePhone] = useState('')
  const [notes, setNotes] = useState('')

  // Búsqueda de duplicados aproximados por nombre completo. Si encontramos
  // alguien parecido, lo mostramos para evitar que se cree un duplicado.
  const fullName = `${firstName} ${lastName}`.trim()
  const debouncedName = useDebouncedValue(fullName, 300)
  const candidates = usePatients({
    q: debouncedName,
    per_page: 5,
  })

  useEffect(() => {
    if (!open) return
    const { first, last } = splitName(initialName ?? '')
    setFirstName(first)
    setLastName(last)
    setMobilePhone('')
    setNotes('')
  }, [open, initialName])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim()) {
      toast.error('Captura al menos el nombre')
      return
    }
    if (!lastName.trim()) {
      toast.error('Captura al menos un apellido')
      return
    }
    create.mutate(
      {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        mobile_phone: mobilePhone.trim() || null,
        notes: notes.trim() || null,
      },
      {
        onSuccess: (p) => {
          toast.success(`${p.full_name} agregado como paciente nuevo`)
          onCreated(p)
          onOpenChange(false)
        },
        onError: (err: unknown) => {
          const errs =
            err && typeof err === 'object' && 'response' in err
              ? (err as {
                  response?: { data?: { errors?: Record<string, string[]>; message?: string } }
                }).response?.data
              : undefined
          const first = errs?.errors ? Object.values(errs.errors)[0]?.[0] : errs?.message
          toast.error(first ?? 'No fue posible crear el paciente')
        },
      },
    )
  }

  // Posibles duplicados — mostramos solo si el usuario tipeó algo y hay
  // coincidencias distintas a vacío.
  const duplicates =
    debouncedName.length >= 2 ? (candidates.data?.data ?? []).slice(0, 3) : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5" />
            Nuevo paciente (primera vez)
          </DialogTitle>
          <DialogDescription>
            Captura solo lo necesario para agendar. El expediente completo se
            llena cuando el paciente llegue a su cita.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="qp-first">Nombre</Label>
              <Input
                id="qp-first"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qp-last">Apellido</Label>
              <Input
                id="qp-last"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          {duplicates.length > 0 ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-3 space-y-2">
              <div className="flex items-start gap-2 text-amber-900 dark:text-amber-200">
                <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                <p className="text-xs">
                  Ya hay pacientes con nombre parecido. ¿Es alguno de ellos?
                </p>
              </div>
              <ul className="divide-y divide-amber-200/50">
                {duplicates.map((d) => (
                  <li key={d.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onCreated(d)
                        onOpenChange(false)
                      }}
                      className="flex w-full items-center justify-between gap-3 px-2 py-1.5 text-left hover:bg-amber-100/50 dark:hover:bg-amber-900/20 rounded transition-colors"
                    >
                      <span className="text-sm font-medium text-foreground">
                        {d.full_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {d.mobile_phone ?? d.phone ?? d.email ?? '—'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="qp-mobile">Teléfono celular</Label>
            <Input
              id="qp-mobile"
              value={mobilePhone}
              onChange={(e) => setMobilePhone(e.target.value)}
              placeholder="442 123 4567"
              inputMode="tel"
            />
            <p className="text-[11px] text-muted-foreground">
              Sirve para confirmar la cita y enviar recordatorios.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="qp-notes">Nota (opcional)</Label>
            <Input
              id="qp-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Motivo de consulta, referido por…"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={create.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Crear y seleccionar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
