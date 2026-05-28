<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Historia clínica de endodoncia: un registro por diente tratado, con
 * diagnóstico pulpar y periapical, pruebas de vitalidad, datos del tratamiento
 * de conductos y pronóstico. Complementa el expediente clínico (NOM-004).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('endodontic_records')) {
            return;
        }

        Schema::create('endodontic_records', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();

            $table->unsignedTinyInteger('tooth_number')->nullable();
            $table->date('performed_on')->nullable();
            $table->text('chief_complaint')->nullable();

            // Diagnóstico (AAE / clasificación clínica).
            $table->string('pulpal_diagnosis', 40)->nullable();
            $table->string('periapical_diagnosis', 40)->nullable();

            // Pruebas diagnósticas / vitalidad.
            $table->string('cold_test', 20)->nullable();
            $table->string('heat_test', 20)->nullable();
            $table->string('electric_test', 20)->nullable();
            $table->string('percussion', 20)->nullable();
            $table->string('palpation', 20)->nullable();
            $table->string('mobility', 4)->nullable();
            $table->text('radiographic_findings')->nullable();

            // Tratamiento de conductos.
            $table->unsignedTinyInteger('canals_count')->nullable();
            $table->string('working_length', 255)->nullable();
            $table->string('irrigation', 255)->nullable();
            $table->string('intracanal_medication', 255)->nullable();
            $table->string('obturation_technique', 120)->nullable();
            $table->string('sealer', 120)->nullable();
            $table->unsignedTinyInteger('sessions')->nullable();
            $table->string('prognosis', 20)->nullable();

            $table->text('treatment_plan')->nullable();
            $table->text('notes')->nullable();

            $table->foreignId('specialist_id')->nullable()
                ->constrained('specialists')->nullOnDelete();
            $table->foreignId('created_by_user_id')->nullable()
                ->constrained('users')->nullOnDelete();

            $table->timestamps();

            $table->index(['tenant_id', 'patient_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('endodontic_records');
    }
};
