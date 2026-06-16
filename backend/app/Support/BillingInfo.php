<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Tenant;
use Illuminate\Support\Carbon;

/**
 * Resumen de billing de una clínica para mostrar en la app de la clínica y en
 * el panel de super-admin: estado, fecha de renovación y facturas (Stripe).
 *
 * Hace llamadas a Stripe → usar solo en vistas de detalle, no en endpoints de
 * alta frecuencia. Tolerante a clínicas sin Stripe (grandfathered): devuelve
 * vacío sin reventar.
 */
final class BillingInfo
{
    /** @return array<string, mixed> */
    public static function for(Tenant $tenant): array
    {
        $subscription = $tenant->subscription('default');

        $renewsAt = null;
        $cardLastFour = $tenant->pm_last_four;
        if ($subscription !== null && $subscription->stripe_status === 'active') {
            try {
                $stripeSub = $subscription->asStripeSubscription(['default_payment_method']);
                $end = $stripeSub->items->data[0]->current_period_end
                    ?? ($stripeSub->current_period_end ?? null);
                $renewsAt = $end ? Carbon::createFromTimestamp($end)->toIso8601String() : null;

                // La tarjeta vive en el PM de la suscripción (no en el customer
                // cuando se creó vía Checkout), por eso se lee de aquí.
                $pm = $stripeSub->default_payment_method;
                if (is_object($pm) && isset($pm->card)) {
                    $cardLastFour = $pm->card->last4;
                }
            } catch (\Throwable) {
                // sin acceso a Stripe → sin fecha de renovación / tarjeta
            }
        }

        $invoices = [];
        try {
            foreach ($tenant->invoices() as $invoice) {
                $raw = $invoice->asStripeInvoice();
                $invoices[] = [
                    'date' => $invoice->date()->toIso8601String(),
                    'total' => $invoice->total(),       // ej. "MX$999.00"
                    'status' => $raw->status,           // paid | open | void | uncollectible
                    'url' => $raw->hosted_invoice_url,  // página de Stripe (ver/descargar)
                ];
            }
        } catch (\Throwable) {
            // sin Stripe / sin customer → sin facturas
        }

        return [
            'subscribed' => $tenant->subscribed('default'),
            'on_trial' => $tenant->onGenericTrial(),
            'trial_ends_at' => $tenant->trial_ends_at?->toIso8601String(),
            'status' => $subscription?->stripe_status,
            'ends_at' => $subscription?->ends_at?->toIso8601String(),
            'renews_at' => $renewsAt,
            'card_last_four' => $cardLastFour,
            'invoices' => $invoices,
        ];
    }
}
