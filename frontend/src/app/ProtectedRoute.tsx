import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { useMe } from '@/features/auth/hooks'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { data: me, isPending } = useMe()

  if (isPending) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="min-h-screen grid place-items-center bg-muted/30"
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-6 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Cargando…</p>
        </div>
      </div>
    )
  }

  if (!me) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <>{children}</>
}
