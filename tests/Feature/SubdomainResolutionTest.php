<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Resolución de tenant por subdominio (el camino de producción multi-tenant).
 * `clinicax.amaradental.mx` → tenant con slug `clinicax`.
 */
class SubdomainResolutionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->bootTenant(); // piloto: slug clinica-piloto, brand "Clínica Piloto"
        config(['tenancy.central_domains' => ['amaradental.mx']]);
    }

    private function makeTenant(string $slug, string $brand): void
    {
        Tenant::query()->create([
            'name' => $brand,
            'slug' => $slug,
            'brand_name' => $brand,
            'color_primary' => 'oklch(0.546 0.215 262.881)',
            'color_primary_foreground' => 'oklch(0.985 0 0)',
            'color_secondary' => 'oklch(0.97 0 0)',
            'phones' => [],
            'cedulas_clinica' => [],
            'timezone' => 'America/Mexico_City',
        ]);
    }

    public function test_resolves_tenant_by_its_subdomain(): void
    {
        $this->getJson('http://clinica-piloto.amaradental.mx/api/branding')
            ->assertOk()
            ->assertJsonPath('data.brand_name', 'Clínica Piloto');
    }

    public function test_each_subdomain_resolves_its_own_tenant(): void
    {
        $this->makeTenant('clinica-norte', 'Clínica Norte');

        $this->getJson('http://clinica-norte.amaradental.mx/api/branding')
            ->assertOk()
            ->assertJsonPath('data.brand_name', 'Clínica Norte');
    }

    public function test_unknown_subdomain_returns_404(): void
    {
        $this->getJson('http://noexiste.amaradental.mx/api/branding')->assertNotFound();
    }

    public function test_apex_domain_falls_back_to_default_tenant(): void
    {
        $this->getJson('http://amaradental.mx/api/branding')
            ->assertOk()
            ->assertJsonPath('data.brand_name', 'Clínica Piloto');
    }

    public function test_reserved_subdomain_falls_back_to_default_tenant(): void
    {
        // 'admin' es subdominio reservado → no es una clínica → default tenant.
        $this->getJson('http://admin.amaradental.mx/api/branding')
            ->assertOk()
            ->assertJsonPath('data.brand_name', 'Clínica Piloto');
    }
}
