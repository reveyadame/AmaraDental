<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('treatments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();

            $table->string('code', 32)->nullable();
            $table->string('name');
            $table->string('category', 60)->nullable();
            $table->text('description')->nullable();

            $table->decimal('base_price', 12, 2);
            $table->unsignedSmallInteger('duration_minutes')->default(30);
            $table->decimal('commission_percent', 5, 2)->nullable();

            // Recalls / periodicidad
            $table->unsignedSmallInteger('periodicity_days')->nullable();
            $table->string('recall_label', 120)->nullable();

            // Consentimiento requerido para este tratamiento
            $table->foreignId('requires_consent_template_id')->nullable()
                ->constrained('consent_templates')->nullOnDelete();

            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'active']);
            $table->index(['tenant_id', 'category']);
            $table->unique(['tenant_id', 'code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('treatments');
    }
};
