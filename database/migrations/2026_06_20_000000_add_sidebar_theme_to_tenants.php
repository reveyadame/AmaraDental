<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Colores finos del menú lateral para white-label: además del fondo del
 * sidebar (color_sidebar), el tenant puede personalizar el fondo de cada
 * ítem, su texto, el hover y el estado activo. Todos opcionales: si quedan
 * nulos, la UI cae a los defaults derivados del tema.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table): void {
            // Idempotente por si la columna ya existe en algún entorno.
            if (! Schema::hasColumn('tenants', 'sidebar_item_bg')) {
                $table->string('sidebar_item_bg', 64)->nullable()->after('color_sidebar');
            }
            if (! Schema::hasColumn('tenants', 'sidebar_item_color')) {
                $table->string('sidebar_item_color', 64)->nullable()->after('sidebar_item_bg');
            }
            if (! Schema::hasColumn('tenants', 'sidebar_hover_bg')) {
                $table->string('sidebar_hover_bg', 64)->nullable()->after('sidebar_item_color');
            }
            if (! Schema::hasColumn('tenants', 'sidebar_active_bg')) {
                $table->string('sidebar_active_bg', 64)->nullable()->after('sidebar_hover_bg');
            }
            if (! Schema::hasColumn('tenants', 'sidebar_active_color')) {
                $table->string('sidebar_active_color', 64)->nullable()->after('sidebar_active_bg');
            }
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table): void {
            $table->dropColumn([
                'sidebar_item_bg',
                'sidebar_item_color',
                'sidebar_hover_bg',
                'sidebar_active_bg',
                'sidebar_active_color',
            ]);
        });
    }
};
