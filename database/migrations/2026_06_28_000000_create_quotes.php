<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Cotizaciones (presupuestos) emitidas a pacientes. Espejo del modelo de
 * `charges`, pero sin pagos ni saldos — una cotización es un compromiso
 * comercial previo, no un movimiento de caja.
 *
 * Cuando el paciente acepta, la cotización se convierte en un `charge`
 * normal y se conserva `converted_charge_id` para trazabilidad.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('quotes')) {
            Schema::create('quotes', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
                $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
                $table->foreignId('created_by_user_id')->constrained('users')->cascadeOnDelete();

                $table->string('code', 32)->nullable();

                $table->decimal('subtotal', 12, 2)->default(0);
                $table->decimal('discount_total', 12, 2)->default(0);
                $table->decimal('total', 12, 2)->default(0);

                // draft → editable libremente
                // sent → enviada al paciente (aún editable)
                // accepted → aceptada por el paciente (aún editable hasta convertir)
                // rejected → rechazada (no editable, conservada para historial)
                // converted → ya se generó el cobro asociado (no editable)
                $table->enum('status', ['draft', 'sent', 'accepted', 'rejected', 'converted'])
                    ->default('draft');

                $table->text('notes')->nullable();

                // Vigencia opcional de la cotización. Si pasa esta fecha y sigue
                // sin convertirse/aceptarse, la UI la muestra como "vencida".
                $table->date('valid_until')->nullable();

                $table->timestamp('sent_at')->nullable();
                $table->timestamp('accepted_at')->nullable();
                $table->timestamp('rejected_at')->nullable();
                $table->timestamp('converted_at')->nullable();

                // Trazabilidad al cobro generado al convertirla.
                $table->foreignId('converted_charge_id')->nullable()
                    ->constrained('charges')->nullOnDelete();

                $table->timestamps();
                $table->softDeletes();

                $table->index(['tenant_id', 'status']);
                $table->index(['tenant_id', 'patient_id']);
                $table->index(['tenant_id', 'created_at']);
            });
        }

        if (! Schema::hasTable('quote_items')) {
            Schema::create('quote_items', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
                $table->foreignId('quote_id')->constrained()->cascadeOnDelete();

                $table->foreignId('treatment_id')->nullable()
                    ->constrained('treatments')->nullOnDelete();
                $table->string('treatment_name');
                $table->string('treatment_code', 32)->nullable();

                $table->foreignId('specialist_id')->nullable()
                    ->constrained('specialists')->nullOnDelete();
                $table->string('specialist_name')->nullable();

                $table->unsignedInteger('quantity')->default(1);
                $table->decimal('unit_price', 12, 2);

                $table->foreignId('discount_id')->nullable()
                    ->constrained('discounts')->nullOnDelete();
                $table->decimal('discount_amount', 12, 2)->default(0);

                $table->decimal('line_total', 12, 2);

                $table->timestamps();

                $table->index(['tenant_id', 'quote_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('quote_items');
        Schema::dropIfExists('quotes');
    }
};
