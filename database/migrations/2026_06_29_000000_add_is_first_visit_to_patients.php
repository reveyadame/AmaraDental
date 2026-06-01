<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bandera "de primera vez": el paciente fue capturado rápidamente desde la
 * agenda (típicamente solo nombre + teléfono). Se baja automáticamente
 * cuando alguien completa los campos obligatorios del expediente
 * (date_of_birth y gender — base de la NOM-004).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('patients', 'is_first_visit')) {
            return;
        }

        Schema::table('patients', function (Blueprint $table): void {
            $table->boolean('is_first_visit')->default(false)->after('active');
            $table->index(['tenant_id', 'is_first_visit']);
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('patients', 'is_first_visit')) {
            return;
        }

        Schema::table('patients', function (Blueprint $table): void {
            $table->dropIndex(['tenant_id', 'is_first_visit']);
            $table->dropColumn('is_first_visit');
        });
    }
};
