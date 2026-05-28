import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Save, Stethoscope } from 'lucide-react'
import { useUpdateOdontogramDiagnosis } from './useOdontogram'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Textarea } from '@/shared/ui/textarea'

export function OdontogramDiagnosis({
  patientId,
  value,
  canEdit,
}: {
  patientId: number
  value: string | null
  canEdit: boolean
}) {
  const [text, setText] = useState(value ?? '')
  const update = useUpdateOdontogramDiagnosis(patientId)
  const dirty = text !== (value ?? '')

  const onSave = () => {
    update.mutate(text.trim() || null, {
      onSuccess: () => toast.success('Diagnóstico general guardado'),
      onError: () => toast.error('No fue posible guardar el diagnóstico'),
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Stethoscope className="size-4 text-primary" />
          Diagnóstico general
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {canEdit ? (
          <>
            <Textarea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Resumen clínico del estado dental del paciente…"
              maxLength={5000}
            />
            <div className="flex justify-end">
              <Button size="sm" onClick={onSave} disabled={!dirty || update.isPending}>
                {update.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Guardar diagnóstico
              </Button>
            </div>
          </>
        ) : value ? (
          <p className="text-sm text-foreground whitespace-pre-wrap">{value}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Sin diagnóstico general registrado.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
