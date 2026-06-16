<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Support\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gating por suscripción: si la clínica no tiene billing vigente (terminó la
 * prueba y no hay suscripción activa), bloquea la operación con 402.
 *
 * Deja pasar SIEMPRE las rutas que se necesitan para regularizar el pago o
 * conocer el estado (billing, suscripción, perfil, logout), para que el admin
 * pueda pagar aunque la clínica esté en hold.
 */
class EnsureBillingActive
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->is('api/billing*', 'api/subscription', 'api/me', 'api/auth/*')) {
            return $next($request);
        }

        abort_unless(
            TenantContext::tenant()->hasActiveBilling(),
            402,
            'Tu suscripción no está activa. Regulariza tu pago para continuar usando el sistema.',
        );

        return $next($request);
    }
}
