<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Override de comisión por especialista para un tratamiento específico.
 *
 * Resolución en orden:
 *   1. treatment_specialist_commissions.commission_percent   (este registro)
 *   2. treatments.commission_percent                          (default del tratamiento)
 *   3. users.default_commission_percent                       (default del especialista)
 *   4. null / 0                                               (sin comisión)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('treatment_specialist_commissions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('treatment_id')->constrained()->cascadeOnDelete();
            $table->decimal('commission_percent', 5, 2);
            $table->timestamps();

            $table->unique(['tenant_id', 'user_id', 'treatment_id'], 'tsc_tenant_user_treatment_unique');
            $table->index(['tenant_id', 'user_id'], 'tsc_tenant_user_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('treatment_specialist_commissions');
    }
};
