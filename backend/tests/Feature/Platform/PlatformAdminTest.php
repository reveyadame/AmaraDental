<?php

declare(strict_types=1);

namespace Tests\Feature\Platform;

use App\Models\PatientAccount;
use App\Models\Patient;
use App\Models\Plan;
use App\Models\PlatformAdmin;
use App\Models\Tenant;
use App\Models\User;
use App\Support\TenantContext;
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

    public function test_platform_admin_can_edit_a_plan(): void
    {
        $token = $this->platformToken();
        $planId = Plan::query()->where('key', 'esencial')->value('id');

        $this->withToken($token)->patchJson("/api/platform/plans/{$planId}", [
            'max_patients' => 500,
            'price_mxn' => 599,
            'includes_app' => true,
        ])->assertOk()
            ->assertJsonPath('data.max_patients', 500)
            ->assertJsonPath('data.price_mxn', 599)
            ->assertJsonPath('data.includes_app', true);

        $this->assertDatabaseHas('plans', ['key' => 'esencial', 'max_patients' => 500, 'price_mxn' => 599]);
    }

    // ── Dashboard / stats ──────────────────────────────────────────────────

    public function test_stats_returns_aggregates(): void
    {
        $token = $this->platformToken();

        $data = $this->withToken($token)->getJson('/api/platform/stats')
            ->assertOk()
            ->json('data');

        $this->assertArrayHasKey('totals', $data);
        $this->assertArrayHasKey('by_plan', $data);
        $this->assertArrayHasKey('by_subscription', $data);
        $this->assertCount(12, $data['growth']); // 12 meses
        $this->assertGreaterThanOrEqual(1, $data['totals']['tenants']); // al menos la piloto
    }

    // ── Gestión de super-admins ────────────────────────────────────────────

    public function test_can_create_list_and_update_admins(): void
    {
        $token = $this->platformToken();

        $newId = $this->withToken($token)->postJson('/api/platform/admins', [
            'name' => 'Soporte',
            'email' => 'soporte@amaradental.mx',
            'password' => 'secret123',
        ])->assertCreated()->json('data.id');

        $emails = collect($this->withToken($token)->getJson('/api/platform/admins')->json('data'))
            ->pluck('email')->all();
        $this->assertContains('soporte@amaradental.mx', $emails);

        // Editar: cambiar nombre y desactivar (no es el último activo).
        $this->withToken($token)->patchJson("/api/platform/admins/{$newId}", [
            'name' => 'Soporte 2',
            'active' => false,
        ])->assertOk()->assertJsonPath('data.active', false);

        // Login con la contraseña sembrada debe funcionar... pero está inactivo.
        $this->postJson('/api/platform/auth/login', [
            'email' => 'soporte@amaradental.mx',
            'password' => 'secret123',
        ])->assertStatus(422);
    }

    public function test_admin_cannot_delete_or_deactivate_self(): void
    {
        $admin = PlatformAdmin::factory()->create();
        $token = $admin->createToken('test', ['platform'])->plainTextToken;

        $this->withToken($token)->deleteJson("/api/platform/admins/{$admin->id}")
            ->assertStatus(422);

        $this->withToken($token)->patchJson("/api/platform/admins/{$admin->id}", ['active' => false])
            ->assertStatus(422);
    }

    public function test_can_delete_another_admin(): void
    {
        $token = $this->platformToken(); // admin A (activo)
        $victim = PlatformAdmin::factory()->create();

        $this->withToken($token)->deleteJson("/api/platform/admins/{$victim->id}")
            ->assertOk();

        $this->assertDatabaseMissing('platform_admins', ['id' => $victim->id]);
    }

    // ── Borrado completo de clínica ────────────────────────────────────────

    public function test_delete_tenant_requires_matching_slug(): void
    {
        $token = $this->platformToken();
        $id = $this->withToken($token)->postJson('/api/platform/tenants', [
            'name' => 'Clínica Borrar',
            'admin_email' => 'admin@borrar.mx',
        ])->json('data.id');

        // Slug equivocado → 422, no borra.
        $this->withToken($token)->deleteJson("/api/platform/tenants/{$id}", [
            'confirm_slug' => 'otro-slug',
        ])->assertStatus(422);

        $this->assertDatabaseHas('tenants', ['id' => $id]);
    }

    public function test_delete_tenant_purges_all_its_data(): void
    {
        $token = $this->platformToken();
        $created = $this->withToken($token)->postJson('/api/platform/tenants', [
            'name' => 'Clínica Purga',
            'admin_email' => 'admin@purga.mx',
        ])->assertCreated()->json('data');

        $tenantId = $created['id'];
        $slug = $created['slug'];

        // Agrega un paciente dentro del contexto de esa clínica.
        $piloto = TenantContext::tenant(); // la clínica piloto fijada en setUp
        $tenant = Tenant::query()->find($tenantId);
        TenantContext::setTenant($tenant);
        $patient = Patient::factory()->create();
        TenantContext::setTenant($piloto); // restaura la piloto

        $this->assertDatabaseHas('patients', ['id' => $patient->id]);
        $this->assertDatabaseHas('users', ['tenant_id' => $tenantId]);

        // Borrado con slug correcto.
        $this->withToken($token)->deleteJson("/api/platform/tenants/{$tenantId}", [
            'confirm_slug' => $slug,
        ])->assertOk();

        $this->assertDatabaseMissing('tenants', ['id' => $tenantId]);
        $this->assertDatabaseMissing('users', ['tenant_id' => $tenantId]);
        $this->assertDatabaseMissing('patients', ['id' => $patient->id]);
    }
}
