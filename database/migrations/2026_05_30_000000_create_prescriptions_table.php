<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prescriptions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('specialist_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('appointment_id')->nullable()
                ->constrained('appointments')->nullOnDelete();
            $table->foreignId('created_by_user_id')->constrained('users')->cascadeOnDelete();

            $table->string('code', 32)->nullable();
            $table->text('diagnosis')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('issued_at');

            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'patient_id', 'issued_at'], 'rx_tenant_patient_idx');
            $table->index(['tenant_id', 'specialist_user_id', 'issued_at'], 'rx_tenant_specialist_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prescriptions');
    }
};
