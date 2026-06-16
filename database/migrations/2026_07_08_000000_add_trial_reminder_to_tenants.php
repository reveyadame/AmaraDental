<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Marca de "ya se envió el aviso de fin de prueba" para no duplicarlo.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table): void {
            if (! Schema::hasColumn('tenants', 'trial_reminder_sent_at')) {
                $table->timestamp('trial_reminder_sent_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table): void {
            if (Schema::hasColumn('tenants', 'trial_reminder_sent_at')) {
                $table->dropColumn('trial_reminder_sent_at');
            }
        });
    }
};
