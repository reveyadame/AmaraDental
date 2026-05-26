<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Support\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Fase single-tenant: siempre resolvemos tenant_id = 1.
 *
 * Fase SaaS multi-tenant (futuro): reemplazar la lógica de resolución
 * por una basada en subdominio (`$request->getHost()`), header
 * (`X-Tenant`), o claim del token Sanctum. El resto del código no cambia.
 */
class ResolveTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = Tenant::query()->find(1);

        if (! $tenant) {
            abort(503, 'Tenant base no configurado. Ejecuta `php artisan db:seed --class=TenantSeeder`.');
        }

        TenantContext::setTenant($tenant);

        return $next($request);
    }
}
