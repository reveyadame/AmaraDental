import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  ArrowLeftRight,
  BellRing,
  BookOpen,
  CalendarDays,
  ChevronDown,
  CreditCard,
  FileBarChart,
  FileSignature,
  HandCoins,
  History,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Microscope,
  Plus,
  ScrollText,
  Settings,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserPlus,
  Users,
} from 'lucide-react'
import { useBranding } from '@/shared/theme/ThemeProvider'
import { useLogout, useMe } from '@/features/auth/hooks'
import { useAuth } from '@/shared/auth/permissions'
import type { Permission } from '@/shared/types/api'
import { NotificationsMenu } from '@/features/notifications/NotificationsMenu'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { Separator } from '@/shared/ui/separator'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/shared/ui/sheet'
import { cn } from '@/shared/lib/utils'

/**
 * Un NavItem puede ser:
 *  - Una entrada directa con `to` (navega a esa ruta).
 *  - Un grupo con `children`: el header se vuelve colapsable. El propio
 *    grupo no navega, pero se auto-expande cuando estás en una de sus rutas
 *    hijas.
 */
interface NavItem {
  label: string
  icon: React.ComponentType<{ className?: string }>
  to?: string
  /** Si se define, el ítem solo se muestra si el usuario tiene AL MENOS uno de estos permisos. */
  perms?: Permission[]
  soon?: boolean
  /** Activa también con sub-rutas que empiecen con `to` + '/'. */
  matchPrefix?: boolean
  children?: NavItem[]
}

const NAV: NavItem[] = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays, perms: ['appointments.manage'] },
  {
    to: '/pacientes',
    label: 'Pacientes',
    icon: Users,
    matchPrefix: true,
    perms: ['patients.manage', 'patients.read_basic'],
  },
  {
    label: 'Catálogo',
    icon: BookOpen,
    children: [
      {
        to: '/tratamientos',
        label: 'Tratamientos',
        icon: Stethoscope,
        perms: ['catalogs.manage'],
      },
      {
        to: '/especialistas',
        label: 'Especialistas',
        icon: UserPlus,
        perms: ['catalogs.manage'],
      },
      {
        to: '/recetas/plantillas',
        label: 'Plantillas Rx',
        icon: ScrollText,
        perms: ['prescriptions.create', 'catalogs.manage'],
      },
      {
        to: '/consentimientos/plantillas',
        label: 'Plantillas consentimiento',
        icon: FileSignature,
        // Catálogo del rol Catálogos (y admin).
        perms: ['catalogs.manage'],
      },
    ],
  },
  {
    label: 'Caja',
    icon: CreditCard,
    children: [
      { to: '/caja', label: 'Resumen del día', icon: LayoutDashboard, perms: ['cash.operate'] },
      { to: '/caja/nuevo', label: 'Nuevo cobro', icon: Plus, perms: ['charges.create'] },
      {
        to: '/caja/saldos',
        label: 'Saldos por cobrar',
        icon: HandCoins,
        perms: ['cash.operate', 'charges.create'],
      },
      {
        to: '/caja/cortes',
        label: 'Historial de cortes',
        icon: History,
        perms: ['cash.operate', 'reports.view'],
      },
      {
        to: '/caja/movimientos',
        label: 'Movimientos',
        icon: ArrowLeftRight,
        // Disponible para el rol Caja; eliminar movimientos sigue siendo admin-only.
        perms: ['cash.operate'],
      },
    ],
  },
  {
    to: '/comisiones',
    label: 'Pago de comisiones',
    icon: HandCoins,
    perms: ['commissions.manage'],
  },
  {
    to: '/membresias',
    label: 'Membresías',
    icon: Sparkles,
    matchPrefix: true,
    perms: ['memberships.manage'],
  },
  {
    to: '/laboratorios',
    label: 'Laboratorios',
    icon: Microscope,
    perms: ['labs.manage'],
  },
  {
    to: '/recalls',
    label: 'Recalls',
    icon: BellRing,
    perms: ['recalls.manage'],
  },
  { to: '/reportes', label: 'Reportes', icon: FileBarChart, perms: ['reports.view'] },
]

const ADMIN_NAV: NavItem[] = [
  { to: '/usuarios', label: 'Usuarios', icon: UserPlus, perms: ['users.manage'] },
  { to: '/bitacora', label: 'Bitácora', icon: ShieldCheck, perms: ['audit.view'] },
  { to: '/configuracion', label: 'Configuración', icon: Settings, perms: ['branding.manage'] },
]

function initials(name: string | undefined): string {
  if (!name) return '··'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '··'
}

function pathMatches(pathname: string, to: string, matchPrefix?: boolean): boolean {
  if (pathname === to) return true
  // Exacto para "/", siempre. Para otros, opcional prefix.
  if (to === '/') return false
  if (matchPrefix) return pathname.startsWith(to + '/')
  // Por defecto, también considera activa una subruta directa para evitar que
  // /caja/nuevo no destaque "Caja". Pero cuando un grupo tiene un hijo en /caja
  // y otro en /caja/nuevo, el más específico gana en CSS por orden — los
  // hijos se renderizan en orden, NavLink end={false} resuelve ambos. Para
  // que sólo el más específico marque activo, pedimos coincidencia exacta
  // por default cuando es un link directo (matchPrefix===undefined).
  return false
}

function SidebarLink({
  item,
  allowed,
  onNavigate,
  nested = false,
}: {
  item: NavItem
  allowed: (item: NavItem) => boolean
  onNavigate?: () => void
  nested?: boolean
}) {
  if (!allowed(item)) return null
  if (!item.to) return null
  const Icon = item.icon
  const disabled = item.soon

  if (disabled) {
    return (
      <div
        className={cn(
          'group flex items-center gap-3 rounded-md py-2 text-sm text-[var(--sidebar-fg-muted)] opacity-70 cursor-not-allowed',
          nested ? 'px-2' : 'px-3',
        )}
        title="Próximamente"
      >
        <Icon className={nested ? 'size-3.5' : 'size-4'} />
        <span className="flex-1">{item.label}</span>
        <span className="text-[10px] uppercase tracking-wide opacity-70">próx.</span>
      </div>
    )
  }

  return (
    <NavLink
      to={item.to}
      end={!item.matchPrefix}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-md transition-colors',
          nested ? 'pl-3 pr-2 py-1.5 text-[13px]' : 'px-3 py-2 text-sm font-medium',
          isActive
            ? 'bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-fg)] font-medium'
            : 'bg-[var(--sidebar-item-bg)] text-[var(--sidebar-item-fg)] hover:bg-[var(--sidebar-item-hover-bg)] hover:text-[var(--sidebar-item-hover-fg)]',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && !nested ? (
            <span
              className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-[var(--sidebar-active-fg)]"
              aria-hidden
            />
          ) : null}
          <Icon className={nested ? 'size-3.5' : 'size-4'} />
          <span>{item.label}</span>
        </>
      )}
    </NavLink>
  )
}

function SidebarGroup({
  item,
  allowed,
  onNavigate,
}: {
  item: NavItem
  allowed: (item: NavItem) => boolean
  onNavigate?: () => void
}) {
  const location = useLocation()
  if (!allowed(item)) return null

  const visibleChildren = (item.children ?? []).filter(allowed)
  if (visibleChildren.length === 0) return null

  const anyChildActive = visibleChildren.some(
    (c) => c.to && pathMatches(location.pathname, c.to, c.matchPrefix ?? true),
  )

  const [open, setOpen] = useState<boolean>(anyChildActive)

  // Si el usuario navega a una ruta hija (por ejemplo desde otro sitio), expande.
  useEffect(() => {
    if (anyChildActive && !open) setOpen(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anyChildActive])

  const Icon = item.icon

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'w-full group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          anyChildActive
            ? 'text-[var(--sidebar-fg)]'
            : 'text-[var(--sidebar-item-fg)] hover:bg-[var(--sidebar-item-hover-bg)] hover:text-[var(--sidebar-item-hover-fg)]',
        )}
        aria-expanded={open}
      >
        <Icon className="size-4" />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown
          className={cn(
            'size-3.5 transition-transform opacity-60',
            open ? '' : '-rotate-90',
          )}
        />
      </button>
      {open ? (
        <div className="ml-4 pl-3 border-l border-current/15 space-y-0.5">
          {visibleChildren.map((c) =>
            c.children?.length ? (
              <SidebarGroup
                key={c.label}
                item={c}
                allowed={allowed}
                onNavigate={onNavigate}
              />
            ) : (
              <SidebarLink
                key={c.to ?? c.label}
                item={c}
                allowed={allowed}
                onNavigate={onNavigate}
                nested
              />
            ),
          )}
        </div>
      ) : null}
    </div>
  )
}

function NavSection({
  items,
  allowed,
  onNavigate,
}: {
  items: NavItem[]
  allowed: (item: NavItem) => boolean
  onNavigate?: () => void
}) {
  return (
    <div className="space-y-0.5">
      {items.map((item) =>
        item.children?.length ? (
          <SidebarGroup
            key={item.label}
            item={item}
            allowed={allowed}
            onNavigate={onNavigate}
          />
        ) : (
          <SidebarLink
            key={item.to ?? item.label}
            item={item}
            allowed={allowed}
            onNavigate={onNavigate}
          />
        ),
      )}
    </div>
  )
}

function SidebarContent({
  brand,
  logoUrl,
  allowed,
  isAdmin,
  onNavigate,
}: {
  brand: string
  logoUrl: string | null | undefined
  allowed: (item: NavItem) => boolean
  isAdmin: boolean
  onNavigate?: () => void
}) {
  return (
    <div
      className="flex h-full flex-col"
      style={{ background: 'var(--sidebar-bg)', color: 'var(--sidebar-fg)' }}
    >
      <div className="flex h-16 items-center gap-2 border-b border-current/10 px-5">
        {logoUrl ? (
          <img src={logoUrl} alt="" className="h-7 w-auto" />
        ) : (
          <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground text-xs font-semibold">
            {initials(brand).slice(0, 2)}
          </span>
        )}
        <div className="leading-tight">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--sidebar-fg)' }}>
            {brand}
          </p>
          <p
            className="text-[10px] uppercase tracking-wide"
            style={{ color: 'var(--sidebar-fg-muted)' }}
          >
            CIO Dent
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p
          className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide"
          style={{ color: 'var(--sidebar-fg-muted)' }}
        >
          Clínica
        </p>
        <NavSection items={NAV} allowed={allowed} onNavigate={onNavigate} />

        {isAdmin ? (
          <>
            <Separator className="my-3 opacity-30" />
            <p
              className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide"
              style={{ color: 'var(--sidebar-fg-muted)' }}
            >
              Administración
            </p>
            <NavSection items={ADMIN_NAV} allowed={allowed} onNavigate={onNavigate} />
          </>
        ) : null}
      </nav>
    </div>
  )
}

function HeaderUserMenu({
  me,
  onLogout,
}: {
  me: { name: string; email: string; roles: string[] } | null | undefined
  onLogout: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-md p-1 pr-2 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          aria-label="Menú de usuario"
        >
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {initials(me?.name)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:block text-left leading-tight text-foreground">
            <span className="block text-sm font-medium max-w-[140px] truncate">
              {me?.name}
            </span>
            <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
              {me?.roles.includes('admin') ? 'Administrador' : 'Operador'}
            </span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{me?.name}</DropdownMenuLabel>
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal -mt-1">
          {me?.email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="text-destructive">
          <LogOut className="size-4 mr-2" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const { branding } = useBranding()
  const { data: me } = useMe()
  const logout = useLogout()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const { isAdmin, canAny } = useAuth()
  const allowed = (item: NavItem) => !item.perms || canAny(...item.perms)
  const brand = branding?.brand_name ?? 'CIO Dent'

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const crumb = (() => {
    if (location.pathname === '/') return 'Inicio'
    const seg = location.pathname.split('/').filter(Boolean)[0] ?? ''
    return seg.charAt(0).toUpperCase() + seg.slice(1)
  })()

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden md:flex w-64 flex-col border-r border-black/10 dark:border-white/10 shrink-0">
        <SidebarContent
          brand={brand}
          logoUrl={branding?.logo_url}
          allowed={allowed}
          isAdmin={isAdmin}
        />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="h-16 border-b border-black/10 dark:border-white/10 sticky top-0 z-10 bg-background text-foreground"
        >
          <div className="h-full flex items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden -ml-2 text-foreground hover:bg-accent"
                  >
                    <Menu className="size-5" />
                    <span className="sr-only">Abrir menú</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                  <SheetTitle className="sr-only">Navegación</SheetTitle>
                  <SidebarContent
                    brand={brand}
                    logoUrl={branding?.logo_url}
                    allowed={allowed}
                    isAdmin={isAdmin}
                    onNavigate={() => setMobileOpen(false)}
                  />
                </SheetContent>
              </Sheet>
              <div className="flex items-center gap-2 text-sm min-w-0 text-muted-foreground">
                <Link
                  to="/"
                  className="truncate hidden sm:inline hover:text-foreground transition-colors"
                >
                  {brand}
                </Link>
                <span className="hidden sm:inline">/</span>
                <span className="font-medium truncate text-foreground">
                  {crumb}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <NotificationsMenu />
              <HeaderUserMenu me={me ?? undefined} onLogout={() => logout.mutate()} />
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
