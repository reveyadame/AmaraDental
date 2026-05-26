<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Estado del odontograma por paciente. Un registro por par
 * (patient_id, tooth_number) que persiste el estado global del diente y el
 * estado por cara (oclusal/incisal, mesial, distal, vestibular, lingual).
 *
 * Numeración FDI:
 *   Permanente: 11-18, 21-28, 31-38, 41-48 (32 dientes)
 *   Decidua:    51-55, 61-65, 71-75, 81-85 (20 dientes) — listo para fase 2
 *
 * Cada cambio queda registrado en audits gracias a OwenIt\Auditing (NOM-024).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tooth_states', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();

            $table->unsignedSmallInteger('tooth_number');
            $table->enum('dentition_type', ['permanent', 'deciduous'])->default('permanent');

            $table->string('whole_state', 32)->nullable();
            $table->json('faces')->nullable();

            $table->text('notes')->nullable();

            $table->foreignId('updated_by_user_id')->nullable()
                ->constrained('users')->nullOnDelete();

            $table->timestamps();

            $table->unique(['tenant_id', 'patient_id', 'tooth_number'], 'ts_tenant_patient_tooth_uq');
            $table->index(['tenant_id', 'patient_id'], 'ts_tenant_patient_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tooth_states');
    }
};
