<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Tenant;
use Illuminate\Database\Seeder;

class TenantSeeder extends Seeder
{
    public function run(): void
    {
        Tenant::query()->updateOrCreate(
            ['id' => 1],
            [
                'name' => 'Clínica Piloto',
                'slug' => 'clinica-piloto',
                'brand_name' => 'Clínica Piloto',
                'color_primary' => 'oklch(0.546 0.215 262.881)',
                'color_primary_foreground' => 'oklch(0.985 0 0)',
                'color_secondary' => 'oklch(0.97 0 0)',
                'razon_social' => null,
                'rfc' => null,
                'address' => null,
                'phones' => [],
                'cedulas_clinica' => [],
                'timezone' => 'America/Mexico_City',
            ],
        );
    }
}
