import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Building2, CreditCard, LayoutDashboard, LogOut, Menu, ShieldCheck } from 'lucide-react'
import { usePlatformLogout } from './hooks'
import { AmaraIcon } from '@/shared/brand/AmaraLogo'
import { DEFAULT_BRAND_NAME } from '@/shared/lib/brand'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/shared/ui/sheet'
import type { PlatformAdmin } from './api'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/clinicas', label: 'Clínicas', icon: Building2, end: false },
  { to: '/planes', label: 'Planes', icon: CreditCard, end: false },
  { to: '/administradores', label: 'Administradores', icon: ShieldCheck, end: false },
] as const

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-1 px-3">
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )
          }
        >
          <item.icon className="size-4" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-5 py-5">
      <AmaraIcon className="size-9 text-brand-teal" />
      <div className="leading-tight">
        <p className="text-sm font-semibold text-brand-navy">{DEFAULT_BRAND_NAME}</p>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Plataforma</p>
      </div>
    </div>
  )
}

export function PlatformShell({ admin }: { admin: PlatformAdmin }) {
  const logout = usePlatformLogout()
  const [mobileOpen, setMobileOpen] = useState(false)

  const footer = (
    <div className="border-t p-3">
      <div className="flex items-center gap-3 rounded-lg px-2 py-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold uppercase">
          {admin.name.slice(0, 2)}
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-medium">{admin.name}</p>
          <p className="truncate text-xs text-muted-foreground">{admin.email}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground"
          title="Cerrar sesión"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar fijo (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-background md:flex">
        <Brand />
        <NavItems />
        {footer}
      </aside>

      {/* Topbar móvil */}
      <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background px-4 md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex h-full flex-col">
              <Brand />
              <NavItems onNavigate={() => setMobileOpen(false)} />
              {footer}
            </div>
          </SheetContent>
        </Sheet>
        <span className="flex items-center gap-2">
          <AmaraIcon className="size-6 text-brand-teal" />
          <span className="text-sm font-semibold text-brand-navy">{DEFAULT_BRAND_NAME}</span>
        </span>
      </header>

      {/* Contenido */}
      <main className="md:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
