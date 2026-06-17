<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Marca Amara por defecto: las clínicas que aún tienen el azul clínico genérico
 * (el default histórico, NO personalizado) pasan al teal de Amara. Las clínicas
 * que ya eligieron otro color quedan intactas (white-label respetado).
 */
return new class extends Migration
{
    private const OLD_BLUE = 'oklch(0.546 0.215 262.881)';

    public function up(): void
    {
        DB::table('tenants')
            ->where('color_primary', self::OLD_BLUE)
            ->update([
                'color_primary' => '#1ba4c6',
                'color_primary_foreground' => '#ffffff',
            ]);
    }

    public function down(): void
    {
        // Revierte solo las que quedaron exactamente en el teal de Amara.
        DB::table('tenants')
            ->where('color_primary', '#1ba4c6')
            ->update([
                'color_primary' => self::OLD_BLUE,
                'color_primary_foreground' => 'oklch(0.985 0 0)',
            ]);
    }
};
