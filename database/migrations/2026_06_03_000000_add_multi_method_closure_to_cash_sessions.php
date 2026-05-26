<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Cierre de caja multi-método. Las columnas existentes (closing_amount,
 * expected_cash, difference) se quedan como las cifras de EFECTIVO. Las
 * nuevas guardan lo registrado/contado y la diferencia para tarjeta y
 * transferencia — útiles para conciliar contra el reporte de la terminal
 * de tarjetas y los depósitos bancarios.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cash_sessions', function (Blueprint $table): void {
            $table->decimal('card_counted', 12, 2)->nullable()->after('difference');
            $table->decimal('card_expected', 12, 2)->nullable()->after('card_counted');
            $table->decimal('card_difference', 12, 2)->nullable()->after('card_expected');
            $table->decimal('transfer_counted', 12, 2)->nullable()->after('card_difference');
            $table->decimal('transfer_expected', 12, 2)->nullable()->after('transfer_counted');
            $table->decimal('transfer_difference', 12, 2)->nullable()->after('transfer_expected');
        });
    }

    public function down(): void
    {
        Schema::table('cash_sessions', function (Blueprint $table): void {
            $table->dropColumn([
                'card_counted',
                'card_expected',
                'card_difference',
                'transfer_counted',
                'transfer_expected',
                'transfer_difference',
            ]);
        });
    }
};
