<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Support\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Resuelve el tenant activo del request, en este orden:
 *
 *   1. Header explícito (`X-Tenant: <slug>`) — app móvil / API / tests.
 *   2. Subdominio (`clinica-x.ciodent.mx` → slug `clinica-x`) — solo si hay
 *      `tenancy.central_domains` configurados.
 *   3. Tenant por defecto (`tenancy.default_tenant_id`) — fase single-tenant.
 *
 * Si se pidió un tenant explícito (header/subdominio) y no existe → 404.
 * Sin header ni subdominio de tenant → cae al default, dejando intacto el
 * comportamiento actual de producción.
 *
 * La verificación de que el USUARIO autenticado pertenece a este tenant la
 * hace EnsureTenantMatchesUser (corre después de auth).
 */
class ResolveTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = $this->resolve($request);

        // Las rutas de plataforma (super-admin) operan por ENCIMA de los tenants:
        // funcionan aunque no haya tenant resuelto (admin.amaradental.mx, o un
        // SaaS recién desplegado sin tenant por defecto) y sobre suspendidas.
        if ($request->is('api/platform/*')) {
            if ($tenant !== null) {
                TenantContext::setTenant($tenant);
            }

            return $next($request);
        }

        abort_if($tenant === null, 404, 'Clínica no encontrada.');

        abort_if(
            ! $tenant->isActive(),
            403,
            'Esta clínica está suspendida. Contacta a Amara Dental.',
        );

        TenantContext::setTenant($tenant);

        return $next($request);
    }

    private function resolve(Request $request): ?Tenant
    {
        // 1. Header explícito — tiene prioridad. Si se manda y no existe, 404.
        $slug = $request->header((string) config('tenancy.header'));
        if (is_string($slug) && $slug !== '') {
            return $this->findBySlug($slug);
        }

        // 2. Subdominio — solo si hay dominios centrales configurados.
        $sub = $this->subdomainFor($request->getHost());
        if ($sub !== null) {
            return $this->findBySlug($sub);
        }

        // 3. Fallback fase single-tenant: tenant por defecto.
        return Tenant::query()->find((int) config('tenancy.default_tenant_id'));
    }

    private function findBySlug(string $slug): ?Tenant
    {
        return Tenant::query()->where('slug', strtolower(trim($slug)))->first();
    }

    /**
     * Devuelve el slug del subdominio si el host pertenece a un dominio
     * central; null si no aplica (apex, dominio ajeno, subdominio reservado,
     * o sin dominios centrales configurados).
     */
    private function subdomainFor(string $host): ?string
    {
        $host = strtolower($host);
        $reserved = (array) config('tenancy.reserved_subdomains', []);

        foreach ((array) config('tenancy.central_domains') as $central) {
            $central = strtolower(trim((string) $central));
            if ($central === '') {
                continue;
            }

            if ($host === $central) {
                return null; // apex del SaaS → sin tenant por subdominio
            }

            if (str_ends_with($host, '.'.$central)) {
                // Toma solo el primer label: "clinica-x.app.ciodent.mx" → "clinica-x".
                $prefix = substr($host, 0, -(strlen($central) + 1));
                $sub = explode('.', $prefix)[0] ?? '';

                if ($sub !== '' && ! in_array($sub, $reserved, true)) {
                    return $sub;
                }

                return null;
            }
        }

        return null;
    }
}
