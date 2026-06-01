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

        // Ingreso real = dinero que efectivamente entró. Excluye `credit`
        // (saldo a favor usado), que ya fue dinero real cuando se depositó;
        // contarlo de nuevo lo duplicaría. Mismo criterio que CashSessionResource.
        $cashFlowMethods = ['cash', 'card', 'card_credit', 'transfer'];

        // -------------- KPIs --------------
        $revenueToday = (float) ChargePayment::query()
            ->whereIn('method', $cashFlowMethods)
            ->whereBetween('paid_at', [$startOfDay, $endOfDay])
            ->sum('amount');

        $revenueYesterday = (float) ChargePayment::query()
            ->whereIn('method', $cashFlowMethods)
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
            ->whereIn('method', $cashFlowMethods)
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

        // -------------- Caja global abierta --------------
        $session = CashSession::query()
            ->with(['payments', 'expenses'])
            ->where('status', 'open')
            ->first();

        $cashSession = null;
        if ($session) {
            // Total cobrado = ingreso real (sin saldo a favor), igual que la caja.
            $paymentsTotal = (float) $session->payments
                ->whereIn('method', $cashFlowMethods)
                ->sum('amount');
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
                'expenses_by_method' => $session->expenses
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
                'upcoming_appointments' => $upcomingAppointments,
                'urgent_recalls' => $urgentRecalls,
                'cash_session' => $cashSession,
            ],
        ]);
    }
}
