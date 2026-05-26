<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tras separar el catálogo de especialistas de los usuarios del sistema, las
 * columnas clínicas no tienen sentido en `users`. La firma del especialista
 * también desaparece — las recetas dejan espacio para firma autógrafa.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $cols = [];
            foreach (
                ['cedula_profesional', 'specialty', 'default_commission_percent', 'bio', 'signature_image']
                as $c
            ) {
                if (Schema::hasColumn('users', $c)) {
                    $cols[] = $c;
                }
            }
            if (! empty($cols)) {
                $table->dropColumn($cols);
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('cedula_profesional', 32)->nullable();
            $table->string('specialty', 120)->nullable();
            $table->decimal('default_commission_percent', 5, 2)->nullable();
            $table->text('bio')->nullable();
            $table->longText('signature_image')->nullable();
        });
    }
};
