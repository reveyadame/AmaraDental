# Plan de Despliegue — CIO Dent

**Infraestructura destino:** VPS con Plesk + MySQL 8 + SMTP Plesk  
**Backend:** `api.ciodent.mx` — Laravel 11 / PHP 8.3  
**Frontend:** `app.ciodent.mx` — React 19 / Vite (SPA estática)  
**Herramienta principal:** Plesk Laravel Toolkit (extensión gratuita)

---

## Índice

1. [Prerrequisitos](#1-prerrequisitos)
2. [DNS y subdominios](#2-dns-y-subdominios)
3. [Cambios de código antes del primer deploy](#3-cambios-de-código-antes-del-primer-deploy)
4. [Instalar Laravel Toolkit en Plesk](#4-instalar-laravel-toolkit-en-plesk)
5. [Backend — api.ciodent.mx](#5-backend--apiciodentmx)
6. [Frontend — app.ciodent.mx](#6-frontend--appciodentmx)
7. [Verificación post-despliegue](#7-verificación-post-despliegue)
8. [Checklist final](#8-checklist-final)
9. [Despliegues posteriores (rollout)](#9-despliegues-posteriores-rollout)

---

## 1. Prerrequisitos

### En el VPS (verificar antes de empezar)

| Requisito | Versión mínima | Cómo verificar |
|-----------|---------------|----------------|
| PHP | 8.3 | Plesk → PHP Settings |
| MySQL | 8.0 | Plesk → Databases |
| Extensión Git (Plesk) | cualquiera | Plesk → Extensions → instalada |
| Extensión Laravel Toolkit (Plesk) | 1.x | Plesk → Extensions → instalada |

### Extensiones PHP requeridas

Verificar en Plesk → `api.ciodent.mx` → **PHP Settings**:

```
pdo_mysql   mbstring    bcmath      intl
zip         gd          exif        opcache
xml         curl        tokenizer   ctype
fileinfo    openssl
```

### Accesos necesarios

- Acceso al panel Plesk con permisos para crear subdominios y bases de datos
- URL del repositorio Git (GitHub, GitLab, etc.) con acceso de lectura desde el VPS
- Credenciales del panel DNS del dominio `ciodent.mx`

---

## 2. DNS y subdominios

### 2.1 Registros DNS

Agregar en el proveedor DNS (o en Plesk si gestiona el DNS de `ciodent.mx`):

```
api.ciodent.mx   A   <IP del VPS>   TTL 3600
app.ciodent.mx   A   <IP del VPS>   TTL 3600
```

### 2.2 Crear subdominios en Plesk

1. Plesk → **Websites & Domains** → **Add Subdomain**
2. Crear `api` bajo `ciodent.mx`
3. Crear `app` bajo `ciodent.mx`

### 2.3 SSL/TLS — Let's Encrypt

Para **cada subdominio**:

1. Seleccionar subdominio → **SSL/TLS Certificates**
2. Instalar con **Let's Encrypt**
3. Activar **Force HTTPS redirect**

Hacer esto antes de desplegar código; Plesk configura nginx/Apache automáticamente.

---

## 3. Cambios de código antes del primer deploy

Estos dos cambios deben hacerse en el repo local, comitearse y subirse **antes** de conectar el toolkit.

### 3.1 CORS dinámico (backend/config/cors.php)

Los orígenes están hardcodeados. Cambiar para leer del entorno:

```php
// backend/config/cors.php
'allowed_origins' => array_filter(
    explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173'))
),
```

### 3.2 Trust Proxies para Plesk (backend/bootstrap/app.php)

Plesk coloca nginx como reverse proxy frente a PHP-FPM. Sin esto, `$request->secure()` devuelve `false` y Sanctum rechaza las cookies en HTTPS.

Agregar `$middleware->trustProxies(at: '*')` dentro del bloque `withMiddleware`:

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->trustProxies(at: '*');   // ← agregar

    $middleware->statefulApi();
    $middleware->api(append: [
        ResolveTenant::class,
    ]);
})
```

### 3.3 Script de deployment (backend/deploy.sh)

El Laravel Toolkit ejecuta este script automáticamente en cada deploy desde Git. Crear el archivo en la raíz de `backend/`:

```bash
#!/bin/bash
set -e

composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
php artisan optimize
```

> El toolkit puede ejecutar `composer install` por sí solo, pero tenerlo aquí garantiza el orden correcto con las migraciones y el cache.

Comitear los tres cambios y hacer push al repositorio.

---

## 4. Instalar Laravel Toolkit en Plesk

1. Plesk → **Extensions** → **Catalog**
2. Buscar **"Laravel Toolkit"**
3. Clic en **Install** (es gratuita)
4. Verificar que la extensión **Git** también esté instalada (dependencia obligatoria del toolkit)

---

## 5. Backend — api.ciodent.mx

### 5.1 Crear base de datos MySQL

Plesk → **Databases** → **Add Database**:

```
Database name:  ciodent_prod
Username:       ciodent_user
Password:       <contraseña segura — anotar>
Host:           localhost
```

### 5.2 Configurar document root

El toolkit requiere que el document root apunte a la carpeta `public/` de Laravel.

Plesk → `api.ciodent.mx` → **Hosting Settings**:

```
Document root:  /httpdocs/backend/public
```

> La ruta exacta depende de dónde el toolkit clone el repositorio. Si clona el monorepo completo en `/httpdocs`, la ruta sería `/httpdocs/clinicl/backend/public`. Ajustar después del paso 5.3.

### 5.3 Conectar el repositorio Git con el toolkit

1. Plesk → **Websites & Domains** → `api.ciodent.mx`
2. Clic en **Laravel** (ícono del toolkit)
3. Seleccionar **"Deploy from remote Git repository"**
4. Ingresar la URL del repositorio
5. Elegir la rama: `main`
6. En **"Deployment script"**, escribir la ruta al script: `backend/deploy.sh`  
   (o pegar el contenido del script directamente en el editor del toolkit)
7. Clic en **Deploy**

El toolkit hace el `git clone`, instala dependencias y ejecuta el script de deployment.

### 5.4 Configurar variables de entorno (.env)

En el toolkit → pestaña **Environment**, agregar/editar las siguientes variables:

```dotenv
APP_NAME=CIO Dent
APP_ENV=production
APP_DEBUG=false
APP_TIMEZONE=America/Mexico_City
APP_URL=https://api.ciodent.mx

APP_LOCALE=es
APP_FALLBACK_LOCALE=es

CORS_ALLOWED_ORIGINS=https://app.ciodent.mx
SANCTUM_STATEFUL_DOMAINS=app.ciodent.mx

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=.ciodent.mx
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=ciodent_prod
DB_USERNAME=ciodent_user
DB_PASSWORD=<contraseña de la BD>

LOG_CHANNEL=stack
LOG_STACK=single
LOG_LEVEL=error

FILESYSTEM_DISK=local
QUEUE_CONNECTION=database
CACHE_STORE=database
BROADCAST_CONNECTION=log

MAIL_MAILER=smtp
MAIL_HOST=localhost
MAIL_PORT=587
MAIL_ENCRYPTION=tls
MAIL_USERNAME=no-reply@ciodent.mx
MAIL_PASSWORD=<contraseña del buzón en Plesk>
MAIL_FROM_ADDRESS=no-reply@ciodent.mx
MAIL_FROM_NAME=CIO Dent
```

> **SESSION_DOMAIN=.ciodent.mx** (con el punto inicial): permite que la cookie de sesión sea compartida entre `api.ciodent.mx` y `app.ciodent.mx`. Crítico para que Sanctum funcione.

### 5.5 Generar APP_KEY

En el toolkit → pestaña **Artisan**:

```
key:generate
```

### 5.6 Ejecutar seeders iniciales

En el toolkit → pestaña **Artisan**, ejecutar en este orden:

```
db:seed --class=TenantSeeder
db:seed --class=RoleSeeder
db:seed --class=UserSeeder
db:seed --class=TreatmentSeeder
db:seed --class=DiscountSeeder
db:seed --class=ConsentTemplateSeeder
```

> `RoleSeeder` es crítico — siembra los 10 roles y la matriz de permisos.  
> `PatientSeeder` es solo para desarrollo, **no ejecutar en producción**.

### 5.7 Crear storage link

En el toolkit → pestaña **Artisan**:

```
storage:link
```

### 5.8 Activar Queue Worker

En el toolkit → pestaña **Queues**:

1. Activar el toggle **"Enable Queue Worker"**
2. Configurar opciones recomendadas:
   - **Timeout:** `60`
   - **Max Jobs:** `500`
   - **Max Runtime:** `3600`
3. Guardar

El toolkit crea y gestiona el proceso worker automáticamente, sin necesidad de cron ni Supervisor.

> **Limitación conocida del toolkit:** Queue y Scheduler comparten un toggle. Al activar queues, el scheduler también se activa (no es problema, simplemente no hay tareas programadas definidas aún en `routes/console.php`).

### 5.9 Verificar que el backend responde

```
https://api.ciodent.mx/up   → debe responder 200
```

---

## 6. Frontend — app.ciodent.mx

El frontend es una SPA estática (archivos `dist/` generados por Vite). **El Laravel Toolkit no aplica aquí** — el deploy es subir archivos compilados.

### 6.1 Document root en Plesk

Plesk → `app.ciodent.mx` → **Hosting Settings**:

```
Document root:  /httpdocs/app-dist
```

Crear la carpeta si no existe (Plesk puede hacerlo al guardar).

### 6.2 Build del frontend

Ejecutar en la máquina de desarrollo (no en el VPS):

```bash
cd frontend

# Variables de entorno de producción
echo "VITE_API_URL=https://api.ciodent.mx" > .env.production

# Instalar dependencias y compilar
npm ci
npm run build
# Output en: frontend/dist/
```

### 6.3 Subir el build al VPS

**Opción A — rsync (recomendada):**

```bash
rsync -avz --delete frontend/dist/ usuario@<ip-vps>:/httpdocs/app-dist/
```

**Opción B — SFTP:**  
Subir el contenido de `frontend/dist/` a `/httpdocs/app-dist/` mediante el administrador de archivos de Plesk o un cliente SFTP.

### 6.4 Configurar SPA routing en Plesk

Una SPA con React Router necesita que el servidor devuelva siempre `index.html` para cualquier ruta que no sea un archivo físico. Sin esto, recargar cualquier página distinta a `/` devuelve 404.

**Si Plesk usa nginx** — en `app.ciodent.mx` → **Apache & nginx Settings** → **Additional nginx directives**:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

**Si Plesk usa Apache sin nginx** — crear `/httpdocs/app-dist/.htaccess`:

```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [QSA,L]
```

### 6.5 Verificar que la SPA carga

- `https://app.ciodent.mx` → aparece la pantalla de login
- `https://app.ciodent.mx/dashboard` (URL directa) → carga sin 404

---

## 7. Verificación post-despliegue

### 7.1 Backend

```bash
# Salud de la app
curl -I https://api.ciodent.mx/up
# → HTTP/2 200

# CSRF cookie con CORS
curl -I \
  -H "Origin: https://app.ciodent.mx" \
  -H "X-Requested-With: XMLHttpRequest" \
  https://api.ciodent.mx/sanctum/csrf-cookie
# → Access-Control-Allow-Origin: https://app.ciodent.mx
# → Access-Control-Allow-Credentials: true
# → Set-Cookie: XSRF-TOKEN=...
```

### 7.2 Desde el navegador en app.ciodent.mx

- [ ] Login con usuario admin funciona sin errores CORS en DevTools
- [ ] DevTools → Network: peticiones van a `https://api.ciodent.mx`
- [ ] DevTools → Application → Cookies: cookie `laravel_session` con dominio `.ciodent.mx`
- [ ] Dashboard carga con datos reales
- [ ] Recargar `https://app.ciodent.mx/dashboard` no da 404

### 7.3 Logs en el toolkit

En el toolkit de `api.ciodent.mx` → pestaña **Logs**: no deben aparecer excepciones tras el primer login.

---

## 8. Checklist final

### Código (antes de hacer push)

- [ ] `cors.php` usa `env('CORS_ALLOWED_ORIGINS', ...)`
- [ ] `bootstrap/app.php` tiene `$middleware->trustProxies(at: '*')`
- [ ] `backend/deploy.sh` existe y tiene permisos de ejecución (`chmod +x`)
- [ ] Cambios comiteados y pusheados a `main`

### Infraestructura

- [ ] DNS: `api.ciodent.mx` y `app.ciodent.mx` apuntan a la IP del VPS
- [ ] SSL válido en ambos subdominios (HTTPS forzado)
- [ ] Extensión Git instalada en Plesk
- [ ] Laravel Toolkit instalado en Plesk

### Backend (toolkit)

- [ ] Document root → `backend/public/`
- [ ] BD MySQL creada (`ciodent_prod`)
- [ ] Repo conectado y primer deploy ejecutado
- [ ] `.env` configurado (`APP_DEBUG=false`, `SESSION_DOMAIN=.ciodent.mx`, `SESSION_SECURE_COOKIE=true`)
- [ ] `APP_KEY` generado
- [ ] `CORS_ALLOWED_ORIGINS=https://app.ciodent.mx`
- [ ] `SANCTUM_STATEFUL_DOMAINS=app.ciodent.mx`
- [ ] Seeders ejecutados en orden (Tenant → Role → User → catálogos)
- [ ] `storage:link` ejecutado
- [ ] Queue Worker activado en el toolkit
- [ ] `https://api.ciodent.mx/up` responde 200

### Frontend

- [ ] Build generado con `VITE_API_URL=https://api.ciodent.mx`
- [ ] Archivos `dist/` en `/httpdocs/app-dist/`
- [ ] SPA routing configurado (`try_files` nginx o `.htaccess`)
- [ ] `https://app.ciodent.mx` carga sin errores

---

## 9. Despliegues posteriores (rollout)

### Backend

Con el toolkit conectado al repo Git, el proceso se reduce a:

1. Hacer `git push origin main` desde local
2. En el toolkit → pestaña principal → clic en **"Deploy"** (o activar deploy automático en la configuración del toolkit para que se dispare solo con cada push)

El script `backend/deploy.sh` se ejecuta automáticamente:

```bash
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
php artisan optimize
```

Si se modificó `Permissions.php` o `roleMatrix()`, agregar manualmente desde la pestaña Artisan:

```
db:seed --class=RoleSeeder
```

### Frontend

```bash
# En local: generar build actualizado
cd frontend
npm ci
npm run build

# Subir al VPS
rsync -avz --delete frontend/dist/ usuario@<ip-vps>:/httpdocs/app-dist/
```

No hay downtime: el servidor sigue sirviendo archivos viejos hasta que `rsync` termina.

---

## Notas adicionales

### Correo transaccional

El SMTP de Plesk sirve para el MVP. Para producción con mayor volumen considerar Mailgun, Resend o Amazon SES; el cambio es solo en las variables `MAIL_*` del `.env`.

### Backups de BD

Plesk → **Backup Manager** → configurar respaldo automático diario de `ciodent_prod`. Retención mínima recomendada: 7 días.

### Variables sensibles

Nunca comitear `.env` al repo (ya está en `.gitignore`). Gestionar las credenciales de producción desde la pestaña **Environment** del toolkit o en un gestor de contraseñas del equipo.
