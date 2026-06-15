# Despliegue SaaS multi-tenant (Amara Dental)

Guía para servir varias clínicas, cada una en su **subdominio**
(`clinicax.amaradental.mx`). El backend resuelve el tenant por el `Host`; el
frontend (un solo build) se sirve en todos los subdominios y habla con su
propio backend en el **mismo origen**.

---

## 0. Arquitectura en una imagen

```
clinica1.amaradental.mx ─┐
clinica2.amaradental.mx ─┼─► (vhost comodín) ─► SPA (mismo build) + Laravel API
admin.amaradental.mx    ─┘                         │
amaradental.mx (apex)   ─┘                         └─ ResolveTenant: Host → tenant
```

- **Un solo build del frontend** sirve para todas las clínicas (el branding es
  per-tenant en runtime).
- **Same-origin**: el SPA en `clinica1.amaradental.mx` pega a
  `clinica1.amaradental.mx/api/*` → sin CORS, las cookies funcionan solas.
- **Super-admin** vive en `admin.amaradental.mx/plataforma` (subdominio reservado
  → cae al tenant por defecto; las rutas de plataforma son cross-tenant).

---

## 1. DNS

Un registro **comodín** apuntando al VPS:

```
*.amaradental.mx   A   <IP-del-VPS>
amaradental.mx     A   <IP-del-VPS>
```

Con esto, cualquier `clinicax.amaradental.mx` ya resuelve — **no hay que tocar
DNS al dar de alta cada clínica**.

## 2. SSL

Certificado **comodín** `*.amaradental.mx` (+ el apex). En Plesk: Let's Encrypt
con la opción de "wildcard" (requiere validación DNS-01) o sube tu propio
certificado comodín.

## 3. Plesk / servidor web

Configura un **vhost comodín** para `*.amaradental.mx` que:
- Sirva el build del frontend (`frontend/dist`) como sitio estático con
  fallback SPA (todas las rutas que no sean `/api`, `/sanctum`, archivos →
  `index.html`).
- Enrute `/api/*` y `/sanctum/*` al backend Laravel (`backend/public`).

> En Plesk esto suele ser un dominio comodín o un subscription con
> "wildcard subdomain" habilitado, apuntando el document root al `dist` y un
> proxy/alias de `/api` al PHP de Laravel.

## 4. Variables de entorno del backend (`.env` de producción)

```dotenv
APP_URL=https://amaradental.mx
APP_ENV=production
APP_DEBUG=false

# ── Multi-tenant ──────────────────────────────────────────────
# Activa la resolución por subdominio. SIN esto, todo cae al tenant por defecto.
TENANCY_CENTRAL_DOMAINS=amaradental.mx
TENANCY_DEFAULT_TENANT_ID=1

# ── Sanctum / sesión ──────────────────────────────────────────
# Acepta sesión stateful en el apex y en TODOS los subdominios de clínica.
SANCTUM_STATEFUL_DOMAINS=amaradental.mx,*.amaradental.mx

# ⚠️ SEGURIDAD: DEJAR VACÍO. Cookie host-only = sesión AISLADA por subdominio.
# Si pones SESSION_DOMAIN=.amaradental.mx, la sesión se COMPARTIRÍA entre
# clínicas (fuga cross-tenant). No lo hagas.
SESSION_DOMAIN=
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax
```

**Defensa en profundidad:** aunque por error una sesión cruzara de subdominio,
el middleware `EnsureTenantMatchesUser` rechaza (403) si el usuario autenticado
no pertenece al tenant resuelto. Las 3 identidades (staff/paciente/plataforma)
están separadas por guards.

## 5. Build del frontend

```bash
cd frontend
npm ci
npm run build      # NO definas VITE_API_URL → usa el mismo origen (subdominio-aware)
```

El `dist/` resultante se sirve en todos los subdominios.

> Solo define `VITE_API_URL` si el API vive en otro origen distinto al SPA
> (entonces además habría que configurar CORS con `supports_credentials`).

---

## 6. Migración a producción (checklist de pre-vuelo)

> La base de producción tiene datos reales (expediente clínico + dinero).
> **No improvises.**

1. **Backup completo** de la base de producción.
2. **Ensaya las migraciones en una COPIA** de producción primero.
3. **Gotcha del squash** (ver CLAUDE.md): si la base es previa al squash y la
   tabla `migrations` no tiene registrado `0001_01_01_000000_create_schema`,
   regístralo a mano ANTES de migrar para que no intente recrear tablas:
   ```sql
   INSERT INTO migrations (migration, batch)
   VALUES ('0001_01_01_000000_create_schema', 1);
   ```
   **Nunca** `migrate:fresh` / `migrate:refresh` en producción.
4. **Migrar** (aditivas e idempotentes):
   ```bash
   php artisan migrate --force
   ```
5. **Sembrar planes** (idempotente):
   ```bash
   php artisan db:seed --class=PlanSeeder --force
   ```
6. **Crear el super-admin** de plataforma:
   ```bash
   php artisan platform:create-admin "Tu Nombre" --email=admin@amaradental.mx
   ```
7. **El cliente actual**: decide su plan. Si lo dejas sin `plan_id`, queda
   *grandfathered* (ilimitado + app). O asígnale un plan desde
   `admin.amaradental.mx/plataforma`.
8. **Cachés**: `php artisan config:clear` (y si cacheas en prod, re-cachear
   DESPUÉS de fijar el `.env`).

## 7. Decisión de producto (antes de migrar)

- **Branding visible**: el login y el footer muestran **"Amara Dental"** (la
  plataforma). Tu cliente actual lo verá. Confirma que está bien mostrárselo ya.

## 8. Smoke test manual (post-deploy, en la copia o con cuidado)

- Login de clínica → caja/cobros, agenda, expediente, impresión de ticket.
- `admin.amaradental.mx/plataforma` → crear una clínica de prueba con plan →
  entrar a su subdominio y validar branding + login.
- Tope de pacientes y gating de app según el plan asignado.

---

## 9. Alta de una clínica nueva (ya en producción)

1. Entra a `admin.amaradental.mx/plataforma`.
2. "Nueva clínica" → nombre, slug, email del admin, **plan**. Se muestra la
   contraseña del admin una sola vez.
3. La clínica queda disponible **de inmediato** en `slug.amaradental.mx`
   (el DNS comodín y el vhost ya cubren cualquier subdominio).
4. (Opcional) el admin de la clínica entra a Configuración y personaliza su
   branding (logo, colores, datos fiscales).

Sin tocar DNS, SSL ni servidor por cada clínica.
