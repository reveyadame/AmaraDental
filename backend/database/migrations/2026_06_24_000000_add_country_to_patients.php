<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * País del paciente (clave ISO-2: MX, US). El estado pasa a seleccionarse de
 * un catálogo filtrado por país en el frontend, pero se sigue guardando como
 * texto en la columna `state` existente.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('patients', function (Blueprint $table): void {
            if (! Schema::hasColumn('patients', 'country')) {
                $table->string('country', 2)->nullable()->after('state');
            }
        });
    }

    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table): void {
            $table->dropColumn('country');
        });
    }
};
