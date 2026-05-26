<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->foreignId('tenant_id')->after('id')->constrained()->cascadeOnDelete();
            // Email único por tenant, no globalmente: dos clínicas pueden tener
            // un dentista con el mismo correo personal.
            $table->dropUnique(['email']);
            $table->unique(['tenant_id', 'email']);
            $table->index(['tenant_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropIndex(['tenant_id', 'created_at']);
            $table->dropUnique(['tenant_id', 'email']);
            $table->unique('email');
            $table->dropConstrainedForeignId('tenant_id');
        });
    }
};
