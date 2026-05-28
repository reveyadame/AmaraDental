import { useState } from 'react'
import { toast } from 'sonner'
import { Check, Copy, Loader2, RefreshCw } from 'lucide-react'
import { useIcsFeedToken, useRegenerateIcsFeedToken } from './hooks'
import { useMe } from '@/features/auth/hooks'
import { useConfirm } from '@/shared/ui/confirm'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Skeleton } from '@/shared/ui/skeleton'

export function IcsFeedCard() {
  const { data: me } = useMe()
  const token = useIcsFeedToken()
  const regen = useRegenerateIcsFeedToken()
  const confirm = useConfirm()
  const [copied, setCopied] = useState(false)

  // Solo tiene sentido para usuarios que gestionan la agenda.
  if (!me?.permissions.includes('appointments.manage')) return null

  const generate = () =>
    regen.mutate(undefined, {
      onSuccess: () => toast.success('Token regenerado'),
      onError: () => toast.error('No fue posible regenerar el token'),
    })

  const copy = async () => {
    if (!token.data?.url) return
    await navigator.clipboard.writeText(token.data.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sincronizar con Google Calendar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {token.isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-9 w-44" />
          </div>
        ) : !token.data ? (
          <>
            <p className="text-sm text-muted-foreground">
              Genera tu URL privada para suscribirla en Google Calendar. Mientras tengas tu
              calendario activo, podrás ver tus citas en Gmail aunque CIO Dent no esté
              disponible.
            </p>
            <Button onClick={generate} disabled={regen.isPending}>
              {regen.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Generar URL del calendario
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Tu calendario privado en formato iCal. <strong>No la compartas:</strong> cualquiera
              con esta URL puede ver tus citas.
            </p>
            <div className="flex gap-2">
              <Input value={token.data.url} readOnly className="font-mono text-xs" />
              <Button variant="outline" onClick={copy}>
                {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
            </div>

            <details className="text-sm">
              <summary className="cursor-pointer font-medium text-foreground">
                ¿Cómo la conecto a Google Calendar?
              </summary>
              <ol className="mt-2 space-y-1 list-decimal list-inside text-muted-foreground">
                <li>Abre Google Calendar en tu computadora.</li>
                <li>
                  En el panel izquierdo, junto a <strong>Otros calendarios</strong>, da clic en
                  <strong> + Añadir otros calendarios</strong>.
                </li>
                <li>
                  Elige <strong>Desde URL</strong>.
                </li>
                <li>Pega la URL de arriba y haz clic en <strong>Añadir calendario</strong>.</li>
                <li>
                  Google revisará la URL automáticamente cada algunas horas. Tus citas
                  aparecerán en tu Gmail.
                </li>
              </ol>
            </details>

            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                {token.data.generated_at
                  ? `Generado ${new Date(token.data.generated_at).toLocaleString('es-MX')}`
                  : ''}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  const ok = await confirm({
                    title: '¿Regenerar token?',
                    description:
                      'La URL anterior dejará de funcionar y tendrás que volver a suscribirte en Google Calendar.',
                    confirmText: 'Regenerar',
                    variant: 'destructive',
                  })
                  if (!ok) return
                  generate()
                }}
                disabled={regen.isPending}
              >
                {regen.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                Regenerar
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
