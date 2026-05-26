<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Campos extra para usuarios con rol dentista. Solo se llenan cuando el rol
 * aplica; quedan nullable para no ensuciar el modelo del resto de roles.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('cedula_profesional', 32)->nullable()->after('phone');
            $table->string('specialty', 120)->nullable()->after('cedula_profesional');
            $table->decimal('default_commission_percent', 5, 2)->nullable()->after('specialty');
            $table->text('bio')->nullable()->after('default_commission_percent');
            $table->longText('signature_image')->nullable()->after('bio');     // PNG base64 para recetas
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn([
                'cedula_profesional',
                'specialty',
                'default_commission_percent',
                'bio',
                'signature_image',
            ]);
        });
    }
};
