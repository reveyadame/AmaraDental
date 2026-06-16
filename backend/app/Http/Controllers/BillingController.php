<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Support\BillingInfo;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Billing de la clínica (paga su suscripción a Amara Dental vía Stripe/Cashier).
 * Self-service: el admin de la clínica inicia el checkout y administra su pago.
 */
class BillingController extends Controller
{
    public function show(): JsonResponse
    {
        $tenant = TenantContext::tenant();
        $subscription = $tenant->subscription('default');

        return response()->json([
            'data' => [
                'plan' => $tenant->plan?->name,
                'on_trial' => $tenant->onGenericTrial(),
                'trial_ends_at' => $tenant->trial_ends_at?->toIso8601String(),
                'subscribed' => $tenant->subscribed('default'),
                'on_grace_period' => $subscription?->onGracePeriod() ?? false,
                'stripe_status' => $subscription?->stripe_status,
                'ends_at' => $subscription?->ends_at?->toIso8601String(),
                'has_active_billing' => $tenant->hasActiveBilling(),
                'card_last_four' => $tenant->pm_last_four,
            ],
        ]);
    }

    /**
     * Detalle de billing: fecha de renovación + historial de facturas (Stripe).
     * Solo admin (es información de pago de la clínica).
     */
    public function details(): JsonResponse
    {
        $this->requireAdmin();

        return response()->json(['data' => BillingInfo::for(TenantContext::tenant())]);
    }

    public function checkout(Request $request): JsonResponse
    {
        $this->requireAdmin();

        $tenant = TenantContext::tenant();
        $plan = $tenant->plan;

        abort_if(
            $plan === null || blank($plan->stripe_price_id),
            422,
            'Tu plan no tiene un precio configurado en Stripe. Contacta a Amara Dental.',
        );

        // Regreso al frontend de ESTA clínica (su subdominio en prod, o el
        // FRONTEND_URL en dev) — no al host del API.
        $base = $tenant->appUrl();

        $builder = $tenant->newSubscription('default', $plan->stripe_price_id);
        // Respeta el periodo de prueba restante (no cobra hasta que termine).
        if ($tenant->trial_ends_at !== null && $tenant->trial_ends_at->isFuture()) {
            $builder->trialUntil($tenant->trial_ends_at);
        }

        $checkout = $builder->checkout([
            'success_url' => $base.'/configuracion?billing=success',
            'cancel_url' => $base.'/configuracion?billing=cancel',
        ]);

        return response()->json(['url' => $checkout->url]);
    }

    public function portal(Request $request): JsonResponse
    {
        $this->requireAdmin();

        $tenant = TenantContext::tenant();
        abort_if(
            $tenant->stripe_id === null,
            422,
            'Aún no tienes un método de pago registrado. Inicia tu suscripción primero.',
        );

        return response()->json([
            'url' => $tenant->billingPortalUrl($tenant->appUrl().'/configuracion'),
        ]);
    }
}
