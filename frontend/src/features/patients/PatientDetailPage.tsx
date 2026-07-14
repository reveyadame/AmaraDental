import { useState } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  Mail,
  MapPin,
  Phone,
  Stethoscope,
  PencilLine,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { usePatient } from './hooks'
import { PatientFormDialog } from './PatientFormDialog'
import { DeletePatientDialog } from './DeletePatientDialog'
import { PatientNextAppointment } from './PatientNextAppointmentCard'
import { useAuth } from '@/shared/auth/permissions'
import { COUNTRY_LABELS } from './regions'
import { MARITAL_STATUS_LABELS } from '@/shared/types/patient'
import { MedicalHistoryTab } from './MedicalHistoryTab'
import { ConsentsTab } from './ConsentsTab'
import { OdontogramTab } from './OdontogramTab'
import { EndodonticsTab } from './EndodonticsTab'
import { PrescriptionsTab } from '@/features/prescriptions/PrescriptionsTab'
import { PatientAccountTab } from '@/features/cash/PatientAccountTab'
import { PatientMembershipTab } from '@/features/memberships/PatientMembershipTab'
import { PatientLabOrdersTab } from '@/features/labs/PatientLabOrdersTab'
import { PatientQuotesTab } from '@/features/quotes/PatientQuotesTab'
import { PatientRecallsTab } from '@/features/recalls/PatientRecallsTab'
import { useMe } from '@/features/auth/hooks'
import { useBranding } from '@/shared/theme/ThemeProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { Separator } from '@/shared/ui/separator'

function initials(p: { first_name: string; last_name: string }) {
  return `${p.first_name[0] ?? ''}${p.last_name[0] ?? ''}`.toUpperCase()
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function PatientDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id ? Number(params.id) : undefined
  const patient = usePatient(id)
  const { branding } = useBranding()
  const [edit, setEdit] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const { data: me } = useMe()
  const { isAdmin } = useAuth()
  // Tabs clínicas requieren permiso `clinical.view`. Quienes solo hacen
  // caja/agenda no ven historia, odontograma, recetas ni consentimientos.
  const canViewClinical = me?.permissions.includes('clinical.view') ?? false
  const canManage = me?.permissions.includes('patients.manage') ?? false
  // Cada tab se muestra solo si el rol del usuario lo cubre. "Datos" siempre
  // (cualquiera que llega aquí tiene al menos patients.read_basic).
  const perms = me?.permissions ?? []
  const canCash =
    perms.includes('cash.operate') || perms.includes('charges.create')
  const canMemberships = perms.includes('memberships.manage')
  const canLabs = perms.includes('labs.manage')
  const canRecalls = perms.includes('recalls.manage')
  const canQuotes = perms.includes('quotes.manage')

  if (!id || Number.isNaN(id)) return <Navigate to="/pacientes" replace />

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-6">
      <Link
        to="/pacientes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Pacientes
      </Link>

      {patient.isPending ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      ) : !patient.data ? (
        <p className="text-sm text-muted-foreground">Paciente no encontrado.</p>
      ) : (
        <>
          <Card>
            <CardContent className="p-6 space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="grid size-16 place-items-center rounded-full bg-primary/10 text-primary text-lg font-semibold">
                  {initials(patient.data)}
                </div>
                <div className="space-y-1">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
                    {patient.data.full_name}
                    {patient.data.is_first_visit ? (
                      <Badge className="bg-lime-100 text-lime-900 border border-lime-200 hover:bg-lime-100 gap-1">
                        <Sparkles className="size-3" /> Primera vez
                      </Badge>
                    ) : null}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    {patient.data.gender ? (
                      <Badge variant="secondary">
                        {patient.data.gender === 'F'
                          ? 'Femenino'
                          : patient.data.gender === 'M'
                            ? 'Masculino'
                            : 'Otro'}
                      </Badge>
                    ) : null}
                    {patient.data.age != null ? (
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="size-3.5" /> {patient.data.age} años
                      </span>
                    ) : null}
                    {patient.data.date_of_birth ? (
                      <span>Nacimiento: {formatDate(patient.data.date_of_birth)}</span>
                    ) : null}
                    {patient.data.curp ? <span>CURP {patient.data.curp}</span> : null}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {canManage ? (
                  <Button variant="outline" onClick={() => setEdit(true)}>
                    <PencilLine className="size-4" /> Editar
                  </Button>
                ) : null}
                {isAdmin ? (
                  <Button
                    variant="ghost"
                    onClick={() => setDeleteOpen(true)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" /> Eliminar
                  </Button>
                ) : null}
              </div>
            </div>

              <Separator />
              <PatientNextAppointment patientId={patient.data.id} />
            </CardContent>
          </Card>

          {patient.data.is_first_visit ? (
            <Card className="border-lime-300 bg-lime-50 dark:bg-lime-950/20">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-lime-200/60 text-lime-900 dark:text-lime-200 shrink-0">
                    <Sparkles className="size-4" />
                  </span>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground">
                      Paciente de primera vez
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Capturado rápido desde la agenda. Cuando llegue, completa
                      su fecha de nacimiento y género para abrir el expediente
                      formal — la etiqueta desaparece sola.
                    </p>
                  </div>
                </div>
                {canManage ? (
                  <Button size="sm" onClick={() => setEdit(true)}>
                    Completar expediente
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          <Tabs defaultValue="datos" className="space-y-4">
            {/* Scroll horizontal cuando no caben todos los tabs (móvil). */}
            <div className="-mx-1 overflow-x-auto pb-1">
              <TabsList className="w-max">
                <TabsTrigger value="datos">Datos</TabsTrigger>
                {canCash ? (
                  <TabsTrigger value="cuenta">Estado de cuenta</TabsTrigger>
                ) : null}
                {canQuotes ? (
                  <TabsTrigger value="cotizaciones">Cotizaciones</TabsTrigger>
                ) : null}
                {canMemberships ? (
                  <TabsTrigger value="membresia">Membresía</TabsTrigger>
                ) : null}
                {canViewClinical ? (
                  <>
                    <TabsTrigger value="historia">Historia clínica</TabsTrigger>
                    <TabsTrigger value="odontograma">Odontograma</TabsTrigger>
                    <TabsTrigger value="endodoncia">Endodoncia</TabsTrigger>
                    <TabsTrigger value="recetas">Recetas</TabsTrigger>
                  </>
                ) : null}
                {canLabs ? (
                  <TabsTrigger value="laboratorios">Laboratorios</TabsTrigger>
                ) : null}
                {canRecalls ? (
                  <TabsTrigger value="recalls">Recalls</TabsTrigger>
                ) : null}
                {canViewClinical ? (
                  <TabsTrigger value="consentimientos">Consentimientos</TabsTrigger>
                ) : null}
              </TabsList>
            </div>

            <TabsContent value="datos">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Contacto</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {patient.data.mobile_phone ? (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="size-4" /> {patient.data.mobile_phone}{' '}
                        <span className="text-xs">(celular)</span>
                      </p>
                    ) : null}
                    {patient.data.phone ? (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="size-4" /> {patient.data.phone}{' '}
                        <span className="text-xs">(fijo)</span>
                      </p>
                    ) : null}
                    {patient.data.email ? (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="size-4" /> {patient.data.email}
                      </p>
                    ) : null}
                    <Separator />
                    {patient.data.address ||
                    patient.data.city ||
                    patient.data.state ||
                    patient.data.country ? (
                      <p className="flex items-start gap-2 text-muted-foreground">
                        <MapPin className="size-4 mt-0.5" />
                        <span>
                          {patient.data.address ? (
                            <>
                              {patient.data.address}
                              <br />
                            </>
                          ) : null}
                          {[patient.data.city, patient.data.state, patient.data.postal_code]
                            .filter(Boolean)
                            .join(', ')}
                          {patient.data.country ? (
                            <>
                              {patient.data.city ||
                              patient.data.state ||
                              patient.data.postal_code ? (
                                <br />
                              ) : null}
                              {COUNTRY_LABELS[patient.data.country]}
                            </>
                          ) : null}
                        </span>
                      </p>
                    ) : (
                      <p className="text-muted-foreground/70 text-sm">Sin domicilio registrado.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Datos adicionales</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Ocupación</p>
                      <p className="text-foreground">{patient.data.occupation ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Estado civil</p>
                      <p className="text-foreground">
                        {patient.data.marital_status
                          ? MARITAL_STATUS_LABELS[patient.data.marital_status]
                          : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Referido por</p>
                      <p className="text-foreground">{patient.data.referred_by ?? '—'}</p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground">Contacto de emergencia</p>
                      <p className="text-foreground">
                        {patient.data.emergency_contact_name ?? '—'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {patient.data.emergency_contact_phone ?? ''}
                      </p>
                    </div>
                    {patient.data.notes ? (
                      <>
                        <Separator />
                        <div>
                          <p className="text-xs text-muted-foreground">Notas</p>
                          <p className="whitespace-pre-wrap text-foreground">
                            {patient.data.notes}
                          </p>
                        </div>
                      </>
                    ) : null}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {canCash ? (
              <TabsContent value="cuenta">
                <PatientAccountTab patientId={patient.data.id} />
              </TabsContent>
            ) : null}

            {canQuotes ? (
              <TabsContent value="cotizaciones">
                <PatientQuotesTab patient={patient.data} />
              </TabsContent>
            ) : null}

            {canMemberships ? (
              <TabsContent value="membresia">
                <PatientMembershipTab patient={patient.data} />
              </TabsContent>
            ) : null}

            {canViewClinical ? (
              <>
                <TabsContent value="historia">
                  <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                    <Stethoscope className="size-4" />
                    Historia clínica conforme NOM-004. Cada cambio queda registrado en la bitácora.
                  </div>
                  <MedicalHistoryTab
                    patientId={patient.data.id}
                    isFemale={patient.data.gender === 'F'}
                  />
                </TabsContent>

                <TabsContent value="odontograma">
                  <OdontogramTab patientId={patient.data.id} />
                </TabsContent>

                <TabsContent value="endodoncia">
                  <EndodonticsTab patientId={patient.data.id} />
                </TabsContent>

                <TabsContent value="recetas">
                  <PrescriptionsTab patientId={patient.data.id} />
                </TabsContent>
              </>
            ) : null}

            {canLabs ? (
              <TabsContent value="laboratorios">
                <PatientLabOrdersTab patient={patient.data} />
              </TabsContent>
            ) : null}

            {canRecalls ? (
              <TabsContent value="recalls">
                <PatientRecallsTab patient={patient.data} />
              </TabsContent>
            ) : null}

            {canViewClinical ? (
              <TabsContent value="consentimientos">
                <ConsentsTab
                  patient={patient.data}
                  clinicName={branding?.brand_name ?? 'la clínica'}
                />
              </TabsContent>
            ) : null}
          </Tabs>

          <PatientFormDialog open={edit} onOpenChange={setEdit} patient={patient.data} />
          {isAdmin ? (
            <DeletePatientDialog
              patientId={patient.data.id}
              patientName={patient.data.full_name}
              open={deleteOpen}
              onOpenChange={setDeleteOpen}
            />
          ) : null}
        </>
      )}
    </div>
  )
}
