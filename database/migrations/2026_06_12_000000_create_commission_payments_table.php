<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Registro de pagos de comisiones a especialistas. Cada pago agrupa uno o
 * más `charge_items` cuya comisión ya se liquidó, y opcionalmente puede
 * generar un `CashExpense` si se pagó desde la caja del día.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commission_payments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();

            $table->foreignId('specialist_user_id')->constrained('users')->restrictOnDelete();
            $table->dateTime('paid_at');
            $table->decimal('amount', 12, 2);
            $table->string('method', 16); // cash | card | transfer
            $table->string('reference', 120)->nullable();
            $table->text('notes')->nullable();

            $table->foreignId('cash_session_id')->nullable()
                ->constrained('cash_sessions')->nullOnDelete();
            $table->foreignId('cash_expense_id')->nullable()
                ->constrained('cash_expenses')->nullOnDelete();

            $table->foreignId('created_by_user_id')->constrained('users')->restrictOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'specialist_user_id', 'paid_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commission_payments');
    }
};
