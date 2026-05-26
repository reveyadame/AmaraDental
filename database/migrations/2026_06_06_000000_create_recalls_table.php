<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recalls', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();

            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('treatment_id')->constrained('treatments')->cascadeOnDelete();

            // Fecha sugerida para el próximo control / tratamiento.
            $table->date('due_on');

            // pending  → en la cola, falta agendar
            // scheduled → ya tiene cita asociada (scheduled_appointment_id)
            // completed → la cita ya ocurrió o el paciente regresó
            // dismissed → la recepcionista lo descartó (paciente declinó, etc.)
            $table->string('status', 16)->default('pending');

            // Trazabilidad: cobro que originó el recall (último tratamiento pagado).
            $table->foreignId('source_charge_id')->nullable()
                ->constrained('charges')->nullOnDelete();

            // Cita que se generó al agendarlo.
            $table->foreignId('scheduled_appointment_id')->nullable()
                ->constrained('appointments')->nullOnDelete();

            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'status', 'due_on']);
            $table->index(['tenant_id', 'patient_id']);
            // Para evitar duplicados al regenerar: solo puede haber un recall
            // activo (pending|scheduled) por paciente+tratamiento. Se aplica a
            // nivel de aplicación; el unique parcial no es trivial en MySQL.
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recalls');
    }
};
