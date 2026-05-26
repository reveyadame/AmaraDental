<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('membership_plans', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();

            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('annual_price', 12, 2);
            $table->unsignedSmallInteger('valid_months')->default(12);

            // Descuento por defecto sobre tratamientos del catálogo NO listados en el plan.
            // 0 = sin descuento general (solo aplican los del pivot).
            $table->decimal('default_discount_percent', 5, 2)->default(0);

            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('membership_plans');
    }
};
