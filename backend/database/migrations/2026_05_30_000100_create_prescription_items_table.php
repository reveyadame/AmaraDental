<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prescription_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('prescription_id')->constrained()->cascadeOnDelete();

            $table->string('medication');
            $table->string('presentation')->nullable();
            $table->string('dosage');
            $table->string('route', 60)->nullable();
            $table->string('frequency');
            $table->string('duration');
            $table->text('instructions')->nullable();
            $table->unsignedInteger('order_index')->default(0);

            $table->timestamps();

            $table->index(['tenant_id', 'prescription_id'], 'rxi_tenant_rx_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prescription_items');
    }
};
