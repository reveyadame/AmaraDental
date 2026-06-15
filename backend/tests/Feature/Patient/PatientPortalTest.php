<?php

declare(strict_types=1);

namespace Tests\Feature\Patient;

use App\Models\Appointment;
use App\Models\Charge;
use App\Models\Patient;
use App\Models\PatientAccount;
use App\Models\PatientLoginCode;
use App\Models\Prescription;
use App\Models\Recall;
use App\Models\Specialist;
use App\Models\Tenant;
use App\Models\Treatment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Portal de pacientes: invitación del staff, login passwordless por código,
 * acceso de solo lectura, y separación estricta staff ↔ paciente y cross-tenant.
 */
class PatientPortalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->bootTenant();
    }

    private function staffAdmin(): User
    {
        $user = User::factory()->create();
        $user->assignRole('admin');

        return $user;
    }

    private function patientWithEmail(string $email = 'juan@mail.mx'): Patient
    {
        return Patient::factory()->create(['email' => $email]);
    }

    private function activeAccountFor(Patient $patient): PatientAccount
    {
        return PatientAccount::factory()->create([
            'patient_id' => $patient->id,
            'identifier' => $patient->email,
        ]);
    }

    private function patientToken(PatientAccount $account): string
    {
        return $account->createToken('test', ['patient'])->plainTextToken;
    }

    private function seedCode(PatientAccount $account, string $code): void
    {
        PatientLoginCode::query()->create([
            'tenant_id' => $account->tenant_id,
            'patient_account_id' => $account->id,
            'identifier' => $account->identifier,
            'code_hash' => Hash::make($code),
            'channel' => 'email',
            'expires_at' => now()->addMinutes(10),
        ]);
    }

    private function makeAppointment(Patient $patient, Specialist $specialist, User $staff): void
    {
        Appointment::query()->create([
            'patient_id' => $patient->id,
            'specialist_id' => $specialist->id,
            'created_by_user_id' => $staff->id,
            'starts_at' => now(),
            'ends_at' => now()->addHour(),
            'title' => 'Consulta',
        ]);
    }

    // ── Invitación (staff) ─────────────────────────────────────────────────

    public function test_staff_can_invite_patient_with_email(): void
    {
        $patient = $this->patientWithEmail();
        $this->actingAs($this->staffAdmin(), 'sanctum');

        $this->postJson("/api/patients/{$patient->id}/portal/invite")
            ->assertOk()
            ->assertJsonPath('data.has_access', true)
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('patient_accounts', [
            'patient_id' => $patient->id,
            'status' => 'pending',
        ]);
        $this->assertSame(1, PatientLoginCode::query()->count());
    }

    public function test_invite_requires_patient_email(): void
    {
        $patient = Patient::factory()->create(['email' => null]);
        $this->actingAs($this->staffAdmin(), 'sanctum');

        $this->postJson("/api/patients/{$patient->id}/portal/invite")
            ->assertStatus(422);
    }

    // ── Login passwordless ─────────────────────────────────────────────────

    public function test_request_code_is_anti_enumeration(): void
    {
        // Sin cuenta → 200 y sin código emitido.
        $this->postJson('/api/patient/auth/request-code', ['identifier' => 'nadie@mail.mx'])
            ->assertOk();
        $this->assertSame(0, PatientLoginCode::query()->count());

        // Con cuenta → 200 y código emitido.
        $patient = $this->patientWithEmail();
        $this->activeAccountFor($patient);
        $this->postJson('/api/patient/auth/request-code', ['identifier' => $patient->email])
            ->assertOk();
        $this->assertSame(1, PatientLoginCode::query()->count());
    }

    public function test_verify_with_valid_code_returns_token_and_activates(): void
    {
        $patient = $this->patientWithEmail();
        $account = PatientAccount::factory()->pending()->create([
            'patient_id' => $patient->id,
            'identifier' => $patient->email,
        ]);
        $this->seedCode($account, '654321');

        $response = $this->postJson('/api/patient/auth/verify', [
            'identifier' => $patient->email,
            'code' => '654321',
        ])->assertOk();

        $this->assertNotEmpty($response->json('token'));
        $this->assertSame('active', $account->refresh()->status);
        $this->assertNotNull($account->last_login_at);
    }

    public function test_verify_with_invalid_code_fails(): void
    {
        $patient = $this->patientWithEmail();
        $account = $this->activeAccountFor($patient);
        $this->seedCode($account, '111111');

        $this->postJson('/api/patient/auth/verify', [
            'identifier' => $patient->email,
            'code' => '000000',
        ])->assertStatus(422);
    }

    // ── Acceso autenticado (solo lectura) ──────────────────────────────────

    public function test_authenticated_patient_sees_own_profile_and_appointments(): void
    {
        $staff = User::factory()->create();
        $specialist = Specialist::factory()->create();

        $patient = $this->patientWithEmail();
        $account = $this->activeAccountFor($patient);
        $other = Patient::factory()->create();

        $this->makeAppointment($patient, $specialist, $staff);
        $this->makeAppointment($other, $specialist, $staff);

        $token = $this->patientToken($account);

        $this->withToken($token)->getJson('/api/patient/me')
            ->assertOk()
            ->assertJsonPath('data.email', $patient->email);

        $response = $this->withToken($token)->getJson('/api/patient/appointments')->assertOk();
        // Solo ve su propia cita, no la del otro paciente.
        $this->assertCount(1, $response->json('data'));
    }

    public function test_patient_account_returns_own_totals_only(): void
    {
        $staff = User::factory()->create();
        $patient = $this->patientWithEmail();
        $account = $this->activeAccountFor($patient);
        $other = Patient::factory()->create();

        Charge::query()->create([
            'patient_id' => $patient->id, 'created_by_user_id' => $staff->id,
            'code' => 'CHG-1', 'status' => 'partial',
            'total' => 1000, 'paid_total' => 400, 'balance' => 600,
        ]);
        Charge::query()->create([
            'patient_id' => $other->id, 'created_by_user_id' => $staff->id,
            'code' => 'CHG-2', 'status' => 'pending',
            'total' => 500, 'paid_total' => 0, 'balance' => 500,
        ]);

        $response = $this->withToken($this->patientToken($account))
            ->getJson('/api/patient/account')->assertOk();

        $this->assertEqualsWithDelta(600, $response->json('data.totals.balance'), 0.001);
        $this->assertCount(1, $response->json('data.charges'));
    }

    public function test_patient_prescriptions_returns_own_only(): void
    {
        $staff = User::factory()->create();
        $specialist = Specialist::factory()->create();
        $patient = $this->patientWithEmail();
        $account = $this->activeAccountFor($patient);
        $other = Patient::factory()->create();

        Prescription::query()->create([
            'patient_id' => $patient->id, 'specialist_id' => $specialist->id,
            'created_by_user_id' => $staff->id, 'code' => 'RX-1', 'issued_at' => now(),
        ]);
        Prescription::query()->create([
            'patient_id' => $other->id, 'specialist_id' => $specialist->id,
            'created_by_user_id' => $staff->id, 'code' => 'RX-2', 'issued_at' => now(),
        ]);

        $response = $this->withToken($this->patientToken($account))
            ->getJson('/api/patient/prescriptions')->assertOk();

        $this->assertCount(1, $response->json('data'));
    }

    public function test_patient_recalls_returns_scheduled_own_only(): void
    {
        $treatment = Treatment::factory()->create();
        $patient = $this->patientWithEmail();
        $account = $this->activeAccountFor($patient);
        $other = Patient::factory()->create();

        Recall::query()->create([
            'patient_id' => $patient->id, 'treatment_id' => $treatment->id,
            'due_on' => now()->addDays(30), 'status' => Recall::STATUS_PENDING,
        ]);
        // Recall completado del mismo paciente → no debe aparecer.
        Recall::query()->create([
            'patient_id' => $patient->id, 'treatment_id' => $treatment->id,
            'due_on' => now()->subDays(10), 'status' => Recall::STATUS_COMPLETED,
        ]);
        // Recall de otro paciente → no debe aparecer.
        Recall::query()->create([
            'patient_id' => $other->id, 'treatment_id' => $treatment->id,
            'due_on' => now()->addDays(15), 'status' => Recall::STATUS_PENDING,
        ]);

        $response = $this->withToken($this->patientToken($account))
            ->getJson('/api/patient/recalls')->assertOk();

        $this->assertCount(1, $response->json('data'));
    }

    // ── Separación staff ↔ paciente ────────────────────────────────────────

    public function test_patient_token_cannot_access_staff_api(): void
    {
        $token = $this->patientToken($this->activeAccountFor($this->patientWithEmail()));

        $this->withToken($token)->getJson('/api/patients')->assertForbidden();
    }

    public function test_staff_token_cannot_access_patient_api(): void
    {
        $token = $this->staffAdmin()->createToken('staff')->plainTextToken;

        $this->withToken($token)->getJson('/api/patient/me')->assertForbidden();
    }

    public function test_patient_cannot_use_another_tenants_context(): void
    {
        $token = $this->patientToken($this->activeAccountFor($this->patientWithEmail()));

        Tenant::query()->create([
            'name' => 'Clínica B',
            'slug' => 'clinica-b',
            'brand_name' => 'Clínica B',
            'color_primary' => 'oklch(0.546 0.215 262.881)',
            'color_primary_foreground' => 'oklch(0.985 0 0)',
            'color_secondary' => 'oklch(0.97 0 0)',
            'phones' => [],
            'cedulas_clinica' => [],
            'timezone' => 'America/Mexico_City',
        ]);

        $this->withToken($token)
            ->getJson('/api/patient/me', ['X-Tenant' => 'clinica-b'])
            ->assertForbidden();
    }

    // ── Revocación (admin) ─────────────────────────────────────────────────

    public function test_revoke_requires_admin_and_removes_access(): void
    {
        $patient = $this->patientWithEmail();
        $this->activeAccountFor($patient);

        $nonAdmin = User::factory()->create();
        $nonAdmin->assignRole('pacientes');
        $this->actingAs($nonAdmin, 'sanctum');
        $this->deleteJson("/api/patients/{$patient->id}/portal")->assertForbidden();

        $this->actingAs($this->staffAdmin(), 'sanctum');
        $this->deleteJson("/api/patients/{$patient->id}/portal")->assertOk();
        $this->assertSame(0, PatientAccount::query()->count());
    }
}
