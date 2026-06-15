import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Sparkles,
  UserRound,
  Users,
} from 'lucide-react'
import { usePatients } from './hooks'
import { PatientFormDialog } from './PatientFormDialog'
import { PatientLimitBanner } from '@/features/subscription/PatientLimitBanner'
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
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { accent } from '@/shared/lib/module-accents'
import { useAuth } from '@/shared/auth/permissions'

export function PatientsListPage() {
  const { can } = useAuth()
  const canManagePatients = can('patients.manage')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const debounced = useDebouncedValue(query, 350)
  const patients = usePatients({ q: debounced, page, per_page: 25 })

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`grid size-10 place-items-center rounded-lg ${accent('patients').badge}`}>
            <Users className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Pacientes
            </h1>
            <p className="text-sm text-muted-foreground">
              {canManagePatients
                ? 'Expediente clínico, historia médica y consentimientos.'
                : 'Consulta de pacientes: identificación, contacto y saldo.'}
            </p>
          </div>
        </div>
        {canManagePatients ? (
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" /> Nuevo paciente
          </Button>
        ) : null}
      </header>

      <PatientLimitBanner />

      <Card className="p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            placeholder="Buscar por nombre, correo, teléfono o CURP…"
            className="pl-9"
          />
        </div>
      </Card>

      <Card>
        <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Edad</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead className="text-right">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.isPending ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : patients.data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-14">
                  <div className="text-center space-y-2">
                    <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted">
                      <UserRound className="size-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {debounced
                        ? `Sin resultados para "${debounced}"`
                        : 'Aún no tienes pacientes registrados.'}
                    </p>
                    {canManagePatients ? (
                      <Button variant="link" onClick={() => setOpen(true)}>
                        Crear el primer paciente
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              patients.data?.data.map((p) => (
                <TableRow key={p.id} className="cursor-pointer">
                  <TableCell>
                    <Link to={`/pacientes/${p.id}`} className="flex items-center gap-3 group">
                      <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        {p.first_name[0]}
                        {p.last_name[0]}
                      </span>
                      <span>
                        <span className="block text-sm font-medium text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                          {p.full_name}
                          {p.is_first_visit ? (
                            <Badge className="bg-lime-100 text-lime-900 border border-lime-200 hover:bg-lime-100 gap-1 text-[10px] px-1.5">
                              <Sparkles className="size-2.5" /> 1ra vez
                            </Badge>
                          ) : null}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {p.gender === 'F'
                            ? 'Femenino'
                            : p.gender === 'M'
                              ? 'Masculino'
                              : p.is_first_visit
                                ? 'Expediente pendiente'
                                : 'Otro'}
                          {p.curp ? ` · CURP ${p.curp}` : ''}
                        </span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.age != null ? `${p.age} años` : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <span className="block">{p.mobile_phone ?? p.phone ?? '—'}</span>
                    {p.email ? <span className="block text-xs">{p.email}</span> : null}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.city ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    {p.active ? (
                      <Badge className="bg-emerald-100 text-emerald-900 border border-emerald-200 hover:bg-emerald-100">
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Inactivo
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {patients.data && patients.data.meta.last_page > 1 ? (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {patients.data.meta.from}–{patients.data.meta.to} de {patients.data.meta.total}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-4" /> Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= patients.data.meta.last_page}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      <PatientFormDialog open={open} onOpenChange={setOpen} />
    </div>
  )
}
