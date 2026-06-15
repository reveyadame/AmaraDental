<?php

declare(strict_types=1);

namespace Tests\Feature\Cash;

use App\Models\CashSession;
use App\Models\Charge;
use App\Models\Patient;
use App\Models\Specialist;
use App\Models\Treatment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Flujos de dinero: apertura de caja, creación de cobros, pagos parciales,
 * abonos y cancelación. Protegen las invariantes financieras del sistema.
 */
class ChargeFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->bootTenant();
    }

    /** Abre la caja global vía API y devuelve la sesión abierta. */
    private function openCashSession(): CashSession
    {
        $this->postJson('/api/cash-sessions', ['opening_amount' => 0])
            ->assertCreated();

        return CashSession::query()->where('status', 'open')->firstOrFail();
    }

    /** @return array{patient: Patient, treatment: Treatment, specialist: Specialist} */
    private function makeCatalog(float $price = 500): array
    {
        return [
            'patient' => Patient::factory()->create(),
            'treatment' => Treatment::factory()->create(['base_price' => $price]),
            'specialist' => Specialist::factory()->create(),
        ];
    }

    /** @return array<string, mixed> */
    private function chargePayload(array $cat, ?float $payment = null): array
    {
        $payload = [
            'patient_id' => $cat['patient']->id,
            'items' => [[
                'treatment_id' => $cat['treatment']->id,
                'specialist_id' => $cat['specialist']->id,
                'quantity' => 1,
            ]],
        ];

        if ($payment !== null) {
            $payload['payments'] = [['method' => 'cash', 'amount' => $payment]];
        }

        return $payload;
    }

    public function test_full_payment_on_creation_marks_charge_paid(): void
    {
        $this->actingAsUserWithRoles('caja');
        $this->openCashSession();
        $cat = $this->makeCatalog(500);

        $response = $this->postJson('/api/charges', $this->chargePayload($cat, 500));

        $response->assertCreated();
        $charge = Charge::query()->firstOrFail();
        $this->assertSame('paid', $charge->status);
        $this->assertEqualsWithDelta(0, (float) $charge->balance, 0.001);
        $this->assertEqualsWithDelta(500, (float) $charge->paid_total, 0.001);
    }

    public function test_partial_payment_leaves_charge_partial_with_remaining_balance(): void
    {
        $this->actingAsUserWithRoles('caja');
        $this->openCashSession();
        $cat = $this->makeCatalog(500);

        $this->postJson('/api/charges', $this->chargePayload($cat, 200))
            ->assertCreated();

        $charge = Charge::query()->firstOrFail();
        $this->assertSame('partial', $charge->status);
        $this->assertEqualsWithDelta(300, (float) $charge->balance, 0.001);
    }

    public function test_adding_payment_completes_the_charge(): void
    {
        $this->actingAsUserWithRoles('caja');
        $this->openCashSession();
        $cat = $this->makeCatalog(500);

        $this->postJson('/api/charges', $this->chargePayload($cat, 200))
            ->assertCreated();
        $charge = Charge::query()->firstOrFail();

        $this->postJson("/api/charges/{$charge->id}/payments", [
            'method' => 'cash',
            'amount' => 300,
        ])->assertSuccessful();

        $charge->refresh();
        $this->assertSame('paid', $charge->status);
        $this->assertEqualsWithDelta(0, (float) $charge->balance, 0.001);
    }

    public function test_creating_charge_with_payment_requires_open_cash_session(): void
    {
        $this->actingAsUserWithRoles('caja');
        // No abrimos caja.
        $cat = $this->makeCatalog(500);

        $this->postJson('/api/charges', $this->chargePayload($cat, 500))
            ->assertStatus(422);

        $this->assertSame(0, Charge::query()->count());
    }

    public function test_charge_without_payment_can_be_created_without_open_cash_session(): void
    {
        $this->actingAsUserWithRoles('caja');
        $cat = $this->makeCatalog(500);

        $this->postJson('/api/charges', $this->chargePayload($cat, null))
            ->assertCreated();

        $charge = Charge::query()->firstOrFail();
        $this->assertSame('pending', $charge->status);
        $this->assertEqualsWithDelta(500, (float) $charge->balance, 0.001);
    }

    public function test_cannot_cancel_charge_with_payment_in_a_closed_cash_session(): void
    {
        $this->actingAsUserWithRoles('admin');
        $session = $this->openCashSession();
        $cat = $this->makeCatalog(500);

        $this->postJson('/api/charges', $this->chargePayload($cat, 500))
            ->assertCreated();
        $charge = Charge::query()->firstOrFail();

        // Cerramos el corte: sus movimientos quedan inmutables.
        $session->update(['status' => 'closed', 'closed_at' => now()]);

        $this->postJson("/api/charges/{$charge->id}/cancel")
            ->assertStatus(422);

        $this->assertSame('paid', $charge->refresh()->status);
    }

    public function test_can_cancel_charge_while_cash_session_is_open(): void
    {
        $this->actingAsUserWithRoles('admin');
        $this->openCashSession();
        $cat = $this->makeCatalog(500);

        $this->postJson('/api/charges', $this->chargePayload($cat, 500))
            ->assertCreated();
        $charge = Charge::query()->firstOrFail();

        $this->postJson("/api/charges/{$charge->id}/cancel")
            ->assertSuccessful();

        $this->assertSame('cancelled', $charge->refresh()->status);
    }

    public function test_only_one_open_cash_session_allowed_at_a_time(): void
    {
        $this->actingAsUserWithRoles('caja');
        $this->openCashSession();

        $this->postJson('/api/cash-sessions', ['opening_amount' => 0])
            ->assertStatus(422);

        $this->assertSame(1, CashSession::query()->where('status', 'open')->count());
    }
}
