<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Support\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Autorización transversal: deny-by-default (sin roles no se puede nada),
 * 401 sin sesión, y gating de acciones sensibles (branding, caja, cancelar).
 */
class AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->bootTenant();
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/charges')->assertUnauthorized();
    }

    public function test_user_without_roles_is_denied_by_default(): void
    {
        $this->actingAsUserWithRoles(); // sin roles

        $this->getJson('/api/charges')->assertForbidden();
    }

    public function test_caja_role_can_list_charges(): void
    {
        $this->actingAsUserWithRoles('caja');

        $this->getJson('/api/charges')->assertSuccessful();
    }

    public function test_non_admin_cannot_open_cash_session(): void
    {
        // 'reportes' puede ver caja pero no operarla.
        $this->actingAsUserWithRoles('reportes');

        $this->postJson('/api/cash-sessions', ['opening_amount' => 0])
            ->assertForbidden();
    }

    public function test_only_admin_can_update_branding(): void
    {
        // Caja no tiene branding.manage.
        $this->actingAsUserWithRoles('caja');
        $this->putJson('/api/branding', ['brand_name' => 'Hackeado'])
            ->assertForbidden();

        // Admin sí.
        $this->actingAsUserWithRoles('admin');
        $this->putJson('/api/branding', ['brand_name' => 'Mi Clínica'])
            ->assertSuccessful();
    }

    public function test_non_admin_cannot_cancel_a_charge(): void
    {
        // caja crea cobros pero no puede cancelarlos (charges.cancel es admin).
        $this->actingAsUserWithRoles('caja');

        // Creamos un cobro directo en BD (sin pagos) para intentar cancelarlo.
        $patient = \App\Models\Patient::factory()->create();
        $charge = \App\Models\Charge::query()->create([
            'tenant_id' => TenantContext::tenantId(),
            'patient_id' => $patient->id,
            'created_by_user_id' => \Illuminate\Support\Facades\Auth::id(),
            'status' => 'pending',
        ]);

        $this->postJson("/api/charges/{$charge->id}/cancel")
            ->assertForbidden();
    }

    public function test_users_share_tenant_and_roles_resolve_permissions(): void
    {
        $user = $this->actingAsUserWithRoles('caja');

        // El usuario pertenece al tenant piloto y sus permisos vienen del rol.
        $this->assertSame(1, $user->tenant_id);
        $this->assertTrue($user->can('charges.create'));
        $this->assertFalse($user->can('charges.cancel'));
    }

    // ── Puerta admin-only consolidada (requireAdmin) ───────────────────────
    // Cubren el guard compartido desde dos controllers distintos.

    public function test_non_admin_cannot_delete_a_specialist(): void
    {
        $this->actingAsUserWithRoles('catalogos'); // gestiona catálogos, no es admin
        $specialist = \App\Models\Specialist::factory()->create();

        $this->deleteJson("/api/specialists/{$specialist->id}")->assertForbidden();
    }

    public function test_admin_can_delete_a_specialist(): void
    {
        $this->actingAsUserWithRoles('admin');
        $specialist = \App\Models\Specialist::factory()->create();

        $this->deleteJson("/api/specialists/{$specialist->id}")->assertSuccessful();
        $this->assertFalse((bool) $specialist->refresh()->active);
    }

    public function test_non_admin_cannot_view_audit_log(): void
    {
        $this->actingAsUserWithRoles('caja');
        $this->getJson('/api/audits')->assertForbidden();
    }

    public function test_admin_can_view_audit_log(): void
    {
        $this->actingAsUserWithRoles('admin');
        $this->getJson('/api/audits')->assertSuccessful();
    }
}
