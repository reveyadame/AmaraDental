<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

/**
 * Catálogo de planes. Idempotente (updateOrCreate por `key`). Los números son
 * el punto de partida acordado y se pueden ajustar luego.
 */
class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            ['key' => 'esencial', 'name' => 'Esencial', 'max_patients' => 300, 'includes_app' => false, 'sort_order' => 1],
            ['key' => 'crecimiento', 'name' => 'Crecimiento', 'max_patients' => 1000, 'includes_app' => false, 'sort_order' => 2],
            ['key' => 'premium', 'name' => 'Premium', 'max_patients' => null, 'includes_app' => true, 'sort_order' => 3],
        ];

        foreach ($plans as $plan) {
            Plan::query()->updateOrCreate(['key' => $plan['key']], $plan);
        }
    }
}
