<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Preferencias visuales para imprimir recetas. Permiten elegir tamaño de
 * papel, modo (diseño completo vs. solo posicionamiento sobre papel
 * membretado), imagen de fondo y márgenes superiores configurables.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table): void {
            // letter | letter_landscape | half_letter | half_letter_landscape
            $table->string('prescription_paper_size', 24)->default('letter')->after('ticket_auto_print');
            // design = la app dibuja encabezado y bordes
            // preprinted = solo coloca el contenido (para hojas membretadas físicas)
            $table->string('prescription_mode', 16)->default('design')->after('prescription_paper_size');
            // Imagen de fondo opcional (data URI base64 o URL); útil tanto para
            // diseño bonito como para mostrar el membrete en pantalla.
            $table->mediumText('prescription_background_url')->nullable()->after('prescription_mode');
            // Margen superior en mm (espacio que se reserva para el membrete
            // físico cuando mode = preprinted).
            $table->unsignedSmallInteger('prescription_margin_top_mm')->default(15)
                ->after('prescription_background_url');
            // Acomodo del contenido: standard | compact
            $table->string('prescription_layout', 16)->default('standard')
                ->after('prescription_margin_top_mm');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table): void {
            $table->dropColumn([
                'prescription_paper_size',
                'prescription_mode',
                'prescription_background_url',
                'prescription_margin_top_mm',
                'prescription_layout',
            ]);
        });
    }
};
