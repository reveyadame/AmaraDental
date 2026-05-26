<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Líneas de cobro. Snapshot del nombre y precio del tratamiento + comisión
 * efectiva resuelta al momento del cobro — así reportes históricos no se
 * mueven si después cambian las tarifas o las comisiones.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('charge_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('charge_id')->constrained()->cascadeOnDelete();

            $table->foreignId('treatment_id')->nullable()
                ->constrained('treatments')->nullOnDelete();
            $table->string('treatment_name');
            $table->string('treatment_code', 32)->nullable();

            $table->foreignId('specialist_user_id')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->string('specialist_name')->nullable();

            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('unit_price', 12, 2);

            $table->foreignId('discount_id')->nullable()
                ->constrained('discounts')->nullOnDelete();
            $table->decimal('discount_amount', 12, 2)->default(0);

            $table->decimal('line_total', 12, 2);

            $table->decimal('commission_percent', 5, 2)->nullable();
            $table->decimal('commission_amount', 12, 2)->default(0);

            $table->timestamps();

            $table->index(['tenant_id', 'charge_id']);
            $table->index(['tenant_id', 'specialist_user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('charge_items');
    }
};
