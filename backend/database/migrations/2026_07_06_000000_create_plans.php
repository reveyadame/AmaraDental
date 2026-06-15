<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * SaaS modular por suscripción:
 *  - `plans`: catálogo de planes. `max_patients` null = ilimitado.
 *    `includes_app` habilita el portal/app de pacientes.
 *  - `tenants.plan_id`: el plan de cada clínica. NULL = sin restricción
 *    (clínicas grandfathered antes de los planes → ilimitado + app).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('plans')) {
            Schema::create('plans', function (Blueprint $table): void {
                $table->id();
                $table->string('key')->unique();
                $table->string('name');
                $table->unsignedInteger('max_patients')->nullable(); // null = ilimitado
                $table->boolean('includes_app')->default(false);
                $table->unsignedSmallInteger('sort_order')->default(0);
                $table->timestamps();
            });
        }

        if (! Schema::hasColumn('tenants', 'plan_id')) {
            Schema::table('tenants', function (Blueprint $table): void {
                $table->foreignId('plan_id')->nullable()->after('status')
                    ->constrained('plans')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('tenants', 'plan_id')) {
            Schema::table('tenants', function (Blueprint $table): void {
                $table->dropConstrainedForeignId('plan_id');
            });
        }

        Schema::dropIfExists('plans');
    }
};
