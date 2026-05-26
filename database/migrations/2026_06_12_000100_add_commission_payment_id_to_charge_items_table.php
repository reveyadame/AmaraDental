<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('charge_items', function (Blueprint $table): void {
            $table->foreignId('commission_payment_id')->nullable()->after('commission_amount')
                ->constrained('commission_payments')->nullOnDelete();
            $table->index(
                ['tenant_id', 'specialist_user_id', 'commission_payment_id'],
                'charge_items_commission_idx',
            );
        });
    }

    public function down(): void
    {
        Schema::table('charge_items', function (Blueprint $table): void {
            $table->dropIndex('charge_items_commission_idx');
            $table->dropConstrainedForeignId('commission_payment_id');
        });
    }
};
