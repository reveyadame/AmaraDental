<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Patient;
use App\Models\Tenant;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Aislamiento entre tenants — la red de seguridad de la migración a SaaS.
 *
 * Prueba que: (a) el Global Scope filtra datos por tenant, (b) la API solo
 * devuelve datos del tenant resuelto, y (c) un usuario de un tenant NO puede
 * operar bajo otro mandando `X-Tenant` (escalación cross-tenant bloqueada).
 */
class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenantA;
    private Tenant $tenantB;

    protected function setUp(): void
    {
        parent::setUp();

        // bootTenant() siembra la clínica piloto (id=1) y deja el contexto en A.
        $this->tenantA = $this->bootTenant();

        $this->tenantB = Tenant::query()->create([
            'name' => 'Clínica Norte',
            'slug' => 'clinica-norte',
            'brand_name' => 'Clínica Norte',
            'color_primary' => 'oklch(0.546 0.215 262.881)',
            'color_primary_foreground' => 'oklch(0.985 0 0)',
            'color_secondary' => 'oklch(0.97 0 0)',
            'phones' => [],
            'cedulas_clinica' => [],
            'timezone' => 'America/Mexico_City',
        ]);
    }

    private function asTenant(Tenant $tenant): void
    {
        TenantContext::setTenant($tenant);
    }

    /** Crea un usuario admin perteneciente al tenant dado. */
    private function adminFor(Tenant $tenant): User
    {
        $this->asTenant($tenant);
        /** @var User $user */
        $user = User::factory()->create();
        $user->assignRole('admin');

        return $user;
    }

    public function test_global_scope_isolates_models_by_tenant(): void
    {
        $this->asTenant($this->tenantA);
        $patientA = Patient::factory()->create();

        $this->asTenant($this->tenantB);
        $patientB = Patient::factory()->create();

        // Cada modelo quedó asignado a su tenant.
        $this->assertSame($this->tenantA->id, $patientA->tenant_id);
        $this->assertSame($this->tenantB->id, $patientB->tenant_id);

        // Bajo contexto B solo se ve el paciente de B…
        $this->assertSame([$patientB->id], Patient::query()->pluck('id')->all());

        // …y bajo A solo el de A.
        $this->asTenant($this->tenantA);
        $this->assertSame([$patientA->id], Patient::query()->pluck('id')->all());
    }

    public function test_api_returns_only_active_tenant_data(): void
    {
        $this->asTenant($this->tenantA);
        $patientA = Patient::factory()->create();
        $userA = $this->adminFor($this->tenantA);

        $this->asTenant($this->tenantB);
        $patientB = Patient::factory()->create();

        // userA, pidiendo explícitamente su propia clínica.
        $this->actingAs($userA, 'sanctum');
        $ids = collect(
            $this->getJson('/api/patients', ['X-Tenant' => $this->tenantA->slug])
                ->assertOk()
                ->json('data')
        )->pluck('id')->all();

        $this->assertContains($patientA->id, $ids);
        $this->assertNotContains($patientB->id, $ids);
    }

    public function test_user_cannot_operate_under_another_tenant(): void
    {
        $userA = $this->adminFor($this->tenantA);

        $this->actingAs($userA, 'sanctum');

        // Intenta usar el header de OTRA clínica → 403 (guard usuario↔tenant).
        $this->getJson('/api/patients', ['X-Tenant' => $this->tenantB->slug])
            ->assertForbidden();
    }

    public function test_user_can_operate_under_their_own_tenant(): void
    {
        $userB = $this->adminFor($this->tenantB);

        $this->actingAs($userB, 'sanctum');

        $this->getJson('/api/patients', ['X-Tenant' => $this->tenantB->slug])
            ->assertOk();
    }

    public function test_unknown_tenant_slug_returns_404(): void
    {
        // Ruta pública (sin auth): basta para ejercitar la resolución.
        $this->getJson('/api/branding', ['X-Tenant' => 'no-existe'])
            ->assertNotFound();
    }

    public function test_no_header_falls_back_to_default_tenant(): void
    {
        // Sin header ni subdominio → tenant por defecto (id=1 = piloto).
        // Esto garantiza que producción single-tenant sigue resolviendo igual.
        $this->getJson('/api/branding')
            ->assertOk()
            ->assertJsonPath('data.brand_name', $this->tenantA->brand_name);
    }
}
