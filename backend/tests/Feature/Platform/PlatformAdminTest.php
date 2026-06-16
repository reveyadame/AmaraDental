<?php

declare(strict_types=1);

namespace Tests\Feature\Platform;

use App\Models\PatientAccount;
use App\Models\Patient;
use App\Models\PlatformAdmin;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Panel de plataforma (super-admin aislado): auth propia, gestión de clínicas,
 * suspensión, y separación estricta respecto a staff y pacientes.
 */
class PlatformAdminTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->bootTenant(); // clínica piloto (id=1) + roles
    }

    private function platformToken(): string
    {
        return PlatformAdmin::factory()->create()->createToken('test', ['platform'])->plainTextToken;
    }

    // ── Auth de plataforma ─────────────────────────────────────────────────

    public function test_platform_admin_can_login_and_fetch_me(): void
    {
        $admin = PlatformAdmin::factory()->create(['email' => 'ops@amaradental.mx']);

        $response = $this->postJson('/api/platform/auth/login', [
            'email' => 'ops@amaradental.mx',
            'password' => 'password',
        ])->assertOk();

        $token = $response->json('token');
        $this->assertNotEmpty($token);

        $this->withToken($token)->getJson('/api/platform/me')
            ->assertOk()
            ->assertJsonPath('data.email', 'ops@amaradental.mx');
        $this->assertNotNull($admin->refresh()->last_login_at);
    }

    public function test_login_rejects_bad_credentials(): void
    {
        PlatformAdmin::factory()->create(['email' => 'ops@amaradental.mx']);

        $this->postJson('/api/platform/auth/login', [
            'email' => 'ops@amaradental.mx',
            'password' => 'incorrecta',
        ])->assertStatus(422);
    }

    public function test_unauthenticated_platform_request_is_rejected(): void
    {
        $this->getJson('/api/platform/tenants')->assertUnauthorized();
    }

    // ── Gestión de clínicas ────────────────────────────────────────────────

    public function test_platform_admin_can_list_tenants(): void
    {
        $token = $this->platformToken();

        $data = $this->withToken($token)->getJson('/api/platform/tenants')
            ->assertOk()
            ->json('data');

        // Al menos la clínica piloto.
        $this->assertContains('clinica-piloto', collect($data)->pluck('slug')->all());
    }

    public function test_platform_routes_work_without_a_default_tenant(): void
    {
        // SaaS recién desplegado: aún no hay clínicas ni tenant por defecto.
        // El panel super-admin (admin.amaradental.mx) debe seguir operando.
        $token = $this->platformToken();
        Tenant::query()->delete();

        $this->withToken($token)->getJson('/api/platform/tenants')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_platform_admin_can_provision_a_tenant(): void
    {
        $token = $this->platformToken();

        $response = $this->withToken($token)->postJson('/api/platform/tenants', [
            'name' => 'Clínica Norte',
            'admin_email' => 'admin@norte.mx',
        ])->assertCreated();

        $response->assertJsonPath('data.slug', 'clinica-norte');
        $this->assertNotEmpty($response->json('admin_password'));
        $this->assertDatabaseHas('tenants', ['slug' => 'clinica-norte', 'status' => 'active']);
    }

    public function test_tenant_detail_includes_counts(): void
    {
        $token = $this->platformToken();

        // Provisiona una clínica (crea 1 admin) y consulta su detalle.
        $id = $this->withToken($token)->postJson('/api/platform/tenants', [
            'name' => 'Clínica Sur',
            'admin_email' => 'admin@sur.mx',
        ])->json('data.id');

        $this->withToken($token)->getJson("/api/platform/tenants/{$id}")
            ->assertOk()
            ->assertJsonPath('data.counts.users', 1)
            ->assertJsonPath('data.counts.patients', 0);
    }

    public function test_suspending_a_tenant_blocks_clinic_access(): void
    {
        $token = $this->platformToken();

        $id = $this->withToken($token)->postJson('/api/platform/tenants', [
            'name' => 'Clínica B',
            'admin_email' => 'admin@b.mx',
        ])->json('data.id');

        // Suspende.
        $this->withToken($token)->patchJson("/api/platform/tenants/{$id}", [
            'status' => 'suspended',
        ])->assertOk()->assertJsonPath('data.status', 'suspended');

        // Una request de cara al usuario a esa clínica (branding público) → 403.
        $this->getJson('/api/branding', ['X-Tenant' => 'clinica-b'])->assertForbidden();

        // El panel de plataforma sigue pudiendo verla.
        $this->withToken($token)->getJson("/api/platform/tenants/{$id}")->assertOk();
    }

    // ── Aislamiento estricto entre las 3 identidades ───────────────────────

    public function test_clinic_user_token_cannot_access_platform_api(): void
    {
        $user = User::factory()->create();
        $user->assignRole('admin');
        $token = $user->createToken('staff')->plainTextToken;

        $this->withToken($token)->getJson('/api/platform/tenants')->assertForbidden();
    }

    public function test_platform_admin_token_cannot_access_clinic_api(): void
    {
        $token = $this->platformToken();

        $this->withToken($token)->getJson('/api/patients')->assertForbidden();
    }

    public function test_platform_admin_token_cannot_access_patient_api(): void
    {
        $token = $this->platformToken();

        $this->withToken($token)->getJson('/api/patient/me')->assertForbidden();
    }

    // ── Planes (Fase 2) ────────────────────────────────────────────────────

    public function test_platform_admin_can_list_plans(): void
    {
        $token = $this->platformToken();

        $keys = collect(
            $this->withToken($token)->getJson('/api/platform/plans')->assertOk()->json('data')
        )->pluck('key')->all();

        $this->assertEqualsCanonicalizing(['esencial', 'crecimiento', 'premium'], $keys);
    }

    public function test_provision_assigns_chosen_plan(): void
    {
        $token = $this->platformToken();

        $this->withToken($token)->postJson('/api/platform/tenants', [
            'name' => 'Clínica Plan',
            'admin_email' => 'admin@plan.mx',
            'plan_key' => 'crecimiento',
        ])->assertCreated()
            ->assertJsonPath('data.plan.key', 'crecimiento')
            ->assertJsonPath('data.plan.max_patients', 1000);
    }

    public function test_can_change_tenant_plan(): void
    {
        $token = $this->platformToken();

        $id = $this->withToken($token)->postJson('/api/platform/tenants', [
            'name' => 'Clínica Cambio',
            'admin_email' => 'admin@cambio.mx',
        ])->json('data.id'); // default: esencial

        $this->withToken($token)->patchJson("/api/platform/tenants/{$id}", [
            'plan_key' => 'premium',
        ])->assertOk()
            ->assertJsonPath('data.plan.key', 'premium')
            ->assertJsonPath('data.plan.includes_app', true);
    }
}
