<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lab_orders', function (Blueprint $table): void {
            $table->foreignId('lab_id')->nullable()->after('treatment_id')
                ->constrained('labs')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('lab_orders', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('lab_id');
        });
    }
};
