import { useEffect, useReducer } from 'react'
import { Loader2 } from 'lucide-react'
import { getPlatformToken } from '@/shared/api/platform-client'
import { usePlatformMe } from './hooks'
import { PlatformLoginPage } from './PlatformLoginPage'
import { PlatformShell } from './PlatformShell'
import { ClinicsPage } from './ClinicsPage'

/**
 * Raíz del panel de plataforma (super-admin). Auth aislada por token:
 * sin token o sesión inválida → login; con sesión válida → shell + clínicas.
 */
export function PlatformApp() {
  const me = usePlatformMe()
  const [, force] = useReducer((x: number) => x + 1, 0)

  // Un 401 en cualquier llamada de plataforma limpia el token y dispara esto.
  useEffect(() => {
    const handler = () => force()
    window.addEventListener('platform:unauthenticated', handler)
    return () => window.removeEventListener('platform:unauthenticated', handler)
  }, [])

  if (!getPlatformToken()) return <PlatformLoginPage />

  if (me.isPending) {
    return (
      <div className="min-h-screen grid place-items-center bg-muted/30">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (me.isError || !me.data) return <PlatformLoginPage />

  return (
    <PlatformShell admin={me.data}>
      <ClinicsPage />
    </PlatformShell>
  )
}
