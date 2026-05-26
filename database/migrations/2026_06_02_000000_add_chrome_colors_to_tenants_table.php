<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Sube logo_url a MEDIUMTEXT (TEXT solo soporta ~65 KB; un PNG decente
 * en base64 lo desborda) y agrega colores propios para sidebar y header
 * de la app — el foreground se infiere automáticamente del background
 * en el ThemeProvider del frontend.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table): void {
            $table->mediumText('logo_url')->nullable()->change();
            $table->string('color_sidebar', 64)->nullable()->after('color_secondary');
            $table->string('color_header', 64)->nullable()->after('color_sidebar');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table): void {
            $table->dropColumn(['color_sidebar', 'color_header']);
            $table->text('logo_url')->nullable()->change();
        });
    }
};
