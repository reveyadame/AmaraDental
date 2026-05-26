<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bloqueos de agenda: rangos en los que la clínica (o un dentista en
 * particular) no atiende — comida, vacaciones, días festivos, capacitación,
 * etc. Se muestran en la agenda como bandas grises no agendables.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agenda_blocks', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();

            // null = bloqueo global (toda la clínica).
            $table->foreignId('specialist_user_id')->nullable()
                ->constrained('users')->cascadeOnDelete();

            $table->dateTime('starts_at');
            $table->dateTime('ends_at');
            $table->boolean('all_day')->default(false);

            $table->string('title');
            $table->text('notes')->nullable();

            $table->foreignId('created_by_user_id')->nullable()
                ->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'starts_at']);
            $table->index(['tenant_id', 'specialist_user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agenda_blocks');
    }
};
