<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\PatientAccount;
use App\Support\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Guard del portal de pacientes. Garantiza que:
 *   - el token autenticado pertenece a un PatientAccount (no a un User staff),
 *   - la cuenta no está bloqueada,
 *   - y pertenece al tenant resuelto (cierra cross-tenant también para pacientes).
 *
 * Va después de `auth:sanctum` en el grupo de rutas /api/patient/*.
 */
class EnsurePatientAccount
{
    public function handle(Request $request, Closure $next): Response
    {
        $account = $request->user();

        abort_unless($account instanceof PatientAccount, 403, 'Acceso solo para pacientes.');
        abort_if($account->isBlocked(), 403, 'Tu acceso está bloqueado.');
        abort_if(
            TenantContext::hasTenant() && (int) $account->tenant_id !== TenantContext::tenantId(),
            403,
            'La cuenta no pertenece a esta clínica.',
        );

        return $next($request);
    }
}
