<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Vuelve `date_of_birth` y `gender` nullables: ambos quedan en blanco en
 * altas rápidas desde agenda (paciente capturado como "primera vez"). Cuando
 * el expediente se completa, el controller los rellena y baja la bandera
 * `is_first_visit` automáticamente.
 *
 * Requiere doctrine/dbal para `->change()` en MySQL.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Detectar idempotencia: si ya son nullable, no hacer nada.
        $columns = DB::select(
            "SELECT COLUMN_NAME as name, IS_NULLABLE as is_nullable
             FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = 'patients'
               AND COLUMN_NAME IN ('date_of_birth', 'gender')",
        );

        $byName = [];
        foreach ($columns as $c) {
            $byName[$c->name] = strtoupper((string) $c->is_nullable) === 'YES';
        }

        $needsChange = (! ($byName['date_of_birth'] ?? false))
            || (! ($byName['gender'] ?? false));

        if (! $needsChange) {
            return;
        }

        Schema::table('patients', function (Blueprint $table): void {
            $table->date('date_of_birth')->nullable()->change();
            $table->enum('gender', ['M', 'F', 'Otro'])->nullable()->change();
        });
    }

    public function down(): void
    {
        // No revertimos: dejar nullable es seguro y revertir rompería
        // pacientes "primera vez" sin esos campos.
    }
};
