<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Catálogo de laboratorios externos con los que trabaja la clínica.
 * Las `lab_orders` apuntan a uno de aquí; conservamos `lab_name` como
 * snapshot en la orden para no perder la referencia si se renombra o
 * elimina el lab del catálogo.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('labs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();

            $table->string('name');
            $table->string('contact_name')->nullable();
            $table->string('phone', 32)->nullable();
            $table->string('email', 120)->nullable();
            $table->string('address')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'active']);
            $table->unique(['tenant_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('labs');
    }
};
