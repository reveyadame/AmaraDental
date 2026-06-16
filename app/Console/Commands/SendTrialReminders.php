<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\Role as RoleEnum;
use App\Mail\TrialEndingMail;
use App\Models\Tenant;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

/**
 * Avisa a las clínicas cuya prueba termina en ≤3 días y que aún no han
 * agregado método de pago. Se agenda diario (ver routes/console.php).
 */
class SendTrialReminders extends Command
{
    protected $signature = 'billing:trial-reminders';

    protected $description = 'Envía avisos a las clínicas cuya prueba está por terminar';

    public function handle(): int
    {
        $tenants = Tenant::query()
            ->whereNotNull('trial_ends_at')
            ->whereNull('trial_reminder_sent_at')
            ->whereBetween('trial_ends_at', [now(), now()->addDays(3)])
            ->get();

        $sent = 0;
        foreach ($tenants as $tenant) {
            if ($tenant->subscribed('default')) {
                continue; // ya agregó pago → no molestar
            }

            TenantContext::setTenant($tenant);
            $emails = User::role(RoleEnum::Admin->value)->pluck('email')->all();
            if ($emails !== []) {
                Mail::to($emails)->send(new TrialEndingMail(
                    $tenant,
                    $tenant->appUrl(),
                    $tenant->trial_ends_at->toIso8601String(),
                ));
                $sent++;
            }
            $tenant->update(['trial_reminder_sent_at' => now()]);
        }

        TenantContext::clear();
        $this->info("Avisos de fin de prueba enviados: {$sent}");

        return self::SUCCESS;
    }
}
