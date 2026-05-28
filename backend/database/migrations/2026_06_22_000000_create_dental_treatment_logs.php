<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bitácora de tratamientos del odontograma: registro cronológico, con fecha,
 * de los tratamientos realizados a un paciente (opcionalmente ligados a un
 * diente y/o al catálogo de tratamientos). Es un complemento del expediente
 * clínico (NOM-004) — el detalle del estado por diente vive en tooth_states.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('dental_treatment_logs')) {
            return;
        }

        Schema::create('dental_treatment_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->unsignedTinyInteger('tooth_number')->nullable();
            $table->foreignId('treatment_id')->nullable()
                ->constrained('treatments')->nullOnDelete();
            $table->date('performed_on');
            $table->string('description');
            $table->text('notes')->nullable();
            $table->foreignId('created_by_user_id')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['tenant_id', 'patient_id', 'performed_on']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dental_treatment_logs');
    }
};
