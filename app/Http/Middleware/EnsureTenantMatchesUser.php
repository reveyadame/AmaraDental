<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\User;
use App\Support\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Invariante de seguridad multi-tenant: el usuario autenticado debe pertenecer
 * al tenant resuelto para el request.
 *
 * Sin esto, una sesión/token emitido bajo el tenant A podría operar sobre el
 * tenant B mandando `X-Tenant: B` (o vía subdominio), porque el Global Scope
 * filtraría las queries hacia B mientras el usuario sigue autenticado. Este
 * middleware corre DESPUÉS de `auth:sanctum`, así que ya hay usuario resuelto.
 *
 * En la fase single-tenant esto es un no-op: usuario y tenant son siempre 1.
 */
class EnsureTenantMatchesUser
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null) {
            return $next($request);
        }

        // Un token de paciente (PatientAccount) no puede operar la API de staff.
        abort_unless($user instanceof User, 403, 'Token no válido para esta API.');

        if (TenantContext::hasTenant()
            && (int) $user->tenant_id !== TenantContext::tenantId()) {
            abort(403, 'El usuario no pertenece a esta clínica.');
        }

        return $next($request);
    }
}
