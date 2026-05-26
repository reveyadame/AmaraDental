<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tipografía global de la app, por tenant. Guardamos la *clave* (ej. "inter",
 * "roboto"); el frontend resuelve la familia CSS y carga la fuente si es de
 * Google Fonts. Null = Inter (default).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table): void {
            $table->string('font_family', 40)->nullable()->after('prescription_layout');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table): void {
            $table->dropColumn('font_family');
        });
    }
};
