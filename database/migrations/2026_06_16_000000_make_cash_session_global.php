<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Caja global por tenant:
 *
 * - Hoy cada usuario tiene su propia sesión abierta. Migramos a una única caja
 *   global por tenant: cualquiera con `cash.operate` la opera y la cierra.
 * - Cualquier sesión que esté abierta al correr esta migración se cierra con
 *   monto = 0 para garantizar el invariante "máximo una sesión abierta por
 *   tenant" a partir de ahora.
 * - Agregamos `closed_by_user_id` para registrar quién cerró (`user_id` sigue
 *   siendo quién abrió).
 */
return new class extends Migration
{
    public function up(): void
    {
        // 1. Cerrar todas las sesiones abiertas existentes.
        DB::table('cash_sessions')
            ->where('status', 'open')
            ->update([
                'status' => 'closed',
                'closed_at' => now(),
                'closing_amount' => 0,
                'expected_cash' => 0,
                'difference' => 0,
                'card_counted' => 0,
                'transfer_counted' => 0,
                'close_notes' => 'Migración a caja global — cierre automático',
                'updated_at' => now(),
            ]);

        // 2. Agregar columna closed_by_user_id.
        Schema::table('cash_sessions', function (Blueprint $table): void {
            $table->foreignId('closed_by_user_id')
                ->nullable()
                ->after('user_id')
                ->constrained('users')
                ->nullOnDelete();
            $table->index(['tenant_id', 'closed_by_user_id']);
        });
    }

    public function down(): void
    {
        Schema::table('cash_sessions', function (Blueprint $table): void {
            $table->dropIndex(['tenant_id', 'closed_by_user_id']);
            $table->dropConstrainedForeignId('closed_by_user_id');
        });
    }
};
