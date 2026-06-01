<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Separa "tarjeta" en dos métodos: débito y crédito.
 *
 * - `card`         = tarjeta de débito (valor existente, no se renombra para
 *   no romper movimientos históricos)
 * - `card_credit`  = tarjeta de crédito (nuevo)
 *
 * Agrega además las columnas de conteo de cierre para tarjeta de crédito
 * en `cash_sessions`.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Ampliar el enum charge_payments.method si aún no contiene card_credit.
        $col = DB::selectOne(
            "SELECT COLUMN_TYPE as type
             FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = 'charge_payments'
               AND COLUMN_NAME = 'method'",
        );
        if ($col && stripos($col->type, "'card_credit'") === false) {
            DB::statement(
                "ALTER TABLE `charge_payments`
                 MODIFY COLUMN `method` ENUM('cash','card','transfer','credit','card_credit') NOT NULL",
            );
        }

        // Conteo del cierre para tarjeta de crédito.
        if (! Schema::hasColumn('cash_sessions', 'card_credit_counted')) {
            Schema::table('cash_sessions', function (Blueprint $table): void {
                $table->decimal('card_credit_counted', 12, 2)->nullable()
                    ->after('card_difference');
                $table->decimal('card_credit_expected', 12, 2)->nullable()
                    ->after('card_credit_counted');
                $table->decimal('card_credit_difference', 12, 2)->nullable()
                    ->after('card_credit_expected');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('cash_sessions', 'card_credit_counted')) {
            Schema::table('cash_sessions', function (Blueprint $table): void {
                $table->dropColumn([
                    'card_credit_counted',
                    'card_credit_expected',
                    'card_credit_difference',
                ]);
            });
        }
        // No revertimos el enum: dejarlo es seguro y revertirlo rompería
        // pagos históricos con method='card_credit'.
    }
};
