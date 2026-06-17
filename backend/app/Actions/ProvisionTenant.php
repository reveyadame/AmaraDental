<?php

declare(strict_types=1);

namespace App\Actions;

use App\Enums\Role as RoleEnum;
use App\Mail\ClinicWelcomeMail;
use App\Models\Tenant;
use App\Models\User;
use App\Support\TenantContext;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

/**
 * Alta atómica de una clínica (tenant): crea el tenant con branding default,
 * asegura el catálogo de roles y crea su usuario administrador inicial.
 *
 * Reutilizada por el comando `tenant:provision` (CLI) y por el endpoint del
 * super-admin (`POST /api/platform/tenants`). Todo dentro de una transacción.
 */
class ProvisionTenant
{
    /**
     * @return array{tenant: Tenant, password: string, generated: bool}
     *
     * @throws \InvalidArgumentException si el slug ya existe.
     */
    public function handle(
        string $name,
        string $slug,
        string $adminEmail,
        string $adminName = 'Administrador',
        string $timezone = 'America/Mexico_City',
        ?string $password = null,
        ?int $planId = null,
    ): array {
        $slug = strtolower(trim($slug));
        $adminEmail = strtolower(trim($adminEmail));

        if (Tenant::query()->where('slug', $slug)->exists()) {
            throw new \InvalidArgumentException("Ya existe una clínica con el slug «{$slug}».");
        }

        $generated = $password === null;
        $password ??= Str::password(16);

        // Preserva el tenant del request actual (si lo hay) para restaurarlo.
        $previous = TenantContext::hasTenant() ? TenantContext::tenant() : null;

        $tenant = DB::transaction(function () use (
            $name, $slug, $timezone, $adminEmail, $adminName, $password, $planId
        ): Tenant {
            // 1. Catálogo de roles/permisos (global, idempotente). Solo si falta.
            if (! Role::query()->where('name', RoleEnum::Admin->value)->exists()) {
                (new RoleSeeder)->run();
            }

            // 2. Tenant con branding default.
            $tenant = Tenant::query()->create([
                'name' => $name,
                'slug' => $slug,
                'status' => Tenant::STATUS_ACTIVE,
                'plan_id' => $planId,
                // Periodo de prueba gratis: la clínica usa el sistema sin cobro
                // hasta que termina, cuando debe registrar tarjeta (checkout).
                'trial_ends_at' => now()->addDays(14),
                'brand_name' => $name,
                // Marca Amara por defecto (teal); la clínica puede personalizarla.
                'color_primary' => '#1ba4c6',
                'color_primary_foreground' => '#ffffff',
                'color_secondary' => 'oklch(0.97 0 0)',
                'phones' => [],
                'cedulas_clinica' => [],
                'timezone' => $timezone,
            ]);

            // 3. Usuario admin del tenant. TenantContext fija el tenant_id que
            //    autorrellena BelongsToTenant.
            TenantContext::setTenant($tenant);

            $admin = User::query()->create([
                'name' => $adminName,
                'email' => $adminEmail,
                'password' => Hash::make($password),
                'active' => true,
            ]);
            $admin->assignRole(RoleEnum::Admin->value);

            return $tenant;
        });

        // Restaura el contexto previo (o límpialo) para no contaminar el request.
        if ($previous !== null) {
            TenantContext::setTenant($previous);
        } else {
            TenantContext::clear();
        }

        // Email de bienvenida (no debe romper el alta si el correo falla).
        try {
            Mail::to($adminEmail)->send(new ClinicWelcomeMail(
                tenant: $tenant,
                adminEmail: $adminEmail,
                password: $generated ? $password : null,
                loginUrl: $tenant->appUrl(),
                planName: $tenant->plan?->name,
                trialEndsAt: $tenant->trial_ends_at?->toIso8601String(),
            ));
        } catch (\Throwable $e) {
            Log::warning('No se pudo enviar el correo de bienvenida de la clínica', [
                'tenant_id' => $tenant->id,
                'error' => $e->getMessage(),
            ]);
        }

        return ['tenant' => $tenant, 'password' => $password, 'generated' => $generated];
    }
}
