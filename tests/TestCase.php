<?php

namespace Tests;

use App\Models\Tenant;
use App\Models\User;
use App\Support\TenantContext;
use Database\Seeders\PlanSeeder;
use Database\Seeders\RoleSeeder;
use Database\Seeders\TenantSeeder;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Blindaje crítico: los tests SIEMPRE corren contra una base MySQL de
     * pruebas aparte (`ciodent_testing`), NUNCA contra la de desarrollo
     * (`ciodent`). Las migraciones usan SQL específico de MySQL
     * (information_schema), así que no se puede usar sqlite.
     *
     * En Laravel 11 el override por env del phpunit.xml NO basta cuando
     * docker-compose fija DB_CONNECTION/DB_DATABASE como variables de entorno;
     * sin esto, `RefreshDatabase` borraría la base de desarrollo.
     */
    protected function refreshApplication(): void
    {
        parent::refreshApplication();

        config(['database.connections.mysql.database' => 'ciodent_testing']);
        \Illuminate\Support\Facades\DB::purge('mysql');
    }

    /**
     * Siembra el tenant piloto (id=1) + roles/permisos y fija el TenantContext,
     * de modo que los modelos creados por factory autorrellenen tenant_id.
     *
     * Llamar al inicio de cada test de feature que toque modelos de negocio.
     */
    protected function bootTenant(): Tenant
    {
        $this->seed(PlanSeeder::class);
        $this->seed(TenantSeeder::class);
        $this->seed(RoleSeeder::class);

        $tenant = Tenant::query()->findOrFail(1);
        TenantContext::setTenant($tenant);

        return $tenant;
    }

    /**
     * Crea un usuario del tenant activo con los roles indicados y lo deja
     * autenticado vía el guard sanctum (el que protege la API).
     *
     * @param  string  ...$roles  nombres de rol de la matriz (ej. 'caja', 'admin')
     */
    protected function actingAsUserWithRoles(string ...$roles): User
    {
        /** @var User $user */
        $user = User::factory()->create();

        if ($roles !== []) {
            $user->assignRole($roles);
        }

        $this->actingAs($user, 'sanctum');

        return $user;
    }
}
