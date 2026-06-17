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

---

## 10. Billing con Stripe (cobro de la suscripción)

La **clínica le paga a Amara Dental** vía Stripe (Laravel Cashier). Self-service:
el admin de la clínica registra su tarjeta y se cobra automático cada ciclo. Al
dar de alta una clínica, arranca una **prueba gratis de 14 días**; al terminar,
debe tener método de pago o se restringe el acceso (HTTP 402).

### 10.1 En el dashboard de Stripe

1. Crea **3 Productos** (Esencial, Crecimiento, Premium), cada uno con un
   **Price recurrente mensual en MXN**. Copia los `price_...` de cada uno.
2. Crea un **endpoint de webhook**: `https://amaradental.mx/stripe/webhook`,
   suscrito a los eventos de Cashier (subscription created/updated/deleted,
   invoice payment succeeded/failed, customer updated). Copia el
   **signing secret** (`whsec_...`).

### 10.2 Variables de entorno (`.env`)

```dotenv
# Empieza en modo TEST (sk_test_/pk_test_) y prueba todo antes de ir a live.
STRIPE_KEY=pk_test_xxx
STRIPE_SECRET=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
CASHIER_CURRENCY=mxn
CASHIER_CURRENCY_LOCALE=es_MX

# Mapea cada plan a su Price de Stripe (de los que copiaste arriba).
STRIPE_PRICE_ESENCIAL=price_xxx
STRIPE_PRICE_CRECIMIENTO=price_xxx
STRIPE_PRICE_PREMIUM=price_xxx
```

### 10.3 Después de configurar

```bash
# Re-siembra los planes para que tomen los price_id del env (idempotente).
php artisan db:seed --class=PlanSeeder --force
```

### 10.4 Cómo funciona el acceso

- **Prueba (14 días)** o **suscripción activa** → la clínica opera normal.
- **Prueba vencida sin suscripción** → las rutas operativas responden **402**;
  el frontend muestra un banner "Tu suscripción no está activa · Ir a pagar".
- El admin va a **Configuración → Plan** → "Agregar método de pago" → Stripe
  Checkout → vuelve activo. "Administrar pago" abre el portal de Stripe.
- Clínicas **grandfathered** (sin `stripe_id` ni `trial_ends_at`, ej. el cliente
  actual migrado sin trial) cuentan como activas — no se les cobra ni restringe.

### 10.5 Pruebas en modo test

- Tarjeta de prueba Stripe: `4242 4242 4242 4242`, cualquier fecha futura/CVC.
- Para simular eventos: `stripe listen --forward-to amaradental.mx/stripe/webhook`
  (Stripe CLI) o dispara eventos desde el dashboard.

## 11. Landing pública (apex `amaradental.mx`) — proyecto aparte

Desde la separación de concerns, la **landing** vive en `landing/` (Vite+React
propio), NO en `frontend/`. Esto la mantiene ligera (~150 KB gzip vs ~440 KB de
la app) y permite desplegarla independiente.

**Qué sirve cada sitio en Plesk:**

| Sitio (vhost) | Document root | Contenido |
|---|---|---|
| `amaradental.mx` + `www` (apex) | `landing/dist` | Landing pública + `/registro` |
| `*.amaradental.mx` (comodín) | `frontend/dist` | App de clínica + `admin.` (panel) |

> El apex es un sitio **distinto** al comodín en Plesk. El comodín NO cubre el
> apex desnudo. El cert comodín emitido desde el dominio principal sí suele
> incluir `amaradental.mx` además de `*.amaradental.mx`.

**Build de la landing:**

```bash
cd landing
npm install
npm run build   # usa landing/.env.production (VITE_API_URL + VITE_CENTRAL_DOMAIN)
# sube landing/dist al document root del apex (incluye .htaccess de SPA fallback)
```

**CORS:** la landing (apex) llama a `https://api.amaradental.mx/api/public/*`.
El patrón `CORS_ALLOWED_ORIGIN_PATTERNS` del backend ya cubre el apex
(`([a-z0-9-]+\.)?amaradental\.mx`). Las rutas `api/public/*` están exentas de
tenant y de CSRF (ver `ResolveTenant` y `bootstrap/app.php`).

**Dev local:** `cd landing && npm run dev` (puerto 5174). Para que llame al
backend local agrega `http://localhost:5174` (o `lvh.me:5174`) a
`CORS_ALLOWED_ORIGINS`/patterns del backend de dev.

## 12. Despliegue automático de los frontends (CI)

Tres workflows en `.github/workflows/` sincronizan cada app a una rama que el
servidor consume (mismo patrón que `deploy-backend`):

| App | Workflow | Dispara con cambios en | Rama de salida | Document root del vhost |
|---|---|---|---|---|
| Backend | `sync-deploy-backend.yml` | `backend/**` | `deploy-backend` | sitio `api.amaradental.mx` |
| App (privada) | `deploy-frontend.yml` | `frontend/**` | `deploy-frontend` | vhost comodín `*.amaradental.mx` |
| Landing (pública) | `deploy-landing.yml` | `landing/**` | `deploy-landing` | vhost apex `amaradental.mx` + `www` |

Los dos workflows de frontend **compilan en CI** (Node 22, `npm ci && npm run
build`, usando el `.env.production` de cada app) y publican el `dist/` resultante
en su rama de despliegue. Así el servidor NO necesita Node ni compilar nada.

**Primera vez:** corre cada workflow manualmente desde GitHub → *Actions* →
(workflow) → *Run workflow*, para que se creen las ramas `deploy-frontend` y
`deploy-landing`.

**En el servidor**, apunta cada document root a un clone de su rama:

```bash
# Apex (landing):
git clone -b deploy-landing  <repo-url>  /ruta/al/docroot-apex
# Comodín (app):
git clone -b deploy-frontend <repo-url>  /ruta/al/docroot-comodin
```

Para actualizar en cada deploy (a prueba de rebases del CI):

```bash
git -C /ruta/al/docroot fetch --depth 1 origin <rama>
git -C /ruta/al/docroot reset --hard origin/<rama>
```

> Alternativa sin terminal: usa la integración **Git de Plesk** apuntando el
> dominio a la rama (`deploy-landing` / `deploy-frontend`) con auto-deploy por
> webhook. El repo es privado → agrega una deploy key.

A partir de ahí, cada `git push origin main` que toque `frontend/**` o
`landing/**` recompila y actualiza la rama correspondiente sola; en el servidor
solo haces `git pull`/`reset --hard` (o lo automatizas con la Git de Plesk).
