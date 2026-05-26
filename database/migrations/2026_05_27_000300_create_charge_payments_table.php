<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pagos contra un cobro. Múltiples permitidos para soportar parcialidades.
 * Cada pago queda atado a la sesión de caja en que se registró — así el
 * arqueo y los reportes por turno cuadran.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('charge_payments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('charge_id')->constrained()->cascadeOnDelete();
            $table->foreignId('cash_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();

            $table->enum('method', ['cash', 'card', 'transfer']);
            $table->decimal('amount', 12, 2);
            $table->timestamp('paid_at');
            $table->string('reference', 120)->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index(['tenant_id', 'cash_session_id']);
            $table->index(['tenant_id', 'charge_id']);
            $table->index(['tenant_id', 'paid_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('charge_payments');
    }
};
