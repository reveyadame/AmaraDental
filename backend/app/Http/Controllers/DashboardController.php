<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\CashSession;
use App\Models\Charge;
use App\Models\ChargePayment;
use App\Models\LabOrder;
use App\Models\Patient;
use App\Models\Recall;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\DB;

/**
 * Endpoint agregado para el Dashboard. Devuelve KPIs, series y listas en una
 * sola llamada para evitar 8 queries paralelos desde el cliente.
 */
class DashboardController extends Controller implements HasMiddleware
{
    /** @return array<int, Middleware|string> */
    public static function middleware(): array
    {
        return ['auth:sanctum'];
    }

    public function index(Request $request): JsonResponse
    {
        $today = CarbonImmutable::today();
        $startOfDay = $today->startOfDay();
        $endOfDay = $today->endOfDay();
        $yesterdayStart = $today->subDay()->startOfDay();
        $yesterdayEnd = $today->subDay()->endOfDay();

        // -------------- KPIs --------------
        $revenueToday = (float) ChargePayment::query()
            ->whereBetween('paid_at', [$startOfDay, $endOfDay])
            ->sum('amount');

        $revenueYesterday = (float) ChargePayment::query()
            ->whereBetween('paid_at', [$yesterdayStart, $yesterdayEnd])
            ->sum('amount');

        $pendingCharges = Charge::query()
            ->where('balance', '>', 0)
            ->whereIn('status', ['pending', 'partial'])
            ->selectRaw('COUNT(*) as count, COALESCE(SUM(balance), 0) as total')
            ->first();

        $appointmentsTodayCount = Appointment::query()
            ->whereBetween('starts_at', [$startOfDay, $endOfDay])
            ->whereNotIn('status', ['cancelled'])
            ->count();

        $recallsOverdueCount = Recall::query()
            ->where('status', Recall::STATUS_PENDING)
            ->whereDate('due_on', '<', $today->toDateString())
            ->count();

        $recallsThisWeekCount = Recall::query()
            ->where('status', Recall::STATUS_PENDING)
            ->whereBetween('due_on', [
                $today->toDateString(),
                $today->endOfWeek()->toDateString(),
            ])
            ->count();

        $patientsTotal = Patient::query()->where('active', true)->count();

        $labOrdersOverdueCount = LabOrder::query()
            ->whereIn('status', [
                LabOrder::STATUS_PENDING,
                LabOrder::STATUS_IN_PROGRESS,
            ])
            ->whereDate('due_on', '<', $today->toDateString())
            ->count();

        // -------------- Serie de ingresos (últimos 14 días) --------------
        $seriesStart = $today->subDays(13)->startOfDay();
        $rawSeries = ChargePayment::query()
            ->selectRaw('DATE(paid_at) as day, SUM(amount) as total')
            ->where('paid_at', '>=', $seriesStart)
            ->groupBy('day')
            ->pluck('total', 'day');

        $series = [];
        for ($i = 0; $i < 14; $i++) {
            $d = $seriesStart->addDays($i)->toDateString();
            $series[] = [
                'date' => $d,
                'total' => (float) ($rawSeries[$d] ?? 0),
            ];
        }

        // -------------- Pagos del día por método --------------
        $paymentsByMethodToday = ChargePayment::query()
            ->selectRaw('method, SUM(amount) as total')
            ->whereBetween('paid_at', [$startOfDay, $endOfDay])
            ->groupBy('method')
            ->pluck('total', 'method');

        // -------------- Próximas citas de hoy --------------
        $upcomingAppointments = Appointment::query()
            ->with(['patient', 'specialist', 'treatment'])
            ->whereBetween('starts_at', [$startOfDay, $endOfDay])
            ->whereNotIn('status', ['cancelled', 'completed', 'no_show'])
            ->where('starts_at', '>=', now())
            ->orderBy('starts_at')
            ->limit(6)
            ->get()
            ->map(fn (Appointment $a) => [
                'id' => $a->id,
                'starts_at' => $a->starts_at?->toIso8601String(),
                'ends_at' => $a->ends_at?->toIso8601String(),
                'patient_name' => $a->patient?->full_name,
                'patient_id' => $a->patient_id,
                'specialist_name' => $a->specialist?->name,
                'treatment_name' => $a->treatment?->name,
                'status' => $a->status,
            ]);

        // -------------- Recalls urgentes (vencidos + esta semana) --------------
        $urgentRecalls = Recall::query()
            ->with(['patient', 'treatment'])
            ->where('status', Recall::STATUS_PENDING)
            ->where('due_on', '<=', $today->endOfWeek()->toDateString())
            ->orderBy('due_on')
            ->limit(5)
            ->get()
            ->map(fn (Recall $r) => [
                'id' => $r->id,
                'patient_id' => $r->patient_id,
                'patient_name' => $r->patient?->full_name,
                'treatment_name' => $r->treatment?->name,
                'recall_label' => $r->treatment?->recall_label ?? $r->treatment?->name,
                'due_on' => $r->due_on?->toDateString(),
                'days_until_due' => $r->due_on
                    ? (int) now()->startOfDay()->diffInDays($r->due_on->startOfDay(), false)
                    : null,
            ]);

        // -------------- Pacientes con saldo pendiente (top 5) --------------
        $topPending = Charge::query()
            ->select(
                'patient_id',
                DB::raw('SUM(balance) as total_balance'),
                DB::raw('COUNT(*) as charges_count'),
            )
            ->where('balance', '>', 0)
            ->whereIn('status', ['pending', 'partial'])
            ->groupBy('patient_id')
            ->orderByDesc('total_balance')
            ->limit(5)
            ->with('patient')
            ->get()
            ->map(fn ($row) => [
                'patient_id' => (int) $row->patient_id,
                'patient_name' => $row->patient?->full_name,
                'total_balance' => (float) $row->total_balance,
                'charges_count' => (int) $row->charges_count,
            ]);

        // -------------- Caja global abierta --------------
        $session = CashSession::query()
            ->with(['payments', 'expenses'])
            ->where('status', 'open')
            ->first();

        $cashSession = null;
        if ($session) {
            $paymentsTotal = (float) $session->payments->sum('amount');
            $expensesTotal = (float) $session->expenses->sum('amount');
            $cashSession = [
                'id' => $session->id,
                'opened_at' => $session->opened_at?->toIso8601String(),
                'opening_amount' => (float) $session->opening_amount,
                'payments_total' => round($paymentsTotal, 2),
                'expenses_total' => round($expensesTotal, 2),
                'payments_by_method' => $session->payments
                    ->groupBy('method')
                    ->map(fn ($items) => round((float) $items->sum('amount'), 2)),
            ];
        }

        return response()->json([
            'data' => [
                'kpis' => [
                    'revenue_today' => round($revenueToday, 2),
                    'revenue_yesterday' => round($revenueYesterday, 2),
                    'pending_balance_count' => (int) ($pendingCharges->count ?? 0),
                    'pending_balance_total' => round(
                        (float) ($pendingCharges->total ?? 0),
                        2,
                    ),
                    'appointments_today_count' => $appointmentsTodayCount,
                    'recalls_overdue_count' => $recallsOverdueCount,
                    'recalls_this_week_count' => $recallsThisWeekCount,
                    'patients_total' => $patientsTotal,
                    'lab_orders_overdue_count' => $labOrdersOverdueCount,
                ],
                'revenue_series' => $series,
                'payments_by_method_today' => [
                    'cash' => round((float) ($paymentsByMethodToday['cash'] ?? 0), 2),
                    'card' => round((float) ($paymentsByMethodToday['card'] ?? 0), 2),
                    'card_credit' => round((float) ($paymentsByMethodToday['card_credit'] ?? 0), 2),
                    'transfer' => round((float) ($paymentsByMethodToday['transfer'] ?? 0), 2),
                ],
                'upcoming_appointments' => $upcomingAppointments,
                'urgent_recalls' => $urgentRecalls,
                'top_pending_balances' => $topPending,
                'cash_session' => $cashSession,
            ],
        ]);
    }
}
