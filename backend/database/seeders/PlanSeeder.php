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
        // El `stripe_price_id` (price_... del dashboard de Stripe) se toma de env
        // para no hardcodearlo. Defínelos tras crear los Prices en Stripe.
        $plans = [
            ['key' => 'esencial', 'name' => 'Esencial', 'max_patients' => 300, 'includes_app' => false, 'stripe_price_id' => env('STRIPE_PRICE_ESENCIAL'), 'sort_order' => 1],
            ['key' => 'crecimiento', 'name' => 'Crecimiento', 'max_patients' => 1000, 'includes_app' => false, 'stripe_price_id' => env('STRIPE_PRICE_CRECIMIENTO'), 'sort_order' => 2],
            ['key' => 'premium', 'name' => 'Premium', 'max_patients' => null, 'includes_app' => true, 'stripe_price_id' => env('STRIPE_PRICE_PREMIUM'), 'sort_order' => 3],
        ];

        foreach ($plans as $plan) {
            Plan::query()->updateOrCreate(['key' => $plan['key']], $plan);
        }
    }
}
