<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Portal de pacientes (app móvil): acceso de cara al paciente, separado del
 * registro clínico `patients` para no mezclar estado de sesión con el
 * expediente (NOM-004).
 *
 *  - `patient_accounts`: acceso del paciente a la app. 1:1 con un Patient de la
 *    misma clínica. Solo existe para pacientes invitados por el staff.
 *  - `patient_login_codes`: códigos OTP de un solo uso (login passwordless por
 *    email). Se guardan hasheados.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('patient_accounts')) {
            Schema::create('patient_accounts', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
                $table->foreignId('patient_id')->constrained()->cascadeOnDelete();

                // Identificador de login (hoy el email del paciente).
                $table->string('identifier');
                $table->string('channel', 16)->default('email');
                $table->enum('status', ['pending', 'active', 'blocked'])->default('pending');
                $table->timestamp('last_login_at')->nullable();

                $table->timestamps();

                $table->unique(['tenant_id', 'patient_id']);
                $table->index(['tenant_id', 'identifier']);
            });
        }

        if (! Schema::hasTable('patient_login_codes')) {
            Schema::create('patient_login_codes', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
                $table->foreignId('patient_account_id')->constrained()->cascadeOnDelete();

                $table->string('identifier');
                $table->string('code_hash');
                $table->string('channel', 16)->default('email');
                $table->timestamp('expires_at');
                $table->timestamp('consumed_at')->nullable();
                $table->unsignedTinyInteger('attempts')->default(0);

                $table->timestamps();

                $table->index(['tenant_id', 'identifier']);
                $table->index(['patient_account_id', 'consumed_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('patient_login_codes');
        Schema::dropIfExists('patient_accounts');
    }
};
