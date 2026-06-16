<?php

declare(strict_types=1);

namespace Tests\Feature\Public;

use App\Mail\ClinicWelcomeMail;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * Alta self-service desde la landing pública (sin auth ni tenant).
 */
class SignupTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->bootTenant(); // siembra planes + roles + clínica piloto (slug clinica-piloto)
    }

    public function test_public_plans_are_listed(): void
    {
        $keys = collect($this->getJson('/api/public/plans')->assertOk()->json('data'))
            ->pluck('key')->all();

        $this->assertEqualsCanonicalizing(['esencial', 'crecimiento', 'premium'], $keys);
    }

    public function test_slug_availability_check(): void
    {
        $this->getJson('/api/public/slug-available?slug=sonrisas')
            ->assertOk()
            ->assertJsonPath('available', true);

        // Reservado.
        $this->getJson('/api/public/slug-available?slug=admin')
            ->assertOk()
            ->assertJsonPath('available', false);

        // Ya en uso (la piloto).
        $this->getJson('/api/public/slug-available?slug=clinica-piloto')
            ->assertOk()
            ->assertJsonPath('available', false);

        // Muy corto.
        $this->getJson('/api/public/slug-available?slug=ab')
            ->assertOk()
            ->assertJsonPath('available', false);
    }

    public function test_signup_creates_clinic_with_trial_and_emails_credentials(): void
    {
        Mail::fake();

        $res = $this->postJson('/api/public/signup', [
            'clinic_name' => 'Sonrisas Felices',
            'admin_name' => 'Ana López',
            'admin_email' => 'dueno@sonrisas.mx',
            'slug' => 'sonrisas',
            'plan_key' => 'crecimiento',
        ])->assertCreated()
            ->assertJsonPath('data.slug', 'sonrisas')
            ->assertJsonPath('data.admin_email', 'dueno@sonrisas.mx');

        // La contraseña NO se expone en una respuesta pública (va por correo).
        $this->assertArrayNotHasKey('admin_password', $res->json('data'));

        $this->assertDatabaseHas('tenants', ['slug' => 'sonrisas', 'status' => 'active']);
        $this->assertNotNull(Tenant::query()->where('slug', 'sonrisas')->value('trial_ends_at'));

        Mail::assertSent(ClinicWelcomeMail::class, fn (ClinicWelcomeMail $m) => $m->hasTo('dueno@sonrisas.mx'));
    }

    public function test_signup_rejects_taken_slug(): void
    {
        $this->postJson('/api/public/signup', [
            'clinic_name' => 'Otra',
            'admin_email' => 'x@x.mx',
            'slug' => 'clinica-piloto',
        ])->assertStatus(422)->assertJsonValidationErrors('slug');
    }

    public function test_signup_rejects_reserved_slug(): void
    {
        $this->postJson('/api/public/signup', [
            'clinic_name' => 'Otra',
            'admin_email' => 'x@x.mx',
            'slug' => 'api',
        ])->assertStatus(422)->assertJsonValidationErrors('slug');
    }
}
