<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Ampliamos logo_url a TEXT para poder guardar `data:image/png;base64,...`
 * además de URLs externas. Esto permite subir el logo directamente desde
 * la pantalla de Configuración sin requerir storage externo todavía.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table): void {
            $table->text('logo_url')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table): void {
            $table->string('logo_url')->nullable()->change();
        });
    }
};
