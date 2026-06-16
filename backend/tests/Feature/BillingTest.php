<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Plan;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Billing por suscripción (Stripe/Cashier): trial, gating por estado de pago,
 * y rutas de pago siempre accesibles. No llama a Stripe (solo la lógica local).
 */
class BillingTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();
        $this->tenant = $this->bootTenant(); // piloto: sin trial ni stripe → grandfathered
    }

    public function test_grandfathered_tenant_passes_billing_gate(): void
    {
        $this->actingAsUserWithRoles('admin');
        $this->getJson('/api/patients')->assertOk();
    }

    public function test_tenant_on_trial_passes_gate(): void
    {
        $this->tenant->update(['trial_ends_at' => now()->addDays(5)]);
        $this->actingAsUserWithRoles('admin');

        $this->getJson('/api/patients')->assertOk();
    }

    public function test_expired_trial_without_subscription_is_blocked(): void
    {
        $this->tenant->update(['trial_ends_at' => now()->subDay()]);
        $this->actingAsUserWithRoles('admin');

        // 402 Payment Required en una ruta operativa.
        $this->getJson('/api/patients')->assertStatus(402);
    }

    public function test_billing_and_profile_routes_work_even_when_inactive(): void
    {
        $this->tenant->update(['trial_ends_at' => now()->subDay()]);
        $this->actingAsUserWithRoles('admin');

        $this->getJson('/api/billing')->assertOk();   // whitelisted en el gate
        $this->getJson('/api/me')->assertOk();
    }

    public function test_billing_status_reflects_trial(): void
    {
        $this->tenant->update(['trial_ends_at' => now()->addDays(10)]);
        $this->actingAsUserWithRoles('admin');

        $this->getJson('/api/billing')->assertOk()
            ->assertJsonPath('data.on_trial', true)
            ->assertJsonPath('data.subscribed', false)
            ->assertJsonPath('data.has_active_billing', true);
    }

    public function test_billing_details_requires_admin(): void
    {
        $this->actingAsUserWithRoles('caja');
        $this->getJson('/api/billing/details')->assertForbidden();
    }

    public function test_billing_details_returns_invoices_array_for_admin(): void
    {
        // Piloto grandfathered (sin Stripe) → sin facturas, sin llamadas a Stripe.
        $this->actingAsUserWithRoles('admin');
        $this->getJson('/api/billing/details')->assertOk()
            ->assertJsonPath('data.invoices', [])
            ->assertJsonPath('data.subscribed', false);
    }

    public function test_checkout_requires_a_configured_stripe_price(): void
    {
        // Fuerza un plan SIN precio de Stripe → el checkout aborta 422 antes de
        // llamar a Stripe (determinista, sin depender del env).
        $plan = Plan::query()->where('key', 'esencial')->first();
        $plan->update(['stripe_price_id' => null]);
        $this->tenant->update([
            'plan_id' => $plan->id,
            'trial_ends_at' => now()->addDays(5),
        ]);
        $this->actingAsUserWithRoles('admin');

        $this->postJson('/api/billing/checkout')->assertStatus(422);
    }
}
