<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Color de acento opcional. Si está, sobreescribe `--accent` y se usa para
 * detalles secundarios en la UI (cards, bordes decorativos del dashboard,
 * gráficas). Si está vacío, cae al accent default del tema.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table): void {
            $table->string('color_accent', 64)->nullable()->after('color_header');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table): void {
            $table->dropColumn('color_accent');
        });
    }
};
