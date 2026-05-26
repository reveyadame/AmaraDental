<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_expenses', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('cash_session_id')->constrained('cash_sessions')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();

            // lab | supplies | payroll | utilities | commission | refund | other
            $table->string('category', 24);
            $table->string('description');

            // cash | card | transfer
            $table->string('method', 16)->default('cash');
            $table->decimal('amount', 12, 2);

            $table->string('reference', 120)->nullable();
            $table->foreignId('related_lab_order_id')->nullable()
                ->constrained('lab_orders')->nullOnDelete();

            $table->timestamp('paid_at');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'cash_session_id']);
            $table->index(['tenant_id', 'paid_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_expenses');
    }
};
