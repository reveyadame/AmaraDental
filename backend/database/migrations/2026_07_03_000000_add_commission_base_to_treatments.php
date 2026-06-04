<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Comisión sobre utilidad: ciertos tratamientos (ej. implante) descuentan el
 * costo del insumo antes de calcular la comisión del especialista.
 *
 * - `treatments.commission_base`: 'price' (default, comportamiento actual) o
 *   'profit' (sobre `line_total - cost * quantity`).
 * - `treatments.cost`: costo del insumo a descontar por unidad.
 *
 * En `charge_items` se hace snapshot del modo y del costo usado, para que la
 * comisión quede congelada y auditable (no se recalcula).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('treatments', function (Blueprint $table): void {
            if (! Schema::hasColumn('treatments', 'commission_base')) {
                $table->string('commission_base', 16)->default('price')->after('commission_percent');
            }
            if (! Schema::hasColumn('treatments', 'cost')) {
                $table->decimal('cost', 12, 2)->default(0)->after('commission_base');
            }
        });

        Schema::table('charge_items', function (Blueprint $table): void {
            if (! Schema::hasColumn('charge_items', 'commission_base')) {
                $table->string('commission_base', 16)->nullable()->after('commission_percent');
            }
            if (! Schema::hasColumn('charge_items', 'commission_cost')) {
                $table->decimal('commission_cost', 12, 2)->default(0)->after('commission_base');
            }
        });
    }

    public function down(): void
    {
        Schema::table('treatments', function (Blueprint $table): void {
            if (Schema::hasColumn('treatments', 'cost')) {
                $table->dropColumn('cost');
            }
            if (Schema::hasColumn('treatments', 'commission_base')) {
                $table->dropColumn('commission_base');
            }
        });

        Schema::table('charge_items', function (Blueprint $table): void {
            if (Schema::hasColumn('charge_items', 'commission_cost')) {
                $table->dropColumn('commission_cost');
            }
            if (Schema::hasColumn('charge_items', 'commission_base')) {
                $table->dropColumn('commission_base');
            }
        });
    }
};
