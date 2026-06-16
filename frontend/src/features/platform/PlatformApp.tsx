import { useEffect, useReducer } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { getPlatformToken } from '@/shared/api/platform-client'
import { usePlatformMe } from './hooks'
import { PlatformLoginPage } from './PlatformLoginPage'
import { PlatformShell } from './PlatformShell'
import { PlatformDashboardPage } from './PlatformDashboardPage'
import { ClinicsPage } from './ClinicsPage'
import { PlansPage } from './PlansPage'
import { AdminsPage } from './AdminsPage'

/**
 * Raíz del panel de plataforma (super-admin). Auth aislada por token:
 * sin token o sesión inválida → login; con sesión válida → shell + secciones.
 * La navegación es por rutas internas (Dashboard / Clínicas / Planes / Admins).
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
    <Routes>
      <Route element={<PlatformShell admin={me.data} />}>
        <Route index element={<PlatformDashboardPage />} />
        <Route path="clinicas" element={<ClinicsPage />} />
        <Route path="planes" element={<PlansPage />} />
        <Route path="administradores" element={<AdminsPage adminId={me.data.id} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
