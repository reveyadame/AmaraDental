<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Cash\StoreChargePaymentRequest;
use App\Http\Requests\Cash\StoreChargeRequest;
use App\Http\Resources\ChargeResource;
use App\Http\Resources\PatientCreditResource;
use App\Models\CashSession;
use App\Models\Charge;
use App\Models\Discount;
use App\Models\Patient;
use App\Models\PatientCredit;
use App\Models\Specialist;
use App\Models\Treatment;
use App\Support\CommissionResolver;
use App\Support\RecallGenerator;
use App\Support\TenantContext;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ChargesController extends Controller implements HasMiddleware
{
    use AuthorizesRequests;

    /** @return array<int, Middleware|string> */
    public static function middleware(): array
    {
        return ['auth:sanctum'];
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Charge::class);

        $charges = Charge::query()
            ->with(['patient', 'createdBy'])
            ->when($request->filled('status'),
                fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('patient_id'),
                fn ($q) => $q->where('patient_id', $request->integer('patient_id')))
            ->when($request->filled('date_from'),
                fn ($q) => $q->whereDate('created_at', '>=', $request->date('date_from')))
            ->when($request->filled('date_to'),
                fn ($q) => $q->whereDate('created_at', '<=', $request->date('date_to')))
            // has_balance=true → solo cobros con saldo (pendiente o parcial).
            ->when($request->boolean('has_balance'),
                fn ($q) => $q->where('balance', '>', 0)->whereIn('status', ['pending', 'partial']))
            // include_oldest_first cambia el orden — útil para "antigüedad" en saldos.
            ->when($request->boolean('oldest_first'),
                fn ($q) => $q->orderBy('created_at'),
                fn ($q) => $q->orderByDesc('created_at'))
            ->paginate($request->integer('per_page', 25));

        return response()->json([
            'data' => ChargeResource::collection($charges->items()),
            'meta' => [
                'current_page' => $charges->currentPage(),
                'last_page' => $charges->lastPage(),
                'per_page' => $charges->perPage(),
                'total' => $charges->total(),
            ],
        ]);
    }

    /**
     * Estado de cuenta del paciente: totales agregados + lista completa de
     * cobros (con sus items y pagos) en orden cronológico.
     */
    public function patientAccount(Request $request, Patient $patient): JsonResponse
    {
        $this->authorize('viewAny', Charge::class);

        $charges = Charge::query()
            ->with(['items', 'payments.user'])
            ->where('patient_id', $patient->id)
            ->orderByDesc('created_at')
            ->get();

        $totals = [
            'invoiced' => 0.0,    // total de cobros no cancelados
            'paid' => 0.0,
            'balance' => 0.0,
            'discounts' => 0.0,
            'charges_count' => 0,
            'pending_count' => 0,
            'credit_balance' => 0.0,
        ];

        foreach ($charges as $c) {
            if ($c->status === 'cancelled') continue;
            $totals['invoiced'] += (float) $c->total;
            $totals['paid'] += (float) $c->paid_total;
            $totals['balance'] += (float) $c->balance;
            $totals['discounts'] += (float) $c->discount_total;
            $totals['charges_count']++;
            if ((float) $c->balance > 0) $totals['pending_count']++;
        }

        $totals['credit_balance'] = $patient->creditBalance();

        $creditMovements = PatientCredit::query()
            ->with('createdBy')
            ->where('patient_id', $patient->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => [
                'patient_id' => $patient->id,
                'patient_name' => $patient->full_name,
                'totals' => array_map(fn ($v) => is_float($v) ? round($v, 2) : $v, $totals),
                'charges' => ChargeResource::collection($charges)->resolve($request),
                'credit_movements' => PatientCreditResource::collection($creditMovements)->resolve($request),
            ],
        ]);
    }

    public function show(Charge $charge): JsonResponse
    {
        $this->authorize('view', $charge);

        $charge->load(['patient', 'createdBy', 'items', 'payments.user']);

        return response()->json(['data' => ChargeResource::make($charge)]);
    }

    public function store(StoreChargeRequest $request): JsonResponse
    {
        $userId = $request->user()->id;
        $tenantId = TenantContext::tenantId();
        $patientId = $request->integer('patient_id');
        $payments = $request->input('payments', []);
        $overpaymentCredit = (float) ($request->input('overpayment_credit_amount') ?? 0);

        // Si hay pagos iniciales, necesitamos la sesión de caja global abierta.
        $session = null;
        if (! empty($payments)) {
            $session = CashSession::query()->where('status', 'open')->first();
            abort_if(! $session, 422,
                'No hay una caja abierta. Abre la caja del día antes de registrar pagos.');
        }

        // Pre-validar: si se piensa aplicar saldo a favor, debe haber saldo
        // suficiente en el paciente.
        $creditToApply = collect($payments)
            ->where('method', 'credit')
            ->sum('amount');
        if ($creditToApply > 0) {
            $patient = Patient::query()->findOrFail($patientId);
            $available = $patient->creditBalance();
            if ($creditToApply > $available + 0.001) {
                throw ValidationException::withMessages([
                    'payments' => sprintf(
                        'El saldo a favor disponible (%s) es menor al monto que intentas aplicar (%s).',
                        number_format($available, 2),
                        number_format($creditToApply, 2),
                    ),
                ]);
            }
        }

        $charge = DB::transaction(function () use (
            $request, $session, $userId, $tenantId, $patientId,
            $payments, $overpaymentCredit
        ): Charge {
            /** @var Charge $charge */
            $charge = Charge::query()->create([
                'tenant_id' => $tenantId,
                'patient_id' => $patientId,
                'created_by_user_id' => $userId,
                'notes' => $request->input('notes'),
                'status' => 'pending',
            ]);

            foreach ($request->input('items', []) as $row) {
                $this->createChargeItem($charge, $row);
            }

            foreach ($payments as $p) {
                $payment = $charge->payments()->create([
                    'tenant_id' => $tenantId,
                    'cash_session_id' => $session->id,
                    'user_id' => $userId,
                    'method' => $p['method'],
                    'amount' => $p['amount'],
                    'paid_at' => now(),
                    'reference' => $p['reference'] ?? null,
                    'notes' => $p['notes'] ?? null,
                ]);

                // Si el "pago" fue con saldo a favor, registra el consumo.
                if ($p['method'] === 'credit') {
                    PatientCredit::query()->create([
                        'tenant_id' => $tenantId,
                        'patient_id' => $charge->patient_id,
                        'amount' => -1 * (float) $p['amount'],
                        'source' => 'applied_to_charge',
                        'charge_id' => $charge->id,
                        'charge_payment_id' => $payment->id,
                        'notes' => "Aplicado al cobro {$charge->code}",
                        'created_by_user_id' => $userId,
                    ]);
                }
            }

            // Sobrepago → entra al saldo a favor del paciente.
            if ($overpaymentCredit > 0) {
                PatientCredit::query()->create([
                    'tenant_id' => $tenantId,
                    'patient_id' => $charge->patient_id,
                    'amount' => round($overpaymentCredit, 2),
                    'source' => 'overpayment',
                    'charge_id' => $charge->id,
                    'notes' => "Sobrepago en cobro {$charge->code}",
                    'created_by_user_id' => $userId,
                ]);
            }

            $charge->recomputeTotals();
            $charge->code = sprintf('CHG-%04d', $charge->id);
            $charge->save();

            // Coherencia: si los pagos exceden el total, el sobrepago
            // declarado debe coincidir con la diferencia exacta.
            $paidSum = (float) $charge->paid_total;
            $expectedOver = max(0.0, round($paidSum - (float) $charge->total, 2));
            if (abs($overpaymentCredit - $expectedOver) > 0.01) {
                throw ValidationException::withMessages([
                    'overpayment_credit_amount' => sprintf(
                        'El sobrepago declarado (%s) no coincide con el real (%s).',
                        number_format($overpaymentCredit, 2),
                        number_format($expectedOver, 2),
                    ),
                ]);
            }

            // Si quedó pagado en el momento, generar recalls preventivos.
            if ($charge->status === 'paid') {
                RecallGenerator::fromCharge($charge);
            }

            return $charge;
        });

        $charge->load(['patient', 'createdBy', 'items', 'payments.user']);

        return response()->json(['data' => ChargeResource::make($charge)], 201);
    }

    public function addPayment(
        StoreChargePaymentRequest $request,
        Charge $charge,
    ): JsonResponse {
        $this->authorize('view', $charge);

        abort_if($charge->status === 'cancelled', 422, 'El cobro está cancelado.');
        abort_if($charge->balance <= 0, 422, 'El cobro ya está pagado por completo.');

        $userId = $request->user()->id;
        $tenantId = TenantContext::tenantId();
        $session = CashSession::query()->where('status', 'open')->first();
        abort_if(! $session, 422, 'No hay una caja abierta. Abre la caja del día antes de registrar pagos.');

        $method = (string) $request->input('method');
        $amount = (float) $request->input('amount');
        $overpaymentCredit = (float) ($request->input('overpayment_credit_amount') ?? 0);

        // Si el monto excede el saldo, debe declararse el excedente como
        // saldo a favor (overpayment_credit_amount). Eso fuerza al frontend
        // a confirmar la intención explícitamente.
        $excess = round($amount - (float) $charge->balance, 2);
        if ($excess > 0.01 && abs($overpaymentCredit - $excess) > 0.01) {
            throw ValidationException::withMessages([
                'amount' => sprintf(
                    'El monto excede el saldo en %s. Confirma registrar el excedente como saldo a favor.',
                    number_format($excess, 2),
                ),
            ]);
        }

        // Si pagan con saldo a favor, valida que tengan disponible.
        if ($method === 'credit') {
            $available = $charge->patient->creditBalance();
            if ($amount > $available + 0.001) {
                throw ValidationException::withMessages([
                    'amount' => sprintf(
                        'El saldo a favor disponible (%s) es menor al monto que intentas aplicar (%s).',
                        number_format($available, 2),
                        number_format($amount, 2),
                    ),
                ]);
            }
        }

        DB::transaction(function () use (
            $request, $charge, $session, $userId, $tenantId,
            $method, $amount, $overpaymentCredit
        ): void {
            $payment = $charge->payments()->create([
                'tenant_id' => $tenantId,
                'cash_session_id' => $session->id,
                'user_id' => $userId,
                'method' => $method,
                'amount' => $amount,
                'paid_at' => now(),
                'reference' => $request->input('reference'),
                'notes' => $request->input('notes'),
            ]);

            if ($method === 'credit') {
                PatientCredit::query()->create([
                    'tenant_id' => $tenantId,
                    'patient_id' => $charge->patient_id,
                    'amount' => -1 * $amount,
                    'source' => 'applied_to_charge',
                    'charge_id' => $charge->id,
                    'charge_payment_id' => $payment->id,
                    'notes' => "Aplicado al cobro {$charge->code}",
                    'created_by_user_id' => $userId,
                ]);
            }

            // Sobrepago en abono → saldo a favor.
            if ($overpaymentCredit > 0) {
                PatientCredit::query()->create([
                    'tenant_id' => $tenantId,
                    'patient_id' => $charge->patient_id,
                    'amount' => round($overpaymentCredit, 2),
                    'source' => 'overpayment',
                    'charge_id' => $charge->id,
                    'notes' => "Sobrepago en abono a {$charge->code}",
                    'created_by_user_id' => $userId,
                ]);
            }

            $charge->recomputeTotals();
            $charge->save();

            if ($charge->status === 'paid') {
                RecallGenerator::fromCharge($charge);
            }
        });

        $charge->refresh();
        $charge->load(['patient', 'createdBy', 'items', 'payments.user']);

        return response()->json(['data' => ChargeResource::make($charge)]);
    }

    public function cancel(Request $request, Charge $charge): JsonResponse
    {
        $this->authorize('cancel', $charge);

        abort_if($charge->status === 'cancelled', 422, 'El cobro ya está cancelado.');

        // No se permite cancelar si el cobro tiene pagos en una sesión de caja
        // ya cerrada — eso afectaría un corte inmutable.
        $hasClosedPayments = $charge->payments()
            ->whereHas('cashSession', fn ($q) => $q->where('status', 'closed'))
            ->exists();
        abort_if($hasClosedPayments, 422,
            'No se puede cancelar: el cobro tiene pagos registrados en cortes de caja ya cerrados.');

        $userId = $request->user()->id;
        $tenantId = TenantContext::tenantId();

        DB::transaction(function () use ($charge, $userId, $tenantId): void {
            // Revertir movimientos de saldo a favor asociados al cobro:
            //   overpayment (+$)         → refund_overpayment (-$)
            //   applied_to_charge (-$)   → refund_application (+$)
            $credits = PatientCredit::query()
                ->where('charge_id', $charge->id)
                ->whereIn('source', ['overpayment', 'applied_to_charge'])
                ->get();

            foreach ($credits as $credit) {
                PatientCredit::query()->create([
                    'tenant_id' => $tenantId,
                    'patient_id' => $credit->patient_id,
                    'amount' => -1 * (float) $credit->amount,
                    'source' => $credit->source === 'overpayment'
                        ? 'refund_overpayment'
                        : 'refund_application',
                    'charge_id' => $charge->id,
                    'notes' => "Reverso por cancelación del cobro {$charge->code}",
                    'created_by_user_id' => $userId,
                ]);
            }

            $charge->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
            ]);
        });

        return response()->json(['data' => ChargeResource::make($charge->refresh())]);
    }

    /**
     * Crea un charge_item resolviendo precio, descuento y comisión efectiva.
     */
    private function createChargeItem(Charge $charge, array $row): void
    {
        /** @var Treatment $treatment */
        $treatment = Treatment::query()->findOrFail($row['treatment_id']);

        $specialist = null;
        if (! empty($row['specialist_id'])) {
            /** @var Specialist|null $specialist */
            $specialist = Specialist::query()->find($row['specialist_id']);
        }

        $quantity = (int) $row['quantity'];
        $override = $row['unit_price_override'] ?? null;
        $unitPrice = $override !== null
            ? (float) $override
            : (float) $treatment->base_price;

        $subtotal = round($unitPrice * $quantity, 2);

        $discountAmount = 0.0;
        $discount = null;
        if (! empty($row['discount_id'])) {
            /** @var Discount|null $discount */
            $discount = Discount::query()->find($row['discount_id']);
            if ($discount && $discount->active) {
                if ($discount->type === 'percent') {
                    $discountAmount = round($subtotal * ((float) $discount->value / 100), 2);
                } else {
                    $discountAmount = round((float) $discount->value, 2);
                }
                $discountAmount = min($discountAmount, $subtotal);
            }
        }

        $lineTotal = round($subtotal - $discountAmount, 2);
        $commissionPercent = CommissionResolver::resolve($specialist, $treatment);
        $commissionBaseAmount = CommissionResolver::baseAmount($treatment, $lineTotal, $quantity);
        $commissionAmount = $commissionPercent !== null
            ? round($commissionBaseAmount * ($commissionPercent / 100), 2) : 0;

        $charge->items()->create([
            'tenant_id' => $charge->tenant_id,
            'treatment_id' => $treatment->id,
            'treatment_name' => $treatment->name,
            'treatment_code' => $treatment->code,
            'specialist_id' => $specialist?->id,
            'specialist_name' => $specialist?->name,
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'discount_id' => $discount?->id,
            'discount_amount' => $discountAmount,
            'line_total' => $lineTotal,
            'commission_percent' => $commissionPercent,
            'commission_base' => $treatment->commission_base,
            'commission_cost' => $treatment->commission_base === 'profit' ? (float) $treatment->cost : 0,
            'commission_amount' => $commissionAmount,
        ]);
    }
}
