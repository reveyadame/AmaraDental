<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Precio mensual de referencia del plan (MXN, enteros). Es solo para mostrar en
 * el panel: Stripe sigue siendo la fuente de verdad del cobro (stripe_price_id).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table): void {
            if (! Schema::hasColumn('plans', 'price_mxn')) {
                $table->unsignedInteger('price_mxn')->nullable()->after('includes_app');
            }
        });

        // Backfill de precios acordados para los planes ya existentes en prod.
        foreach (['esencial' => 499, 'crecimiento' => 699, 'premium' => 999] as $key => $price) {
            DB::table('plans')->where('key', $key)->whereNull('price_mxn')->update(['price_mxn' => $price]);
        }
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table): void {
            if (Schema::hasColumn('plans', 'price_mxn')) {
                $table->dropColumn('price_mxn');
            }
        });
    }
};
