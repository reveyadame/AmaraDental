<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Cash\StoreCashExpenseRequest;
use App\Http\Resources\CashExpenseResource;
use App\Models\CashExpense;
use App\Models\CashSession;
use App\Support\TenantContext;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class CashExpensesController extends Controller implements HasMiddleware
{
    use AuthorizesRequests;

    /** @return array<int, Middleware|string> */
    public static function middleware(): array
    {
        return ['auth:sanctum'];
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', CashExpense::class);

        $expenses = CashExpense::query()
            ->with(['user'])
            ->when($request->filled('cash_session_id'),
                fn ($q) => $q->where('cash_session_id', $request->integer('cash_session_id')))
            ->when($request->filled('category'),
                fn ($q) => $q->where('category', $request->string('category')))
            ->when($request->filled('date_from'),
                fn ($q) => $q->whereDate('paid_at', '>=', $request->date('date_from')))
            ->when($request->filled('date_to'),
                fn ($q) => $q->whereDate('paid_at', '<=', $request->date('date_to')))
            ->orderByDesc('paid_at')
            ->paginate($request->integer('per_page', 50));

        return response()->json([
            'data' => CashExpenseResource::collection($expenses->items()),
            'meta' => [
                'current_page' => $expenses->currentPage(),
                'last_page' => $expenses->lastPage(),
                'per_page' => $expenses->perPage(),
                'total' => $expenses->total(),
            ],
        ]);
    }

    public function store(StoreCashExpenseRequest $request): JsonResponse
    {
        $userId = $request->user()->id;
        // Caja global: usa la única sesión abierta del tenant.
        $session = CashSession::query()
            ->where('status', 'open')
            ->first();
        abort_if(! $session, 422, 'No hay una caja abierta. Abre la caja del día antes de registrar un egreso.');

        $expense = CashExpense::query()->create([
            'tenant_id' => TenantContext::tenantId(),
            'cash_session_id' => $session->id,
            'user_id' => $userId,
            'category' => $request->input('category'),
            'description' => $request->input('description'),
            'method' => $request->input('method'),
            'amount' => $request->input('amount'),
            'reference' => $request->input('reference'),
            'related_lab_order_id' => $request->input('related_lab_order_id'),
            'paid_at' => $request->input('paid_at') ?? now(),
            'notes' => $request->input('notes'),
        ]);
        $expense->load('user');

        return response()->json(['data' => CashExpenseResource::make($expense)], 201);
    }

    public function destroy(Request $request, CashExpense $expense): JsonResponse
    {
        $this->authorize('delete', $expense);

        // Solo permitido si la sesión sigue abierta — una vez cerrada, queda
        // como parte del registro inmutable del corte.
        $session = $expense->cashSession;
        abort_if($session && $session->status === 'closed', 422,
            'No se puede eliminar un egreso de un corte ya cerrado.');

        $force = (bool) $request->boolean('force');

        // Dependencia conocida: este egreso fue generado por el pago de una
        // comisión (CommissionPayment.cash_expense_id = expense.id).
        $commissionPayment = \App\Models\CommissionPayment::query()
            ->with('specialist')
            ->where('cash_expense_id', $expense->id)
            ->first();

        if ($commissionPayment && ! $force) {
            return response()->json([
                'message' => 'Este egreso registra un pago de comisión. Confirma para revertirlo.',
                'dependencies' => [
                    'commission_payment' => [
                        'id' => $commissionPayment->id,
                        'specialist_name' => $commissionPayment->specialist?->name,
                        'amount' => (float) $commissionPayment->amount,
                        'paid_at' => $commissionPayment->paid_at?->toIso8601String(),
                    ],
                ],
            ], 409);
        }

        \Illuminate\Support\Facades\DB::transaction(function () use ($expense, $commissionPayment): void {
            if ($commissionPayment) {
                // Liberar los items y borrar el commission_payment.
                \App\Models\ChargeItem::query()
                    ->where('commission_payment_id', $commissionPayment->id)
                    ->update(['commission_payment_id' => null]);
                $commissionPayment->delete();
            }
            $expense->delete();
        });

        return response()->json(['message' => 'OK']);
    }
}
