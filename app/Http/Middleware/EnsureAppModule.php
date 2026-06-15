<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Support\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gating del módulo "app de pacientes": solo disponible si el plan de la
 * clínica resuelta lo incluye (`includes_app`). Se aplica al portal de
 * pacientes y a la gestión de invitaciones desde el staff.
 */
class EnsureAppModule
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless(
            TenantContext::tenant()->includesApp(),
            403,
            'Tu plan no incluye la app de pacientes. Sube a Premium para habilitarla.',
        );

        return $next($request);
    }
}
