<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prescription_templates', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by_user_id')->constrained('users')->cascadeOnDelete();

            $table->string('name');
            $table->string('category', 120)->nullable();
            $table->text('description')->nullable();
            $table->boolean('active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'active'], 'rxt_tenant_active_idx');
            $table->index(['tenant_id', 'name'], 'rxt_tenant_name_idx');
        });

        Schema::create('prescription_template_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('prescription_template_id')->constrained()->cascadeOnDelete();

            $table->string('medication');
            $table->string('presentation')->nullable();
            $table->string('dosage');
            $table->string('route', 60)->nullable();
            $table->string('frequency');
            $table->string('duration');
            $table->text('instructions')->nullable();
            $table->unsignedInteger('order_index')->default(0);

            $table->timestamps();

            $table->index(['tenant_id', 'prescription_template_id'], 'rxti_tenant_rxt_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prescription_template_items');
        Schema::dropIfExists('prescription_templates');
    }
};
