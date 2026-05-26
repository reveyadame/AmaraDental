<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Tenant;

/**
 * Repositorio del tenant activo durante el ciclo del request.
 *
 * En la fase single-tenant el middleware ResolveTenant siempre setea
 * tenant_id = 1. Al migrar a SaaS multi-tenant, ResolveTenant pasará a
 * resolver por subdominio, header o claim del token sin que cambie
 * el resto del código.
 */
final class TenantContext
{
    private static ?Tenant $tenant = null;

    public static function setTenant(Tenant $tenant): void
    {
        self::$tenant = $tenant;
    }

    public static function tenant(): Tenant
    {
        if (! self::$tenant) {
            throw new \RuntimeException('Tenant no resuelto. ¿Olvidaste el middleware ResolveTenant?');
        }

        return self::$tenant;
    }

    public static function tenantId(): int
    {
        return self::tenant()->id;
    }

    public static function hasTenant(): bool
    {
        return self::$tenant !== null;
    }

    public static function clear(): void
    {
        self::$tenant = null;
    }
}
