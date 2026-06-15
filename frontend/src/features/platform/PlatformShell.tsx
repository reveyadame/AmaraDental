import type { ReactNode } from 'react'
import { LogOut } from 'lucide-react'
import { usePlatformLogout } from './hooks'
import { DEFAULT_BRAND_NAME } from '@/shared/lib/brand'
import { Button } from '@/shared/ui/button'
import type { PlatformAdmin } from './api'

export function PlatformShell({ admin, children }: { admin: PlatformAdmin; children: ReactNode }) {
  const logout = usePlatformLogout()

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <header className="h-16 border-b bg-background">
        <div className="h-full max-w-6xl mx-auto flex items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
              AD
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold">{DEFAULT_BRAND_NAME}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Plataforma</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">{admin.name}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              <LogOut className="size-4" /> Salir
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  )
}
