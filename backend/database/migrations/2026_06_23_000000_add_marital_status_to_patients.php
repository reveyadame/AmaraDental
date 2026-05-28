<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Estado civil del paciente (dato demográfico del expediente, NOM-004).
 * Opcional: se guarda como clave corta (soltero, casado, union_libre, ...).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('patients', function (Blueprint $table): void {
            if (! Schema::hasColumn('patients', 'marital_status')) {
                $table->string('marital_status', 20)->nullable()->after('gender');
            }
        });
    }

    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table): void {
            $table->dropColumn('marital_status');
        });
    }
};
