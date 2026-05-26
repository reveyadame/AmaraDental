import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { FilePlus2, Loader2, Pen, Printer, ShieldCheck } from 'lucide-react'
import {
  useConsentTemplates,
  useConsents,
  useCreateConsent,
} from './hooks'
import { SignaturePad } from './SignaturePad'
import { Card, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { Skeleton } from '@/shared/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import type { Patient } from '@/shared/types/patient'

function applyVariables(body: string, patient: Patient, clinicName: string): string {
  return body
    .replaceAll('{{paciente}}', patient.full_name)
    .replaceAll('{{clinica}}', clinicName)
    .replaceAll('{{tratamiento}}', '_________')
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function ConsentsTab({ patient, clinicName }: { patient: Patient; clinicName: string }) {
  const consents = useConsents(patient.id)
  const templates = useConsentTemplates()
  const create = useCreateConsent(patient.id)

  const [open, setOpen] = useState(false)
  const [templateId, setTemplateId] = useState<string>('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [signedBy, setSignedBy] = useState(patient.full_name)
  const [signature, setSignature] = useState<string | null>(null)

  const selectedTemplate = useMemo(
    () => templates.data?.find((t) => String(t.id) === templateId),
    [templates.data, templateId],
  )

  useEffect(() => {
    if (selectedTemplate) {
      setTitle(selectedTemplate.title)
      setBody(applyVariables(selectedTemplate.body, patient, clinicName))
    }
  }, [selectedTemplate, patient, clinicName])

  const resetForm = () => {
    setTemplateId('')
    setTitle('')
    setBody('')
    setSignedBy(patient.full_name)
    setSignature(null)
  }

  const onSign = () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Título y texto son obligatorios')
      return
    }
    if (!signature) {
      toast.error('Falta la firma del paciente')
      return
    }
    create.mutate(
      {
        consent_template_id: templateId ? Number(templateId) : null,
        title,
        body,
        signature_image: signature,
        signed_by_name: signedBy,
      },
      {
        onSuccess: () => {
          toast.success('Consentimiento firmado y guardado')
          resetForm()
          setOpen(false)
        },
        onError: () => toast.error('No fue posible guardar el consentimiento'),
      },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Consentimientos</h2>
          <p className="text-sm text-muted-foreground">
            Captura el consentimiento informado firmado por el paciente (NOM-004).
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <FilePlus2 className="size-4" /> Nuevo consentimiento
        </Button>
      </div>

      {consents.isPending ? (
        <Card className="p-6">
          <Skeleton className="h-20 w-full" />
        </Card>
      ) : consents.data?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center space-y-2">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted">
              <ShieldCheck className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Aún no hay consentimientos firmados para este paciente.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {consents.data?.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <ShieldCheck className="size-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Firmado por <span className="font-medium">{c.signed_by_name}</span> ·{' '}
                    {formatDate(c.signed_at)}
                  </p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-900 border border-emerald-200 hover:bg-emerald-100">
                  Firmado
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    window.open(
                      `/pacientes/${patient.id}/consentimientos/${c.id}/imprimir`,
                      '_blank',
                      'noopener',
                    )
                  }
                  title="Imprimir / Guardar PDF"
                >
                  <Printer className="size-4" />
                  <span className="hidden sm:inline">Imprimir</span>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o)
          if (!o) resetForm()
        }}
      >
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo consentimiento</DialogTitle>
            <DialogDescription>
              Elige una plantilla o redacta uno nuevo. El paciente debe firmar abajo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Plantilla</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una plantilla (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {templates.data?.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Texto del consentimiento</Label>
              <Textarea
                rows={10}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="font-mono text-xs"
              />
              <p className="text-[10px] text-muted-foreground">
                Variables soportadas: {'{{paciente}}'}, {'{{clinica}}'}, {'{{tratamiento}}'}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Firmado por</Label>
              <Input value={signedBy} onChange={(e) => setSignedBy(e.target.value)} />
              <p className="text-[10px] text-muted-foreground">
                Nombre completo del paciente o tutor que firma.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-2">
                <Pen className="size-3.5" /> Firma del paciente
              </Label>
              <SignaturePad onChange={setSignature} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={onSign} disabled={create.isPending}>
              {create.isPending ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              Firmar y guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
