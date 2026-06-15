<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\PlatformAdmin;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Guard del panel de plataforma. El token autenticado debe pertenecer a un
 * PlatformAdmin (no a un User de clínica ni a un PatientAccount). No hay
 * tenant-match: el super-admin opera por encima de todos los tenants.
 */
class EnsurePlatformAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $admin = $request->user();

        abort_unless($admin instanceof PlatformAdmin, 403, 'Acceso solo para administradores de plataforma.');
        abort_if(! $admin->active, 403, 'Tu acceso de plataforma está deshabilitado.');

        return $next($request);
    }
}
