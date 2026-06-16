<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

/**
 * Catálogo de planes. Los precios/límites/stripe ahora se editan desde el panel
 * de plataforma, así que el seeder SOLO crea los planes que falten — nunca pisa
 * lo que un super-admin haya ajustado (re-seed seguro). El backfill inicial de
 * precios para clínicas previas lo hace la migración add_price_to_plans.
 */
class PlanSeeder extends Seeder
{
    public function run(): void
    {
        // El `stripe_price_id` (price_... del dashboard de Stripe) se toma de env
        // para no hardcodearlo. Defínelos tras crear los Prices en Stripe.
        $plans = [
            ['key' => 'esencial', 'name' => 'Esencial', 'max_patients' => 300, 'includes_app' => false, 'price_mxn' => 499, 'stripe_price_id' => env('STRIPE_PRICE_ESENCIAL'), 'sort_order' => 1],
            ['key' => 'crecimiento', 'name' => 'Crecimiento', 'max_patients' => 1000, 'includes_app' => false, 'price_mxn' => 699, 'stripe_price_id' => env('STRIPE_PRICE_CRECIMIENTO'), 'sort_order' => 2],
            ['key' => 'premium', 'name' => 'Premium', 'max_patients' => null, 'includes_app' => true, 'price_mxn' => 999, 'stripe_price_id' => env('STRIPE_PRICE_PREMIUM'), 'sort_order' => 3],
        ];

        foreach ($plans as $plan) {
            // firstOrCreate: si ya existe, lo deja intacto (respeta ediciones del panel).
            Plan::query()->firstOrCreate(['key' => $plan['key']], $plan);
        }
    }
}
