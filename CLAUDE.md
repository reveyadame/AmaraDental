# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Idioma

Responder y escribir comentarios/UX en español (mx). Identificadores de código en inglés.

## Estructura del repo

Monorepo con dos apps independientes:

- [backend/](backend/) — Laravel 11 + PHP 8.3 + MySQL 8 (Docker). Scaffold completo: `app/`, `database/migrations/`, `routes/api.php`, etc. Cada dominio vive como modelo + controller + policy + resource en las carpetas planas de Laravel (no se usa la estructura `modules/` de `nwidart/laravel-modules` aunque el paquete está instalado).
- [frontend/](frontend/) — Vite + React 19 + TS estricto. Estructura feature-sliced en [frontend/src/features/](frontend/src/features/), un folder por dominio.

## Comandos

Frontend ([frontend/](frontend/)):

```bash
npm run dev      # Vite dev server en :5173
npm run build    # tsc -b && vite build  (typecheck obligado antes de build)
npm run lint     # ESLint flat config
npm run preview  # servir el build
npx vitest              # corre todos los tests
npx vitest path/to.test  # un solo test
```

Backend (ejecutar dentro del contenedor):

```bash
docker compose -f backend/docker-compose.yml up -d   # MySQL :3307 host → :3306 cont, app :8000
docker compose exec app php artisan migrate          # aplicar migraciones
docker compose exec app php artisan db:seed --class=RoleSeeder
docker compose exec app php artisan tinker
docker compose exec app php artisan route:list
docker compose exec app php artisan test                # corre Pest
docker compose exec app php artisan test --filter Foo   # un solo test
```

PHP/Composer local en Mac suele fallar con dyld; **usa el contenedor**. DB de dev local sin Docker: SQLite (`backend/database/*.sqlite`, ignorado).

## Arquitectura — qué es no-obvio

### Multi-tenant single-DB desde el día 1

Aunque hoy hay un solo cliente (`tenant_id = 1`), todo modelo de negocio usa el trait `BelongsToTenant` ([backend/app/Concerns/BelongsToTenant.php](backend/app/Concerns/BelongsToTenant.php)) con Global Scope que filtra por el tenant resuelto en el middleware `ResolveTenant`. La migración futura a SaaS resuelve por subdominio sin tocar queries.

Consecuencia dura: **toda lectura/escritura pasa por modelos Eloquent**. Nunca `DB::table(...)` crudo — eso brinca el Global Scope y filtra datos entre tenants. Si necesitas raw SQL, primero confirma que sea infraestructura cross-tenant (auth, branding público) o un seeder.

### Sistema de roles y permisos

Catálogo central en [backend/app/Support/Permissions.php](backend/app/Support/Permissions.php) con la lista de permisos y la matriz `rol → permisos[]`. **Modelo puramente basado en roles** (sin permisos directos): un usuario tiene N roles, sus permisos efectivos = unión de los permisos sembrados para esos roles.

Roles (ver [backend/app/Enums/Role.php](backend/app/Enums/Role.php)): `admin`, `agenda`, `pacientes`, `catalogos`, `caja`, `pago_comisiones`, `membresias`, `laboratorios`, `recalls`, `reportes`. Sin roles = sin acceso (deny-by-default).

`admin` recibe todos los permisos sembrados; además [AppServiceProvider::boot](backend/app/Providers/AppServiceProvider.php) declara `Gate::before` para que admin pase cualquier autorización aunque la policy regrese `false`.

**Toda acción de eliminar requiere admin**. Cada `Policy::delete()` regresa `$user->hasRole(Role::Admin->value)`. Esto incluye `destroy` en `ConsentsController` y `SpecialistsController`, y la validación de self-delete está en `UsersController::destroy` (porque `Gate::before` sobreescribiría una policy que retorne `false`).

Frontend espeja la matriz en [frontend/src/shared/auth/permissions.ts](frontend/src/shared/auth/permissions.ts) con `useAuth()` que expone `can`, `canAny`, `hasRole`, `isAdmin`. **Para gating fino usa `can(perm)` o `isAdmin`, NO `me.roles.includes(...)`**. Botones de eliminar siempre se gatean por `isAdmin`.

Tras tocar `Permissions::all()` o `roleMatrix()`, re-sembrar: `php artisan db:seed --class=RoleSeeder` — limpia permisos huérfanos, roles legacy y la tabla `model_has_permissions` (para garantizar que no queden permisos directos zombi).

### Especialistas NO son usuarios

`Specialist` es un catálogo independiente ([backend/app/Models/Specialist.php](backend/app/Models/Specialist.php)). No tiene email/password — no inicia sesión. Las FK en `appointments`, `prescriptions`, `charge_items`, `commission_payments`, `agenda_blocks`, `treatment_specialist_commissions` usan `specialist_id` (no `specialist_user_id`). Para asignar comisión a un especialista, lo eliges en un dropdown del formulario, no es un usuario operando el sistema.

### Caja global única por tenant

Solo puede haber UNA `cash_session` con `status = 'open'` por tenant a la vez. Cualquier usuario con `cash.operate` la opera y la cierra, sin importar quién la abrió. `user_id` registra quién la abrió; `closed_by_user_id` quién la cerró ([backend/database/migrations/2026_06_16_000000_make_cash_session_global.php](backend/database/migrations/2026_06_16_000000_make_cash_session_global.php)).

Toda búsqueda de "sesión abierta" en controllers (`CashExpensesController`, `ChargesController::store`/`addPayment`, `MembershipsController`, `CommissionPaymentsController`, `DashboardController`) filtra solo por `status = 'open'`, sin `user_id`.

**Movimientos solo se pueden eliminar/cancelar mientras la sesión de su corte está abierta**:
- `ChargePaymentsController::destroy` y `CashExpensesController::destroy` abortan si la sesión del movimiento está cerrada.
- `ChargesController::cancel` aborta si el cobro tiene pagos en alguna sesión cerrada.
- [CashMovementsPage](frontend/src/pages/CashMovementsPage.tsx) (vista admin consolidada de pagos + egresos con filtros por fecha) oculta botones cuando `cash_session_status === 'closed'` y muestra chip "Corte cerrado".

### Auth: Sanctum cookie-based para web, tokens para móvil

El cliente axios en [frontend/src/shared/api/client.ts](frontend/src/shared/api/client.ts) usa `withCredentials` + `withXSRFToken` y expone `ensureCsrf()` que llama a `/sanctum/csrf-cookie` **una vez** antes de cualquier petición autenticada (idempotente — no la llames en cada request). Cuando entre la app Flutter, esa usará tokens Sanctum (`Bearer`), no cookies.

Un 401 dispara `window.dispatchEvent('auth:unauthenticated')` — el router lo escucha y redirige a `/login`.

### White-label es requisito MVP, no fase 2

El theming por tenant inyecta un `<style id="tenant-theme">` con CSS variables (`--primary`, `--primary-foreground`, `--secondary`, `--sidebar-bg`, `--brand-accent`, `--font-sans`) — ver [frontend/src/shared/theme/ThemeProvider.tsx](frontend/src/shared/theme/ThemeProvider.tsx). El branding viene de `GET /api/branding`. Tipografía: catálogo en [frontend/src/shared/theme/fonts.ts](frontend/src/shared/theme/fonts.ts) (Google Fonts dinámicas + stack del sistema).

Si agregas colores, agrégalos como variables CSS, **no como literales Tailwind** — si no, el tenant no los puede sobreescribir.

### Frontend feature-sliced

- `app/` — `Providers.tsx`, `Router.tsx`, `AppShell.tsx`.
- `features/<modulo>/` — espejo flexible de dominios. Componentes, hooks de TanStack Query, schemas Zod del dominio.
- `pages/` — composición de features para rutas concretas (route → page → features).
- `shared/`:
  - `shared/ui/` — componentes shadcn/ui (alias `@/shared/ui`, ver [frontend/components.json](frontend/components.json)).
  - `shared/api/client.ts` — axios + sanctum.
  - `shared/api/query-client.ts` — QueryClient con retry que ignora 401/403/404.
  - `shared/lib/utils.ts` — `cn()` y `formatMXN()`.
  - `shared/theme/` — `ThemeProvider` y `fonts.ts`.
  - `shared/auth/permissions.ts` — `useAuth()`, labels de roles/permisos.

Alias TS: `@/*` → `./src/*`. Para agregar componentes shadcn: `npx shadcn@latest add <component>`.

### Sidebar gating por permisos

Cada item en `AppShell.tsx` declara `perms: Permission[]` (any-of). El filtro `allowed = (item) => !item.perms || canAny(...item.perms)` se aplica recursivamente. Items sin `perms` son visibles a cualquier usuario autenticado (ej. Inicio).

Si necesitas un item admin-only y no hay un permiso ya admin-exclusivo, usa `perms: ['users.manage']` o `['audit.view']` como proxy — esos solo los tiene admin en la matriz.

### Lectura básica de pacientes

Roles operativos (Caja, Agenda, Membresías, Laboratorios, Recalls) reciben `patients.read_basic` además de su permiso principal. Eso permite buscar y ver datos administrativos del paciente (identificación, contacto, saldo) sin acceder al expediente clínico, que requiere `clinical.view` / `clinical.manage`. `PatientPolicy::viewBasic` cubre esto; `PatientsController::index/show` autorizan vía esa puerta.

### Pagos sin CFDI

MVP no factura. Métodos: efectivo, tarjeta (terminal externa, solo se registra), transferencia, pagos parciales/crédito. El modelo `Payment` tiene `invoice_id` **nullable** desde la primera migración para meter PAC después sin migración destructiva. No se almacenan radiografías/imágenes en esta fase.

### Cumplimiento normativo (México)

- **NOM-004-SSA3-2012 (expediente clínico)** → módulo Patients/Historia Clínica.
- **NOM-024-SSA3-2012 (sistemas de información en salud)** → bitácora con `owen-it/laravel-auditing`.
- **NOM-013-SSA2-2015 (salud bucal)**.

Cualquier cambio que toque campos de expediente, consentimientos o auditoría debe respetar estas normas — no las saltes "para iterar más rápido".

## TypeScript

`strict` + `noUncheckedIndexedAccess` + `noUnusedLocals/Parameters` + `verbatimModuleSyntax` (ver [frontend/tsconfig.app.json](frontend/tsconfig.app.json)). `verbatimModuleSyntax` exige `import type` explícito para tipos.

Tipos del API se mantienen a mano en [frontend/src/shared/types/](frontend/src/shared/types/) — sincronizarlos cuando el backend cambia un Resource. Cuando el contrato se estabilice se puede generar con `openapi-typescript`.

## Testing

- Frontend: Vitest + jsdom + Testing Library. Setup en [frontend/src/test/setup.ts](frontend/src/test/setup.ts), config en [frontend/vite.config.ts](frontend/vite.config.ts).
- Backend: Pest con `php artisan test`.

## Hosting

VPS con Plesk + MySQL 8 + SMTP Plesk. No hay pipeline CI/CD aún; deploy es manual hoy.
