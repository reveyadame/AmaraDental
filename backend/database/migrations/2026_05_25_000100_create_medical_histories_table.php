<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medical_histories', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();

            // Antecedentes — listas configurables
            $table->json('chronic_conditions')->nullable();      // ["hipertension","diabetes_2",...]
            $table->json('allergies')->nullable();               // ["penicilina","latex",...]
            $table->json('current_medications')->nullable();     // ["losartan 50mg/dia",...]
            $table->text('previous_surgeries')->nullable();
            $table->text('family_history')->nullable();
            $table->text('dental_history')->nullable();

            $table->date('last_dental_visit')->nullable();

            // Hábitos
            $table->enum('pregnancy_status', ['no', 'si', 'posible', 'na'])->nullable();
            $table->boolean('smoker')->nullable();
            $table->boolean('alcohol_consumer')->nullable();

            // Signos vitales (última toma)
            $table->string('blood_pressure', 15)->nullable();    // "120/80"
            $table->unsignedSmallInteger('heart_rate')->nullable();
            $table->decimal('temperature', 4, 2)->nullable();
            $table->decimal('weight_kg', 5, 2)->nullable();
            $table->decimal('height_cm', 5, 2)->nullable();

            $table->text('notes')->nullable();

            $table->foreignId('updated_by_user_id')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();

            $table->unique('patient_id');
            $table->index(['tenant_id', 'patient_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medical_histories');
    }
};
