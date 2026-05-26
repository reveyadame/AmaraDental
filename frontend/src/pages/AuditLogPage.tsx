import { useEffect, useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  History,
  ShieldCheck,
} from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { useAudits, useAuditsMeta } from '@/features/audit-log/hooks'
import { useMe } from '@/features/auth/hooks'
import {
  AUDIT_EVENT_LABELS,
  type AuditEntry,
  type AuditEvent,
} from '@/shared/types/audit'
import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Skeleton } from '@/shared/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import { cn } from '@/shared/lib/utils'
import { accent } from '@/shared/lib/module-accents'

const EVENT_BADGE: Record<AuditEvent, string> = {
  created: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  updated: 'bg-amber-100 text-amber-900 border-amber-200',
  deleted: 'bg-rose-100 text-rose-900 border-rose-200',
  restored: 'bg-primary/10 text-primary border-primary/20',
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-MX', {
    dateStyle: 'short',
    timeStyle: 'medium',
  })
}

/**
 * Devuelve los pares clave/valor que cambiaron entre old y new (o el snapshot
 * completo si es create/delete).
 */
function diffChanges(
  oldValues: Record<string, unknown> | null,
  newValues: Record<string, unknown> | null,
): Array<{ field: string; from: unknown; to: unknown }> {
  const keys = new Set<string>([
    ...Object.keys(oldValues ?? {}),
    ...Object.keys(newValues ?? {}),
  ])
  const rows: Array<{ field: string; from: unknown; to: unknown }> = []
  keys.forEach((k) => {
    const from = oldValues?.[k]
    const to = newValues?.[k]
    if (JSON.stringify(from) !== JSON.stringify(to)) {
      rows.push({ field: k, from, to })
    }
  })
  return rows
}

function renderValue(v: unknown): string {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'string') return v.length > 120 ? v.slice(0, 120) + '…' : v
  if (typeof v === 'boolean') return v ? 'Sí' : 'No'
  return JSON.stringify(v)
}

function AuditRow({ entry }: { entry: AuditEntry }) {
  const [open, setOpen] = useState(false)
  const changes = useMemo(
    () => diffChanges(entry.old_values, entry.new_values),
    [entry.old_values, entry.new_values],
  )

  return (
    <>
      <TableRow
        className={cn('cursor-pointer hover:bg-muted/40')}
        onClick={() => setOpen((v) => !v)}
      >
        <TableCell className="w-6">
          {open ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
        </TableCell>
        <TableCell className="text-xs whitespace-nowrap">
          {formatDateTime(entry.created_at)}
        </TableCell>
        <TableCell className="text-sm">{entry.user_name ?? '—'}</TableCell>
        <TableCell>
          <Badge
            variant="outline"
            className={cn('font-normal', EVENT_BADGE[entry.event])}
          >
            {AUDIT_EVENT_LABELS[entry.event]}
          </Badge>
        </TableCell>
        <TableCell>
          <p className="text-sm">{entry.auditable_label}</p>
          <p className="text-xs text-muted-foreground font-mono">
            #{entry.auditable_id}
          </p>
        </TableCell>
        <TableCell className="text-xs text-muted-foreground tabular-nums">
          {changes.length} {changes.length === 1 ? 'campo' : 'campos'}
        </TableCell>
      </TableRow>
      {open ? (
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell colSpan={6} className="py-3">
            {changes.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                Sin cambios registrados (snapshot vacío).
              </p>
            ) : (
              <div className="rounded-md border bg-background overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left px-3 py-2 font-medium">Campo</th>
                      <th className="text-left px-3 py-2 font-medium">
                        Antes
                      </th>
                      <th className="text-left px-3 py-2 font-medium">
                        Después
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {changes.map((c) => (
                      <tr key={c.field} className="border-b last:border-b-0">
                        <td className="px-3 py-1.5 font-mono text-[11px]">
                          {c.field}
                        </td>
                        <td className="px-3 py-1.5 text-rose-700 dark:text-rose-300">
                          {renderValue(c.from)}
                        </td>
                        <td className="px-3 py-1.5 text-emerald-700 dark:text-emerald-300">
                          {renderValue(c.to)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {entry.ip_address ? (
              <p className="text-[11px] text-muted-foreground mt-2">
                Desde IP {entry.ip_address}
              </p>
            ) : null}
          </TableCell>
        </TableRow>
      ) : null}
    </>
  )
}

export function AuditLogPage() {
  const { data: me } = useMe()
  const isAdmin = me?.roles.includes('admin') ?? false
  const meta = useAuditsMeta()

  const [userId, setUserId] = useState<string>('all')
  const [type, setType] = useState<string>('all')
  const [event, setEvent] = useState<string>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)

  // Resetea la página cuando cambian los filtros.
  useEffect(() => {
    setPage(1)
  }, [userId, type, event, from, to, perPage])

  const query = useMemo(
    () => ({
      user_id: userId !== 'all' ? Number(userId) : undefined,
      auditable_type: type !== 'all' ? type : undefined,
      event: event !== 'all' ? event : undefined,
      date_from: from || undefined,
      date_to: to || undefined,
      page,
      per_page: perPage,
    }),
    [userId, type, event, from, to, page, perPage],
  )
  const audits = useAudits(query)
  const lastPage = audits.data?.meta.last_page ?? 1
  const total = audits.data?.meta.total ?? 0

  if (!isAdmin) return <Navigate to="/" replace />

  const clear = () => {
    setUserId('all')
    setType('all')
    setEvent('all')
    setFrom('')
    setTo('')
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-6">
      <header className="flex items-center gap-3">
        <div className={`grid size-10 place-items-center rounded-lg ${accent('audit').badge}`}>
          <ShieldCheck className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Bitácora
          </h1>
          <p className="text-sm text-muted-foreground">
            Registro de cambios al expediente y al backoffice — cumplimiento
            NOM-024.
          </p>
        </div>
      </header>

      <Card className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Usuario</Label>
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {meta.data?.users.map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Entidad</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {meta.data?.types.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Evento</Label>
          <Select value={event} onValueChange={setEvent}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {(meta.data?.events ?? []).map((e) => (
                <SelectItem key={e} value={e}>
                  {AUDIT_EVENT_LABELS[e as AuditEvent] ?? e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Desde</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Hasta</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="sm:col-span-2 lg:col-span-5 flex justify-end">
          <Button size="sm" variant="ghost" onClick={clear}>
            Limpiar filtros
          </Button>
        </div>
      </Card>

      <Card>
        <Table className="min-w-[820px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead className="whitespace-nowrap">Fecha</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Entidad</TableHead>
              <TableHead>Campos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {audits.isPending ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : audits.data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-14 text-center">
                  <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted mb-2">
                    <History className="size-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Sin entradas para los filtros seleccionados.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              audits.data!.data.map((a) => <AuditRow key={a.id} entry={a} />)
            )}
          </TableBody>
        </Table>
        {audits.data && total > 0 ? (
          <div className="px-4 py-3 text-xs text-muted-foreground border-t flex items-center justify-between gap-3 flex-wrap">
            <span>
              <Eye className="inline size-3 mr-1" />
              Mostrando {(page - 1) * perPage + 1}–
              {(page - 1) * perPage + audits.data.data.length} de {total} entradas
            </span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Label className="text-xs">Por página</Label>
                <Select
                  value={String(perPage)}
                  onValueChange={(v) => setPerPage(Number(v))}
                >
                  <SelectTrigger className="h-8 w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="outline"
                  className="size-8"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  aria-label="Primera página"
                >
                  <ChevronsLeft className="size-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="size-8"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="size-3.5" />
                </Button>
                <span className="px-2 tabular-nums">
                  {page} / {lastPage}
                </span>
                <Button
                  size="icon"
                  variant="outline"
                  className="size-8"
                  onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                  disabled={page >= lastPage}
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="size-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="size-8"
                  onClick={() => setPage(lastPage)}
                  disabled={page >= lastPage}
                  aria-label="Última página"
                >
                  <ChevronsRight className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  )
}
