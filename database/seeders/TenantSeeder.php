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
                'color_primary' => '#1ba4c6',
                'color_primary_foreground' => '#ffffff',
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
