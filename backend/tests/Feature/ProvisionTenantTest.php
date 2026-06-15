<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Provisioning atómico de clínicas vía `php artisan tenant:provision`.
 */
class ProvisionTenantTest extends TestCase
{
    use RefreshDatabase;

    public function test_provisions_tenant_with_admin_and_roles(): void
    {
        $this->artisan('tenant:provision', [
            'name' => 'Clínica Sur',
            '--slug' => 'clinica-sur',
            '--admin-email' => 'admin@sur.mx',
            '--admin-password' => 'secret-123',
        ])->assertSuccessful();

        $tenant = Tenant::query()->where('slug', 'clinica-sur')->first();
        $this->assertNotNull($tenant);
        $this->assertSame('Clínica Sur', $tenant->brand_name);

        // El admin pertenece al tenant nuevo y tiene el rol admin.
        TenantContext::setTenant($tenant);
        $admin = User::query()->where('email', 'admin@sur.mx')->first();
        $this->assertNotNull($admin);
        $this->assertSame($tenant->id, $admin->tenant_id);
        $this->assertTrue($admin->hasRole('admin'));
        $this->assertTrue($admin->can('branding.manage')); // permisos vía rol
    }

    public function test_derives_slug_from_name_when_omitted(): void
    {
        $this->artisan('tenant:provision', [
            'name' => 'Dental Premium',
            '--admin-email' => 'admin@premium.mx',
        ])->assertSuccessful();

        $this->assertNotNull(Tenant::query()->where('slug', 'dental-premium')->first());
    }

    public function test_rejects_duplicate_slug(): void
    {
        $this->bootTenant(); // crea la clínica piloto (slug clinica-piloto)

        $this->artisan('tenant:provision', [
            'name' => 'Intento Duplicado',
            '--slug' => 'clinica-piloto',
            '--admin-email' => 'dup@x.mx',
        ])->assertFailed();
    }

    public function test_rejects_invalid_admin_email(): void
    {
        $this->artisan('tenant:provision', [
            'name' => 'Sin Email',
            '--admin-email' => 'no-es-un-email',
        ])->assertFailed();
    }
}
