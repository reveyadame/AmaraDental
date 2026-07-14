<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Patient;
use App\Models\Plan;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Modularidad por plan: tope de pacientes y endpoint de suscripción según el
 * plan de la clínica.
 */
class SubscriptionTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();
        $this->tenant = $this->bootTenant(); // piloto, sin plan (grandfathered)
    }

    private function assignPlan(string $key): void
    {
        $this->tenant->update(['plan_id' => Plan::query()->where('key', $key)->value('id')]);
    }

    /** @return array<string, string> */
    private function patientPayload(): array
    {
        return [
            'first_name' => 'Ana',
            'last_name' => 'García',
            'date_of_birth' => '1990-01-01',
            'gender' => 'F',
        ];
    }

    // ── Tope de pacientes ──────────────────────────────────────────────────

    public function test_patient_limit_is_enforced_on_create(): void
    {
        Plan::query()->where('key', 'esencial')->update(['max_patients' => 1]);
        $this->assignPlan('esencial');
        $this->actingAsUserWithRoles('pacientes');

        Patient::factory()->create(); // ocupa el único cupo

        $this->postJson('/api/patients', $this->patientPayload())->assertStatus(422);
        $this->assertSame(1, Patient::query()->count());
    }

    public function test_create_allowed_within_limit(): void
    {
        $this->assignPlan('esencial'); // tope 300, 0 pacientes
        $this->actingAsUserWithRoles('pacientes');

        $this->postJson('/api/patients', $this->patientPayload())->assertCreated();
    }

    public function test_unlimited_plan_has_no_cap(): void
    {
        $this->assignPlan('premium'); // ilimitado
        $this->actingAsUserWithRoles('pacientes');

        $this->postJson('/api/patients', $this->patientPayload())->assertCreated();
    }

    // ── Endpoint de suscripción ────────────────────────────────────────────

    public function test_subscription_endpoint_returns_plan_and_usage(): void
    {
        $this->assignPlan('crecimiento');
        Patient::factory()->count(2)->create();
        $this->actingAsUserWithRoles('caja');

        $this->getJson('/api/subscription')->assertOk()
            ->assertJsonPath('data.plan_key', 'crecimiento')
            ->assertJsonPath('data.max_patients', 1000)
            ->assertJsonPath('data.patients_count', 2)
            ->assertJsonPath('data.can_add_patients', true);
    }
}
