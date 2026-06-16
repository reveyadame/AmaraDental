<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Actions\ProvisionTenant;
use App\Mail\ClinicWelcomeMail;
use App\Mail\PaymentFailedMail;
use App\Mail\TrialEndingMail;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Laravel\Cashier\Events\WebhookReceived;
use Tests\TestCase;

/**
 * Emails del sistema: bienvenida, fin de prueba y pago fallido.
 */
class BillingEmailsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->bootTenant();
    }

    private function provision(string $name, string $slug, string $email): Tenant
    {
        return app(ProvisionTenant::class)->handle($name, $slug, $email)['tenant'];
    }

    public function test_provisioning_sends_welcome_email(): void
    {
        Mail::fake();
        $this->provision('Clínica Email', 'clinica-email', 'admin@email.mx');

        Mail::assertSent(ClinicWelcomeMail::class, fn (ClinicWelcomeMail $m) => $m->hasTo('admin@email.mx'));
    }

    public function test_trial_reminders_email_clinics_ending_soon_once(): void
    {
        Mail::fake();
        $tenant = $this->provision('Pronto', 'pronto', 'admin@pronto.mx');
        $tenant->update(['trial_ends_at' => now()->addDays(2)]);

        $this->artisan('billing:trial-reminders')->assertSuccessful();
        Mail::assertSent(TrialEndingMail::class, fn (TrialEndingMail $m) => $m->hasTo('admin@pronto.mx'));
        $this->assertNotNull($tenant->refresh()->trial_reminder_sent_at);

        // Segunda corrida: no re-envía (ya marcado).
        Mail::fake();
        $this->artisan('billing:trial-reminders')->assertSuccessful();
        Mail::assertNotSent(TrialEndingMail::class);
    }

    public function test_trial_reminders_skip_clinics_not_ending_soon(): void
    {
        Mail::fake();
        $this->provision('Lejos', 'lejos', 'admin@lejos.mx'); // prueba a 14 días

        $this->artisan('billing:trial-reminders')->assertSuccessful();
        Mail::assertNotSent(TrialEndingMail::class);
    }

    public function test_payment_failed_webhook_emails_the_admin(): void
    {
        Mail::fake();
        $tenant = $this->provision('PagoFalla', 'pagofalla', 'admin@pf.mx');
        $tenant->forceFill(['stripe_id' => 'cus_test123'])->save();

        event(new WebhookReceived([
            'type' => 'invoice.payment_failed',
            'data' => ['object' => ['customer' => 'cus_test123']],
        ]));

        Mail::assertSent(PaymentFailedMail::class, fn (PaymentFailedMail $m) => $m->hasTo('admin@pf.mx'));
    }

    public function test_all_emails_render(): void
    {
        $tenant = $this->provision('Render', 'render', 'a@b.mx');

        // Compila los blades (Mail::fake no renderiza → esto cubre ese hueco).
        (new ClinicWelcomeMail($tenant, 'a@b.mx', 'secret', $tenant->appUrl(), 'Premium', now()->toIso8601String()))->render();
        (new TrialEndingMail($tenant, $tenant->appUrl(), now()->toIso8601String()))->render();
        (new PaymentFailedMail($tenant, $tenant->appUrl()))->render();

        $this->assertTrue(true);
    }
}
