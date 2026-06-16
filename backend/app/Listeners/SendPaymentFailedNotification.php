<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Enums\Role as RoleEnum;
use App\Mail\PaymentFailedMail;
use App\Models\Tenant;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Support\Facades\Mail;
use Laravel\Cashier\Events\WebhookReceived;

/**
 * Al recibir el webhook `invoice.payment_failed` de Stripe, avisa al admin de
 * la clínica para que actualice su método de pago.
 */
class SendPaymentFailedNotification
{
    public function handle(WebhookReceived $event): void
    {
        if (($event->payload['type'] ?? null) !== 'invoice.payment_failed') {
            return;
        }

        $customerId = $event->payload['data']['object']['customer'] ?? null;
        if (! is_string($customerId)) {
            return;
        }

        $tenant = Tenant::query()->where('stripe_id', $customerId)->first();
        if ($tenant === null) {
            return;
        }

        TenantContext::setTenant($tenant);
        $emails = User::role(RoleEnum::Admin->value)->pluck('email')->all();
        if ($emails !== []) {
            Mail::to($emails)->send(new PaymentFailedMail($tenant, $tenant->appUrl()));
        }
        TenantContext::clear();
    }
}
