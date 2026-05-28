<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Diagnóstico general del odontograma: un resumen clínico de la dentadura del
 * paciente. Se guarda en el paciente (auditable, NOM-024) y se administra
 * desde los endpoints del odontograma.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('patients', function (Blueprint $table): void {
            if (! Schema::hasColumn('patients', 'odontogram_diagnosis')) {
                $table->text('odontogram_diagnosis')->nullable()->after('notes');
            }
        });
    }

    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table): void {
            $table->dropColumn('odontogram_diagnosis');
        });
    }
};
