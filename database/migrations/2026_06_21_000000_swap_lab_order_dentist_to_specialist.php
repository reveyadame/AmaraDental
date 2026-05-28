<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Las órdenes de laboratorio referenciaban al dentista vía `dentist_user_id`
 * (FK a users), pero los especialistas dejaron de ser usuarios y viven en su
 * propio catálogo. Esto rompía el alta (validation.exists, porque el ID del
 * especialista no existe en users). Migramos a `specialist_id` (FK a
 * specialists), consistente con appointments/prescriptions/charge_items.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lab_orders', function (Blueprint $table): void {
            if (! Schema::hasColumn('lab_orders', 'specialist_id')) {
                $table->foreignId('specialist_id')->nullable()->after('treatment_id')
                    ->constrained('specialists')->nullOnDelete();
            }
        });

        if (Schema::hasColumn('lab_orders', 'dentist_user_id')) {
            Schema::table('lab_orders', function (Blueprint $table): void {
                // La FK debe soltarse antes de eliminar la columna.
                try {
                    $table->dropForeign(['dentist_user_id']);
                } catch (\Throwable) {
                    // La FK puede no existir en algunos entornos; seguimos.
                }
                $table->dropColumn('dentist_user_id');
            });
        }
    }

    public function down(): void
    {
        Schema::table('lab_orders', function (Blueprint $table): void {
            if (! Schema::hasColumn('lab_orders', 'dentist_user_id')) {
                $table->foreignId('dentist_user_id')->nullable()->after('treatment_id')
                    ->constrained('users')->nullOnDelete();
            }
        });

        if (Schema::hasColumn('lab_orders', 'specialist_id')) {
            Schema::table('lab_orders', function (Blueprint $table): void {
                try {
                    $table->dropForeign(['specialist_id']);
                } catch (\Throwable) {
                    // ignorar
                }
                $table->dropColumn('specialist_id');
            });
        }
    }
};
