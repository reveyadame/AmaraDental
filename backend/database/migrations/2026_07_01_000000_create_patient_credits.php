<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Saldo a favor del paciente (créditos).
 *
 * Cada fila es un movimiento — positivo cuando entra al saldo (sobrepago,
 * ajuste manual) y negativo cuando se consume (aplicado a un cobro). El
 * saldo actual de un paciente es la suma de sus movimientos.
 *
 * También extiende el enum `charge_payments.method` para incluir `credit`
 * (uso del saldo a favor como medio de pago de un cobro).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('patient_credits')) {
            Schema::create('patient_credits', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
                $table->foreignId('patient_id')->constrained()->cascadeOnDelete();

                // Positivo = entrada al saldo; negativo = consumo.
                $table->decimal('amount', 12, 2);

                // overpayment        — sobrepago en un cobro
                // applied_to_charge  — se usó el saldo al cobrar/abonar
                // manual_add         — ajuste manual (admin)
                // manual_remove      — ajuste manual (admin)
                // refund_overpayment — reverso de sobrepago al cancelar cobro
                // refund_application — reverso de aplicación al cancelar cobro
                $table->enum('source', [
                    'overpayment',
                    'applied_to_charge',
                    'manual_add',
                    'manual_remove',
                    'refund_overpayment',
                    'refund_application',
                ]);

                $table->foreignId('charge_id')->nullable()
                    ->constrained('charges')->nullOnDelete();
                $table->foreignId('charge_payment_id')->nullable()
                    ->constrained('charge_payments')->nullOnDelete();

                $table->text('notes')->nullable();
                $table->foreignId('created_by_user_id')->nullable()
                    ->constrained('users')->nullOnDelete();

                $table->timestamps();

                $table->index(['tenant_id', 'patient_id']);
                $table->index(['tenant_id', 'charge_id']);
            });
        }

        // Extender el ENUM de charge_payments.method para incluir 'credit'.
        // Solo lo hacemos si aún no está. Idempotente.
        $col = DB::selectOne(
            "SELECT COLUMN_TYPE as type
             FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = 'charge_payments'
               AND COLUMN_NAME = 'method'",
        );
        if ($col && stripos($col->type, "'credit'") === false) {
            DB::statement(
                "ALTER TABLE `charge_payments`
                 MODIFY COLUMN `method` ENUM('cash','card','transfer','credit') NOT NULL",
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('patient_credits');

        // No revertimos el enum: aunque queda con un valor extra, no rompe nada.
    }
};
