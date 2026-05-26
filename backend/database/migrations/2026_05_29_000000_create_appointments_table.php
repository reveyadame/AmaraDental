<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('specialist_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('treatment_id')->nullable()
                ->constrained('treatments')->nullOnDelete();
            $table->foreignId('created_by_user_id')->constrained('users')->cascadeOnDelete();

            $table->string('title')->nullable();
            $table->text('notes')->nullable();

            $table->dateTime('starts_at');
            $table->dateTime('ends_at');

            $table->string('room', 60)->nullable();
            $table->enum('status', [
                'scheduled',
                'confirmed',
                'arrived',
                'in_room',
                'completed',
                'no_show',
                'cancelled',
            ])->default('scheduled');

            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('reminder_sent_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'starts_at']);
            $table->index(['tenant_id', 'specialist_user_id', 'starts_at'], 'app_tenant_specialist_idx');
            $table->index(['tenant_id', 'patient_id']);
            $table->index(['tenant_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
