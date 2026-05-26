<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Preferencias de impresión para tickets de pago (impresora térmica).
 * Los navegadores no permiten seleccionar la impresora desde JS, pero
 * sí podemos controlar el ancho del papel, qué incluye el ticket y si
 * el ticket aparece automáticamente al registrar un pago.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table): void {
            // '58mm' o '80mm' — define el @page del CSS al imprimir.
            $table->string('ticket_width', 8)->default('80mm')->after('color_accent');
            $table->boolean('ticket_show_logo')->default(true)->after('ticket_width');
            $table->boolean('ticket_show_address')->default(true)->after('ticket_show_logo');
            $table->boolean('ticket_show_cedulas')->default(false)->after('ticket_show_address');
            // Mensaje extra al pie (líneas separadas por \n).
            $table->text('ticket_footer_message')->nullable()->after('ticket_show_cedulas');
            // Si true, al registrar un pago se abre directo el ticket.
            $table->boolean('ticket_auto_print')->default(false)->after('ticket_footer_message');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table): void {
            $table->dropColumn([
                'ticket_width',
                'ticket_show_logo',
                'ticket_show_address',
                'ticket_show_cedulas',
                'ticket_footer_message',
                'ticket_auto_print',
            ]);
        });
    }
};
