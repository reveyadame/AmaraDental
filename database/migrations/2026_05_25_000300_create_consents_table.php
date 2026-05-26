<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consents', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('consent_template_id')->nullable()
                ->constrained('consent_templates')->nullOnDelete();

            // Snapshot al firmar — el template puede cambiar después.
            $table->string('title');
            $table->longText('body');

            // Firma: imagen PNG base64. Cuando entre Spaces/R2 se migrará a URL.
            $table->longText('signature_image')->nullable();
            $table->string('signed_by_name', 160);
            $table->timestamp('signed_at');

            $table->foreignId('captured_by_user_id')->nullable()
                ->constrained('users')->nullOnDelete();

            // IP + user-agent al firmar — útil para evidencia (NOM-024).
            $table->json('meta')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'patient_id', 'signed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consents');
    }
};
