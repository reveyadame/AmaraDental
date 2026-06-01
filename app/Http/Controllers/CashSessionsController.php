<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Cash\CloseCashSessionRequest;
use App\Http\Requests\Cash\OpenCashSessionRequest;
use App\Http\Resources\CashSessionResource;
use App\Models\CashSession;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class CashSessionsController extends Controller implements HasMiddleware
{
    /** @return array<int, Middleware|string> */
    public static function middleware(): array
    {
        return ['auth:sanctum'];
    }

    public function current(Request $request): JsonResponse
    {
        // Caja global: hay como máximo una sesión abierta por tenant. Cualquier
        // usuario con cash.operate la ve y la opera, sin importar quién la abrió.
        $session = CashSession::query()
            ->where('status', 'open')
            ->with(['user', 'closedBy', 'payments', 'expenses.user'])
            ->latest('opened_at')
            ->first();

        return response()->json([
            'data' => $session ? CashSessionResource::make($session) : null,
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', CashSession::class);

        $sessions = CashSession::query()
            ->with(['user', 'closedBy', 'payments', 'expenses.user'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('user_id'), fn ($q) => $q->where('user_id', $request->integer('user_id')))
            ->orderByDesc('opened_at')
            ->paginate($request->integer('per_page', 25));

        return response()->json([
            'data' => CashSessionResource::collection($sessions->items()),
            'meta' => [
                'current_page' => $sessions->currentPage(),
                'last_page' => $sessions->lastPage(),
                'per_page' => $sessions->perPage(),
                'total' => $sessions->total(),
            ],
        ]);
    }

    public function show(CashSession $cashSession): JsonResponse
    {
        $this->authorize('view', $cashSession);

        $cashSession->load([
            'user',
            'closedBy',
            'payments.user',
            'payments.charge.patient',
            'expenses.user',
        ]);

        return response()->json([
            'data' => CashSessionResource::make($cashSession),
        ]);
    }

    public function open(OpenCashSessionRequest $request): JsonResponse
    {
        $this->authorize('operate', CashSession::class);

        // Caja global: solo una sesión abierta por tenant a la vez.
        $existing = CashSession::query()
            ->where('status', 'open')
            ->exists();

        abort_if($existing, 422,
            'Ya hay una caja abierta. Pídele a quien la abrió, o a un administrador, '
            .'que la cierre antes de abrir otra.');

        $session = CashSession::query()->create([
            'tenant_id' => TenantContext::tenantId(),
            'user_id' => $request->user()->id,
            'opening_amount' => $request->input('opening_amount'),
            'opened_at' => now(),
            'status' => 'open',
            'notes' => $request->input('notes'),
        ]);

        $session->load(['user', 'closedBy', 'payments']);

        return response()->json([
            'data' => CashSessionResource::make($session),
        ], 201);
    }

    public function close(CloseCashSessionRequest $request, CashSession $cashSession): JsonResponse
    {
        $this->authorize('close', $cashSession);

        abort_unless($cashSession->isOpen(), 422, 'La sesión ya está cerrada.');

        // Sumas esperadas por método registradas durante la sesión.
        $cashTotal = (float) $cashSession->payments()->where('method', 'cash')->sum('amount');
        $cardTotal = (float) $cashSession->payments()->where('method', 'card')->sum('amount');
        $cardCreditTotal = (float) $cashSession->payments()
            ->where('method', 'card_credit')->sum('amount');
        $transferTotal = (float) $cashSession->payments()
            ->where('method', 'transfer')->sum('amount');

        // Egresos por método (salen de caja).
        $cashExpenses = (float) $cashSession->expenses()->where('method', 'cash')->sum('amount');
        $cardExpenses = (float) $cashSession->expenses()->where('method', 'card')->sum('amount');
        $cardCreditExpenses = (float) $cashSession->expenses()
            ->where('method', 'card_credit')->sum('amount');
        $transferExpenses = (float) $cashSession->expenses()
            ->where('method', 'transfer')->sum('amount');

        // Efectivo: apertura + cobros − egresos en efectivo = esperado.
        $expectedCash = round(
            (float) $cashSession->opening_amount + $cashTotal - $cashExpenses,
            2,
        );
        $cashClosing = (float) $request->input('closing_amount');
        $cashDifference = round($cashClosing - $expectedCash, 2);

        // Tarjeta débito / tarjeta crédito / transferencia: cobros − egresos del periodo.
        $cardCounted = $request->input('card_counted');
        $cardExpected = round($cardTotal - $cardExpenses, 2);
        $cardDifference = $cardCounted !== null
            ? round((float) $cardCounted - $cardExpected, 2)
            : null;

        $cardCreditCounted = $request->input('card_credit_counted');
        $cardCreditExpected = round($cardCreditTotal - $cardCreditExpenses, 2);
        $cardCreditDifference = $cardCreditCounted !== null
            ? round((float) $cardCreditCounted - $cardCreditExpected, 2)
            : null;

        $transferCounted = $request->input('transfer_counted');
        $transferExpected = round($transferTotal - $transferExpenses, 2);
        $transferDifference = $transferCounted !== null
            ? round((float) $transferCounted - $transferExpected, 2)
            : null;

        $cashSession->update([
            'closing_amount' => $cashClosing,
            'expected_cash' => $expectedCash,
            'difference' => $cashDifference,
            'card_counted' => $cardCounted !== null ? (float) $cardCounted : null,
            'card_expected' => $cardExpected,
            'card_difference' => $cardDifference,
            'card_credit_counted' => $cardCreditCounted !== null ? (float) $cardCreditCounted : null,
            'card_credit_expected' => $cardCreditExpected,
            'card_credit_difference' => $cardCreditDifference,
            'transfer_counted' => $transferCounted !== null ? (float) $transferCounted : null,
            'transfer_expected' => $transferExpected,
            'transfer_difference' => $transferDifference,
            'closed_at' => now(),
            'closed_by_user_id' => $request->user()->id,
            'status' => 'closed',
            'close_notes' => $request->input('close_notes'),
        ]);

        $cashSession->load(['user', 'closedBy', 'payments', 'expenses.user']);

        return response()->json([
            'data' => CashSessionResource::make($cashSession),
        ]);
    }

    /**
     * Bitácora unificada de movimientos de la sesión: entradas (pagos) y
     * salidas (egresos), ordenadas por fecha desc con paginación. Es lo
     * que se ve en la página de Caja como "Movimientos recientes".
     */
    public function movements(Request $request, CashSession $cashSession): JsonResponse
    {
        $this->authorize('view', $cashSession);
        // Cualquier rol con acceso al recurso puede ver sus movimientos.
        $typeFilter = $request->string('type')->toString(); // all | payment | expense

        // Cargamos ambos universos. Una sesión típica tiene decenas de items;
        // mezclar en memoria es más simple y suficiente.
        $payments = $typeFilter === 'expense'
            ? collect()
            : $cashSession->payments()
                ->with(['charge.patient', 'user'])
                ->get()
                ->map(fn ($p) => [
                    'type' => 'payment',
                    'id' => $p->id,
                    'occurred_at' => $p->paid_at?->toIso8601String(),
                    'occurred_at_ts' => $p->paid_at?->timestamp ?? 0,
                    'amount' => (float) $p->amount,
                    'method' => $p->method,
                    'reference' => $p->reference,
                    'notes' => $p->notes,
                    'charge_id' => $p->charge_id,
                    'charge_code' => $p->charge?->code,
                    'patient_id' => $p->charge?->patient_id,
                    'patient_name' => $p->charge?->patient?->full_name,
                    'user_name' => $p->user?->name,
                    'category' => null,
                    'description' => null,
                ]);

        $expenses = $typeFilter === 'payment'
            ? collect()
            : $cashSession->expenses()
                ->with('user')
                ->get()
                ->map(fn ($e) => [
                    'type' => 'expense',
                    'id' => $e->id,
                    'occurred_at' => $e->paid_at?->toIso8601String(),
                    'occurred_at_ts' => $e->paid_at?->timestamp ?? 0,
                    'amount' => (float) $e->amount,
                    'method' => $e->method,
                    'reference' => $e->reference,
                    'notes' => $e->notes,
                    'charge_id' => null,
                    'charge_code' => null,
                    'patient_id' => null,
                    'patient_name' => null,
                    'user_name' => $e->user?->name,
                    'category' => $e->category,
                    'description' => $e->description,
                ]);

        $all = $payments
            ->concat($expenses)
            ->sortByDesc('occurred_at_ts')
            ->values();

        $perPage = max(1, min(100, $request->integer('per_page', 25)));
        $page = max(1, $request->integer('page', 1));
        $total = $all->count();
        $items = $all->slice(($page - 1) * $perPage, $perPage)
            ->map(function ($row) {
                unset($row['occurred_at_ts']);
                return $row;
            })
            ->values();

        // Resumen del periodo completo (no de la página).
        $totalIn = $payments->sum('amount');
        $totalOut = $expenses->sum('amount');

        return response()->json([
            'data' => $items,
            'meta' => [
                'current_page' => $page,
                'last_page' => max(1, (int) ceil($total / $perPage)),
                'per_page' => $perPage,
                'total' => $total,
                'sums' => [
                    'in' => round((float) $totalIn, 2),
                    'out' => round((float) $totalOut, 2),
                    'net' => round((float) ($totalIn - $totalOut), 2),
                ],
            ],
        ]);
    }
}
