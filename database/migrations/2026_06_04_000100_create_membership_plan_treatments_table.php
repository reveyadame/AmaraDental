<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('membership_plan_treatments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();

            $table->foreignId('membership_plan_id')->constrained('membership_plans')->cascadeOnDelete();
            $table->foreignId('treatment_id')->constrained('treatments')->cascadeOnDelete();

            // null  → incluido sin costo (equivale a 100%)
            // 0     → cubierto al precio del catálogo, sin descuento (raro pero válido)
            // 1-100 → porcentaje de descuento sobre el precio del catálogo
            $table->decimal('discount_percent', 5, 2)->nullable();

            // Veces que puede usarse al año dentro del plan (null = ilimitado).
            $table->unsignedSmallInteger('annual_quota')->nullable();

            $table->timestamps();

            $table->unique(['membership_plan_id', 'treatment_id'], 'mpt_plan_treatment_unique');
            $table->index(['tenant_id', 'treatment_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('membership_plan_treatments');
    }
};
