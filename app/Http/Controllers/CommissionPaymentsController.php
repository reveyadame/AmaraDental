<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Commissions\StoreCommissionPaymentRequest;
use App\Http\Resources\CommissionPaymentResource;
use App\Models\CashExpense;
use App\Models\CashSession;
use App\Models\ChargeItem;
use App\Models\CommissionPayment;
use App\Support\TenantContext;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\DB;

class CommissionPaymentsController extends Controller implements HasMiddleware
{
    use AuthorizesRequests;

    /** @return array<int, Middleware|string> */
    public static function middleware(): array
    {
        return ['auth:sanctum'];
    }

    /**
     * Comisiones devengadas pendientes de pago. Filtra opcionalmente por
     * especialista y por rango de fechas del cobro origen.
     */
    public function pending(Request $request): JsonResponse
    {
        $this->authorize('viewAny', CommissionPayment::class);

        $forSpecialistId = $request->filled('specialist_id')
            ? $request->integer('specialist_id')
            : null;

        $items = ChargeItem::query()
            ->with(['charge.patient', 'specialist'])
            ->whereNotNull('specialist_id')
            ->where('commission_amount', '>', 0)
            ->whereNull('commission_payment_id')
            ->when($forSpecialistId, fn ($q) => $q->where('specialist_id', $forSpecialistId))
            ->whereHas('charge', fn ($q) => $q->whereIn(
                'status',
                ['pending', 'partial', 'paid'],
            ))
            ->when($request->filled('date_from'),
                fn ($q) => $q->whereHas('charge',
                    fn ($q) => $q->whereDate('created_at', '>=', $request->date('date_from'))))
            ->when($request->filled('date_to'),
                fn ($q) => $q->whereHas('charge',
                    fn ($q) => $q->whereDate('created_at', '<=', $request->date('date_to'))))
            ->orderBy('specialist_id')
            ->orderBy('id')
            ->get();

        $bySpecialist = $items->groupBy('specialist_id')->map(function ($group) {
            $first = $group->first();
            return [
                'specialist_id' => (int) $first->specialist_id,
                'specialist_name' => $first->specialist_name ?? $first->specialist?->name,
                'items_count' => $group->count(),
                'total_pending' => round((float) $group->sum('commission_amount'), 2),
                'items' => $group->map(function ($i) {
                    $charge = $i->charge;
                    $chargeTotal = (float) ($charge?->total ?? 0);
                    $chargePaid = (float) ($charge?->paid_total ?? 0);
                    $paidRatio = $chargeTotal > 0
                        ? round($chargePaid / $chargeTotal, 4)
                        : 0;
                    $commissionPaidShare = round(
                        (float) $i->commission_amount * $paidRatio,
                        2,
                    );
                    return [
                        'id' => $i->id,
                        'charge_id' => $i->charge_id,
                        'charge_code' => $charge?->code,
                        'charge_status' => $charge?->status,
                        'charge_total' => $chargeTotal,
                        'charge_paid_total' => $chargePaid,
                        'charge_balance' => (float) ($charge?->balance ?? 0),
                        'charge_paid_ratio' => $paidRatio,
                        'charge_date' => $charge?->created_at?->toIso8601String(),
                        'charge_paid_at' => $charge?->paid_at?->toIso8601String(),
                        'patient_name' => $charge?->patient?->full_name,
                        'treatment_name' => $i->treatment_name,
                        'line_total' => (float) $i->line_total,
                        'commission_percent' => (float) $i->commission_percent,
                        'commission_base' => $i->commission_base ?? 'price',
                        'commission_cost' => (float) $i->commission_cost,
                        'commission_base_amount' => ($i->commission_base ?? 'price') === 'profit'
                            ? round((float) $i->line_total - (float) $i->commission_cost * (int) $i->quantity, 2)
                            : (float) $i->line_total,
                        'commission_amount' => (float) $i->commission_amount,
                        'commission_paid_share' => $commissionPaidShare,
                    ];
                })->values(),
            ];
        })->values();

        return response()->json(['data' => $bySpecialist]);
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', CommissionPayment::class);

        $payments = CommissionPayment::query()
            ->with(['specialist', 'createdBy', 'items.charge.patient'])
            ->withCount('items')
            ->when($request->filled('specialist_id'),
                fn ($q) => $q->where('specialist_id', $request->integer('specialist_id')))
            ->when($request->filled('date_from'),
                fn ($q) => $q->whereDate('paid_at', '>=', $request->date('date_from')))
            ->when($request->filled('date_to'),
                fn ($q) => $q->whereDate('paid_at', '<=', $request->date('date_to')))
            ->orderByDesc('paid_at')
            ->paginate($request->integer('per_page', 25));

        return response()->json([
            'data' => CommissionPaymentResource::collection($payments->items()),
            'meta' => [
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
            ],
        ]);
    }

    public function show(CommissionPayment $payment): JsonResponse
    {
        $this->authorize('view', $payment);
        $payment->load([
            'specialist',
            'createdBy',
            'items.charge.patient',
        ]);

        return response()->json([
            'data' => CommissionPaymentResource::make($payment),
        ]);
    }

    public function store(StoreCommissionPaymentRequest $request): JsonResponse
    {
        $data = $request->validated();
        $specialistId = (int) $data['specialist_id'];
        $itemIds = $data['charge_item_ids'];
        $registerAsExpense = (bool) ($data['register_as_expense'] ?? false);
        $userId = $request->user()->id;
        $tenantId = TenantContext::tenantId();

        $payment = DB::transaction(function () use (
            $data, $specialistId, $itemIds, $registerAsExpense, $userId, $tenantId
        ): CommissionPayment {
            $items = ChargeItem::query()
                ->whereIn('id', $itemIds)
                ->lockForUpdate()
                ->get();

            abort_if(
                $items->count() !== count($itemIds),
                422,
                'Algunos items ya no existen.',
            );

            $alreadyPaid = $items->whereNotNull('commission_payment_id');
            abort_if(
                $alreadyPaid->isNotEmpty(),
                422,
                'Algunas comisiones ya están registradas como pagadas (items #'
                    .$alreadyPaid->pluck('id')->join(', ').').',
            );

            $wrongSpecialist = $items->filter(
                fn ($i) => (int) $i->specialist_id !== $specialistId,
            );
            abort_if(
                $wrongSpecialist->isNotEmpty(),
                422,
                'Los items deben corresponder al mismo especialista seleccionado.',
            );

            $zeroOrNoCommission = $items->filter(
                fn ($i) => (float) $i->commission_amount <= 0,
            );
            abort_if(
                $zeroOrNoCommission->isNotEmpty(),
                422,
                'Algunos items no tienen comisión registrada.',
            );

            $totalAmount = round((float) $items->sum('commission_amount'), 2);

            $cashSession = null;
            $cashExpense = null;
            if ($registerAsExpense) {
                $cashSession = CashSession::query()
                    ->where('status', 'open')
                    ->first();
                abort_if(! $cashSession, 422,
                    'No hay una caja abierta. Abre la caja del día antes de registrar el egreso.');

                $cashExpense = CashExpense::query()->create([
                    'tenant_id' => $tenantId,
                    'cash_session_id' => $cashSession->id,
                    'user_id' => $userId,
                    'category' => 'commission',
                    'description' => 'Pago de comisiones',
                    'method' => $data['method'],
                    'amount' => $totalAmount,
                    'reference' => $data['reference'] ?? null,
                    'paid_at' => $data['paid_at'] ?? now(),
                ]);
            }

            $payment = CommissionPayment::query()->create([
                'tenant_id' => $tenantId,
                'specialist_id' => $specialistId,
                'paid_at' => $data['paid_at'] ?? now(),
                'amount' => $totalAmount,
                'method' => $data['method'],
                'reference' => $data['reference'] ?? null,
                'notes' => $data['notes'] ?? null,
                'cash_session_id' => $cashSession?->id,
                'cash_expense_id' => $cashExpense?->id,
                'created_by_user_id' => $userId,
            ]);

            ChargeItem::query()
                ->whereIn('id', $itemIds)
                ->update(['commission_payment_id' => $payment->id]);

            return $payment;
        });

        $payment->load([
            'specialist',
            'createdBy',
            'items.charge.patient',
        ]);

        return response()->json([
            'data' => CommissionPaymentResource::make($payment),
        ], 201);
    }

    public function destroy(CommissionPayment $payment): JsonResponse
    {
        $this->authorize('delete', $payment);

        DB::transaction(function () use ($payment): void {
            ChargeItem::query()
                ->where('commission_payment_id', $payment->id)
                ->update(['commission_payment_id' => null]);

            if ($payment->cashExpense
                && $payment->cashExpense->cashSession?->status === 'open') {
                $payment->cashExpense->delete();
            }
            $payment->delete();
        });

        return response()->json(['message' => 'OK']);
    }
}
