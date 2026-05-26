<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Catálogo de especialistas. A diferencia del modelo previo, los especialistas
 * NO son usuarios del sistema: no inician sesión, no tienen contraseña ni
 * permisos. Son simplemente entradas de catálogo que se referencian desde
 * citas, recetas, cobros y pagos de comisión.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('specialists', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name', 160);
            $table->string('specialty', 120)->nullable();
            $table->string('cedula_profesional', 32)->nullable();
            $table->decimal('default_commission_percent', 5, 2)->nullable();
            $table->text('bio')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->index(['tenant_id', 'active']);
            $table->index(['tenant_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('specialists');
    }
};
