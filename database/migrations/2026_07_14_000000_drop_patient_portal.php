<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Se elimina el portal/app de pacientes del producto: ya no hay acceso del
 * paciente final ni módulo de plan que lo habilite.
 *
 *  - Tira `patient_login_codes` y `patient_accounts` (creadas en
 *    2026_07_04_000000_create_patient_portal, migración ya retirada).
 *  - Borra los tokens Sanctum emitidos a esas cuentas, que quedarían huérfanos
 *    en `personal_access_tokens` (tabla de infraestructura, no tenant-scoped).
 *  - Quita `plans.includes_app`: los planes ya solo se diferencian por límite
 *    de pacientes y precio.
 *
 * Idempotente: en una base nueva (donde el portal nunca existió) es un no-op.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('personal_access_tokens')
            ->where('tokenable_type', 'App\Models\PatientAccount')
            ->delete();

        // Primero la hija: patient_login_codes tiene FK a patient_accounts.
        Schema::dropIfExists('patient_login_codes');
        Schema::dropIfExists('patient_accounts');

        if (Schema::hasColumn('plans', 'includes_app')) {
            Schema::table('plans', function (Blueprint $table): void {
                $table->dropColumn('includes_app');
            });
        }
    }

    public function down(): void
    {
        // Solo se restituye la columna del plan. Las cuentas de pacientes y sus
        // códigos OTP no se recrean: el feature se retiró del producto.
        if (! Schema::hasColumn('plans', 'includes_app')) {
            Schema::table('plans', function (Blueprint $table): void {
                $table->boolean('includes_app')->default(false)->after('max_patients');
            });
        }
    }
};
