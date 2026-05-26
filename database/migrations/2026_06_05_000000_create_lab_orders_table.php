<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lab_orders', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();

            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            // Tratamiento al que pertenece la orden (corona, prótesis, etc.).
            $table->foreignId('treatment_id')->nullable()
                ->constrained('treatments')->nullOnDelete();
            // Dentista responsable.
            $table->foreignId('dentist_user_id')->nullable()
                ->constrained('users')->nullOnDelete();

            $table->string('lab_name'); // nombre del laboratorio externo
            $table->string('work_type', 120)->nullable(); // ej: "Corona zirconio molar 36"
            $table->text('specifications')->nullable(); // color VITA, material, tono, etc.

            $table->date('sent_on')->nullable();
            $table->date('due_on')->nullable();
            $table->date('received_on')->nullable();
            $table->date('delivered_to_patient_on')->nullable();

            $table->decimal('cost', 12, 2)->default(0);

            // pending | in_progress | received | delivered | cancelled
            $table->string('status', 16)->default('pending');

            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'patient_id']);
            $table->index(['tenant_id', 'due_on']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lab_orders');
    }
};
