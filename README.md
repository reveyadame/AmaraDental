# CIO Dent

Plataforma de gestión para clínicas dentales. Inicialmente single-tenant para un cliente piloto, con arquitectura preparada para migración a SaaS multi-tenant.

## Estructura

```
.
├── backend/        # API Laravel 11 (PHP 8.3, MySQL/SQLite, Sanctum)
├── frontend/       # SPA React 18 + TypeScript + Vite + Tailwind + shadcn/ui
└── docs/           # Documentación adicional
```

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Laravel 11, PHP 8.3, Sanctum, nwidart/laravel-modules, spatie/laravel-permission, owen-it/laravel-auditing, Pest |
| Frontend | React 18, TypeScript estricto, Vite, Tailwind CSS, shadcn/ui, Radix, TanStack Query, React Router v6, React Hook Form + Zod, Zustand, Recharts, TanStack Table |
| DB (dev) | SQLite |
| DB (prod) | MySQL 8 sobre VPS con Plesk |

## Multi-tenancy

Single-DB con columna `tenant_id` desde el día 1. Todo modelo de negocio aplica el trait `BelongsToTenant` con un Global Scope que filtra por tenant resuelto en el middleware `ResolveTenant`. Hoy es siempre `tenant_id = 1`; la migración a SaaS añadirá resolución por subdominio sin tocar las queries.

## Módulos (MVP)

Appointments, CashRegister, Treatments, Patients (incluye Historia Clínica y Consentimientos), Odontogram (solo dentición adulta), Memberships, Specialists, Prescriptions, Labs, Reports, Reminders, AuditLog, Branding.

## Cumplimiento normativo (México)

- NOM-004-SSA3-2012 — Expediente clínico
- NOM-024-SSA3-2012 — Sistemas de información en salud (bitácora de auditoría)
- NOM-013-SSA2-2015 — Salud bucal

## Setup local

```bash
# Backend
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve

# Frontend
cd frontend
npm install
npm run dev
```

Detalles en [docs/](docs/).
