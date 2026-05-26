<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('ics_feed_token', 64)->nullable()->unique()->after('signature_image');
            $table->timestamp('ics_feed_token_at')->nullable()->after('ics_feed_token');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn(['ics_feed_token', 'ics_feed_token_at']);
        });
    }
};
