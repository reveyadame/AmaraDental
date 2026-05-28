<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * En endodoncia el campo de notas libres se reemplaza por una bitácora del
 * tratamiento: lista de acciones realizadas con fecha (sesiones), guardada
 * como JSON en el propio registro.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('endodontic_records', function (Blueprint $table): void {
            if (! Schema::hasColumn('endodontic_records', 'treatment_log')) {
                $table->json('treatment_log')->nullable()->after('treatment_plan');
            }
            if (Schema::hasColumn('endodontic_records', 'notes')) {
                $table->dropColumn('notes');
            }
        });
    }

    public function down(): void
    {
        Schema::table('endodontic_records', function (Blueprint $table): void {
            if (! Schema::hasColumn('endodontic_records', 'notes')) {
                $table->text('notes')->nullable()->after('treatment_plan');
            }
            if (Schema::hasColumn('endodontic_records', 'treatment_log')) {
                $table->dropColumn('treatment_log');
            }
        });
    }
};
