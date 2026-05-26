<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();

            // White-label / branding
            $table->string('brand_name')->nullable();
            $table->string('logo_url')->nullable();
            $table->string('color_primary')->default('oklch(0.546 0.215 262.881)');
            $table->string('color_primary_foreground')->default('oklch(0.985 0 0)');
            $table->string('color_secondary')->default('oklch(0.97 0 0)');

            // Datos fiscales / contacto (para recetas, recibos, encabezados — NOM-004)
            $table->string('razon_social')->nullable();
            $table->string('rfc', 13)->nullable();
            $table->text('address')->nullable();
            $table->json('phones')->nullable();
            $table->json('cedulas_clinica')->nullable();

            $table->string('timezone', 64)->default('America/Mexico_City');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
