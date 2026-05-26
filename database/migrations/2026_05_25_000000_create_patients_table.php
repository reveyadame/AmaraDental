<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patients', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();

            // Identificación (NOM-004)
            $table->string('first_name');
            $table->string('last_name');
            $table->date('date_of_birth');
            $table->enum('gender', ['M', 'F', 'Otro']);
            $table->string('curp', 18)->nullable();
            $table->string('rfc', 13)->nullable();

            // Contacto
            $table->string('email')->nullable();
            $table->string('phone', 32)->nullable();
            $table->string('mobile_phone', 32)->nullable();

            // Domicilio
            $table->text('address')->nullable();
            $table->string('city', 120)->nullable();
            $table->string('state', 120)->nullable();
            $table->string('postal_code', 10)->nullable();

            // Contacto de emergencia
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone', 32)->nullable();

            // Otros
            $table->string('occupation', 120)->nullable();
            $table->string('referred_by', 160)->nullable();
            $table->text('notes')->nullable();

            $table->boolean('active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'last_name', 'first_name']);
            $table->index(['tenant_id', 'created_at']);
            $table->unique(['tenant_id', 'curp']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};
