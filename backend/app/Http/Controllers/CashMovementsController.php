<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Models\CashExpense;
use App\Models\ChargePayment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

/**
 * Vista consolidada de movimientos de caja (pagos + egresos) cruzando todas
 * las sesiones del tenant. Pensada como herramienta administrativa para
 * auditar y cancelar errores: el admin puede ubicar un movimiento por fecha
 * o por paciente y revertirlo desde aquí.
 *
 * Solo admin (las acciones de cancelar/eliminar también son admin-only en
 * sus respectivos controladores).
 */
class CashMovementsController extends Controller implements HasMiddleware
{
    /** @return array<int, Middleware|string> */
    public static function middleware(): array
    {
        return ['auth:sanctum'];
    }

    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()?->hasRole(Role::Admin->value), 403);

        $typeFilter = $request->string('type')->toString(); // all | payment | expense
        $methodFilter = $request->string('method')->toString(); // cash | card | transfer
        $dateFrom = $request->date('date_from')?->startOfDay();
        $dateTo = $request->date('date_to')?->endOfDay();
        $q = trim((string) $request->string('q'));

        $payments = $typeFilter === 'expense'
            ? collect()
            : ChargePayment::query()
                ->with(['charge.patient', 'user', 'cashSession'])
                ->when($methodFilter, fn ($qq) => $qq->where('method', $methodFilter))
                ->when($dateFrom, fn ($qq) => $qq->where('paid_at', '>=', $dateFrom))
                ->when($dateTo, fn ($qq) => $qq->where('paid_at', '<=', $dateTo))
                ->when($q !== '', function ($qq) use ($q): void {
                    $term = '%'.$q.'%';
                    $qq->where(function ($qq) use ($term): void {
                        $qq->whereHas('charge', function ($qq) use ($term): void {
                            $qq->where('code', 'like', $term)
                              ->orWhereHas('patient', function ($qq) use ($term): void {
                                  $qq->where('first_name', 'like', $term)
                                    ->orWhere('last_name', 'like', $term);
                              });
                        });
                    });
                })
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
                    'charge_status' => $p->charge?->status,
                    'patient_id' => $p->charge?->patient_id,
                    'patient_name' => $p->charge?->patient?->full_name,
                    'registered_by_name' => $p->user?->name,
                    'cash_session_id' => $p->cash_session_id,
                    'cash_session_status' => $p->cashSession?->status,
                    'category' => null,
                    'description' => null,
                ]);

        $expenses = $typeFilter === 'payment'
            ? collect()
            : CashExpense::query()
                ->with(['user', 'cashSession'])
                ->when($methodFilter, fn ($qq) => $qq->where('method', $methodFilter))
                ->when($dateFrom, fn ($qq) => $qq->where('paid_at', '>=', $dateFrom))
                ->when($dateTo, fn ($qq) => $qq->where('paid_at', '<=', $dateTo))
                ->when($q !== '', function ($qq) use ($q): void {
                    $term = '%'.$q.'%';
                    $qq->where(function ($qq) use ($term): void {
                        $qq->where('description', 'like', $term)
                          ->orWhere('category', 'like', $term);
                    });
                })
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
                    'charge_status' => null,
                    'patient_id' => null,
                    'patient_name' => null,
                    'registered_by_name' => $e->user?->name,
                    'cash_session_id' => $e->cash_session_id,
                    'cash_session_status' => $e->cashSession?->status,
                    'category' => $e->category,
                    'description' => $e->description,
                ]);

        $all = $payments
            ->concat($expenses)
            ->sortByDesc('occurred_at_ts')
            ->values();

        $perPage = max(1, min(200, $request->integer('per_page', 50)));
        $page = max(1, $request->integer('page', 1));
        $total = $all->count();
        $items = $all->slice(($page - 1) * $perPage, $perPage)
            ->map(function ($row) {
                unset($row['occurred_at_ts']);
                return $row;
            })
            ->values();

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
