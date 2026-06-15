<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Capa de plataforma (super-admin del SaaS):
 *  - `platform_admins`: operadores de Amara Dental. AISLADOS de `users` (staff
 *    de clínica) y de `patient_accounts`. Viven por encima de los tenants.
 *  - `tenants.status`: active | suspended. Una clínica suspendida no resuelve
 *    (ver ResolveTenant), salvo para las rutas de plataforma.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('platform_admins')) {
            Schema::create('platform_admins', function (Blueprint $table): void {
                $table->id();
                $table->string('name');
                $table->string('email')->unique();
                $table->string('password');
                $table->boolean('active')->default(true);
                $table->timestamp('last_login_at')->nullable();
                $table->rememberToken();
                $table->timestamps();
            });
        }

        if (! Schema::hasColumn('tenants', 'status')) {
            Schema::table('tenants', function (Blueprint $table): void {
                $table->string('status', 16)->default('active')->after('slug');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_admins');

        if (Schema::hasColumn('tenants', 'status')) {
            Schema::table('tenants', function (Blueprint $table): void {
                $table->dropColumn('status');
            });
        }
    }
};
