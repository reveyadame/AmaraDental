<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\ChargeItem;
use App\Support\Permissions;
use App\Models\ChargePayment;
use Carbon\Carbon;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\DB;

/**
 * Endpoints de reportes (solo admin). Cada método devuelve KPIs + desgloses
 * listos para consumir desde el frontend.
 *
 * Las fechas se interpretan en la zona horaria de la aplicación
 * (`config('app.timezone')`) — el usuario captura "del 1 al 30" y obtiene
 * los resultados del día local.
 */
class ReportsController extends Controller implements HasMiddleware
{
    /** @return array<int, Middleware|string> */
    public static function middleware(): array
    {
        return ['auth:sanctum'];
    }

    public function sales(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        [$from, $to] = $this->range($request);

        $base = ChargeItem::query()
            ->join('charges', 'charges.id', '=', 'charge_items.charge_id')
            ->whereNull('charges.deleted_at')
            ->where('charges.status', '!=', 'cancelled')
            ->whereBetween('charges.created_at', [$from, $to]);

        if ($request->filled('specialist_id')) {
            $base->where('charge_items.specialist_id', $request->integer('specialist_id'));
        }

        $totals = (clone $base)
            ->selectRaw('SUM(charge_items.line_total) as gross, SUM(charge_items.discount_amount) as discount, COUNT(DISTINCT charges.id) as charge_count, COUNT(charge_items.id) as line_count')
            ->first();

        $byTreatment = (clone $base)
            ->select(
                'charge_items.treatment_id',
                'charge_items.treatment_name',
                DB::raw('SUM(charge_items.line_total) as total'),
                DB::raw('SUM(charge_items.quantity) as qty'),
            )
            ->groupBy('charge_items.treatment_id', 'charge_items.treatment_name')
            ->orderByDesc('total')
            ->limit(20)
            ->get();

        $bySpecialist = (clone $base)
            ->select(
                'charge_items.specialist_id',
                'charge_items.specialist_name',
                DB::raw('SUM(charge_items.line_total) as total'),
                DB::raw('COUNT(charge_items.id) as count'),
            )
            ->groupBy('charge_items.specialist_id', 'charge_items.specialist_name')
            ->orderByDesc('total')
            ->get();

        $byDay = (clone $base)
            ->select(
                DB::raw('DATE(charges.created_at) as day'),
                DB::raw('SUM(charge_items.line_total) as total'),
            )
            ->groupBy('day')
            ->orderBy('day')
            ->get();

        return response()->json([
            'meta' => [
                'date_from' => $from->toIso8601String(),
                'date_to' => $to->toIso8601String(),
            ],
            'totals' => [
                'gross' => (float) ($totals->gross ?? 0),
                'discount' => (float) ($totals->discount ?? 0),
                'net' => (float) ($totals->gross ?? 0) - (float) ($totals->discount ?? 0),
                'charges' => (int) ($totals->charge_count ?? 0),
                'lines' => (int) ($totals->line_count ?? 0),
            ],
            'by_treatment' => $byTreatment->map(fn ($r) => [
                'treatment_id' => $r->treatment_id,
                'treatment_name' => $r->treatment_name,
                'total' => (float) $r->total,
                'qty' => (int) $r->qty,
            ]),
            'by_specialist' => $bySpecialist->map(fn ($r) => [
                'specialist_id' => $r->specialist_id,
                'specialist_name' => $r->specialist_name ?? 'Sin asignar',
                'total' => (float) $r->total,
                'count' => (int) $r->count,
            ]),
            'by_day' => $byDay->map(fn ($r) => [
                'day' => $r->day,
                'total' => (float) $r->total,
            ]),
        ]);
    }

    public function payments(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        [$from, $to] = $this->range($request);

        $base = ChargePayment::query()
            ->whereBetween('paid_at', [$from, $to]);

        if ($request->filled('user_id')) {
            $base->where('user_id', $request->integer('user_id'));
        }

        $totals = (clone $base)
            ->selectRaw('SUM(amount) as total, COUNT(*) as count')
            ->first();

        $byMethod = (clone $base)
            ->select('method', DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('method')
            ->get();

        $byUser = (clone $base)
            ->leftJoin('users', 'users.id', '=', 'charge_payments.user_id')
            ->select(
                'charge_payments.user_id',
                'users.name as user_name',
                DB::raw('SUM(charge_payments.amount) as total'),
                DB::raw('COUNT(charge_payments.id) as count'),
            )
            ->groupBy('charge_payments.user_id', 'users.name')
            ->orderByDesc('total')
            ->get();

        $byDay = (clone $base)
            ->select(DB::raw('DATE(paid_at) as day'), DB::raw('SUM(amount) as total'))
            ->groupBy('day')
            ->orderBy('day')
            ->get();

        return response()->json([
            'meta' => [
                'date_from' => $from->toIso8601String(),
                'date_to' => $to->toIso8601String(),
            ],
            'totals' => [
                'total' => (float) ($totals->total ?? 0),
                'count' => (int) ($totals->count ?? 0),
            ],
            'by_method' => $byMethod->map(fn ($r) => [
                'method' => $r->method,
                'total' => (float) $r->total,
                'count' => (int) $r->count,
            ]),
            'by_user' => $byUser->map(fn ($r) => [
                'user_id' => $r->user_id,
                'user_name' => $r->user_name ?? '—',
                'total' => (float) $r->total,
                'count' => (int) $r->count,
            ]),
            'by_day' => $byDay->map(fn ($r) => [
                'day' => $r->day,
                'total' => (float) $r->total,
            ]),
        ]);
    }

    public function commissions(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        [$from, $to] = $this->range($request);

        $base = ChargeItem::query()
            ->join('charges', 'charges.id', '=', 'charge_items.charge_id')
            ->whereNull('charges.deleted_at')
            ->where('charges.status', '!=', 'cancelled')
            ->whereNotNull('charge_items.specialist_id')
            ->whereBetween('charges.created_at', [$from, $to]);

        if ($request->filled('specialist_id')) {
            $base->where('charge_items.specialist_id', $request->integer('specialist_id'));
        }

        $totals = (clone $base)
            ->selectRaw('SUM(commission_amount) as total, COUNT(*) as count, SUM(charge_items.line_total) as base_total')
            ->first();

        $bySpecialist = (clone $base)
            ->select(
                'charge_items.specialist_id',
                'charge_items.specialist_name',
                DB::raw('SUM(charge_items.commission_amount) as commission'),
                DB::raw('SUM(charge_items.line_total) as line_total'),
                DB::raw('COUNT(charge_items.id) as count'),
            )
            ->groupBy('charge_items.specialist_id', 'charge_items.specialist_name')
            ->orderByDesc('commission')
            ->get();

        $items = (clone $base)
            ->join('patients', 'patients.id', '=', 'charges.patient_id')
            ->select(
                'charge_items.id',
                'charge_items.treatment_name',
                'charge_items.specialist_id',
                'charge_items.specialist_name',
                'charge_items.line_total',
                'charge_items.commission_percent',
                'charge_items.commission_amount',
                'charges.id as charge_id',
                'charges.code as charge_code',
                'charges.status as charge_status',
                'charges.created_at as charge_created_at',
                'patients.first_name',
                'patients.last_name',
            )
            ->orderByDesc('charges.created_at')
            ->limit(500)
            ->get();

        return response()->json([
            'meta' => [
                'date_from' => $from->toIso8601String(),
                'date_to' => $to->toIso8601String(),
            ],
            'totals' => [
                'commission' => (float) ($totals->total ?? 0),
                'count' => (int) ($totals->count ?? 0),
                'base' => (float) ($totals->base_total ?? 0),
            ],
            'by_specialist' => $bySpecialist->map(fn ($r) => [
                'specialist_id' => $r->specialist_id,
                'specialist_name' => $r->specialist_name ?? 'Sin asignar',
                'commission' => (float) $r->commission,
                'line_total' => (float) $r->line_total,
                'count' => (int) $r->count,
            ]),
            'items' => $items->map(fn ($r) => [
                'id' => $r->id,
                'charge_id' => $r->charge_id,
                'charge_code' => $r->charge_code,
                'charge_status' => $r->charge_status,
                'charge_created_at' => $r->charge_created_at,
                'specialist_id' => $r->specialist_id,
                'specialist_name' => $r->specialist_name ?? '—',
                'treatment_name' => $r->treatment_name,
                'patient_name' => trim(($r->first_name ?? '').' '.($r->last_name ?? '')),
                'line_total' => (float) $r->line_total,
                'commission_percent' => $r->commission_percent !== null
                    ? (float) $r->commission_percent : null,
                'commission_amount' => (float) $r->commission_amount,
            ]),
        ]);
    }

    private function ensureAdmin(Request $request): void
    {
        abort_unless($request->user()?->can(Permissions::REPORTS_VIEW), 403);
    }

    /**
     * Parsea date_from/date_to del request en la zona horaria de la app.
     * Default: este mes (del día 1 a hoy).
     *
     * @return array{0: CarbonImmutable, 1: CarbonImmutable}
     */
    private function range(Request $request): array
    {
        $tz = config('app.timezone', 'America/Mexico_City');

        $from = $request->filled('date_from')
            ? CarbonImmutable::parse((string) $request->input('date_from'), $tz)->startOfDay()
            : CarbonImmutable::now($tz)->startOfMonth();

        $to = $request->filled('date_to')
            ? CarbonImmutable::parse((string) $request->input('date_to'), $tz)->endOfDay()
            : CarbonImmutable::now($tz)->endOfDay();

        // Por si vienen invertidas, las acomoda.
        if ($from->gt($to)) {
            [$from, $to] = [$to, $from];
        }

        return [$from, $to];
    }
}
