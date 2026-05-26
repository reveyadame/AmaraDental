<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Memberships\StoreMembershipRequest;
use App\Http\Resources\MembershipResource;
use App\Models\CashSession;
use App\Models\Charge;
use App\Models\ChargeItem;
use App\Models\Membership;
use App\Models\MembershipPlan;
use App\Models\Patient;
use App\Support\TenantContext;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class MembershipsController extends Controller implements HasMiddleware
{
    use AuthorizesRequests;

    /** @return array<int, Middleware|string> */
    public static function middleware(): array
    {
        return ['auth:sanctum'];
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Membership::class);

        $memberships = Membership::query()
            ->with(['patient', 'plan'])
            ->when($request->filled('status'),
                fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('patient_id'),
                fn ($q) => $q->where('patient_id', $request->integer('patient_id')))
            ->when($request->boolean('expiring_soon'), function ($q): void {
                // próximas a vencer (30 días).
                $q->where('status', Membership::STATUS_ACTIVE)
                  ->whereBetween('ends_on', [now()->toDateString(), now()->addDays(30)->toDateString()]);
            })
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 25));

        return response()->json([
            'data' => MembershipResource::collection($memberships->items()),
            'meta' => [
                'current_page' => $memberships->currentPage(),
                'last_page' => $memberships->lastPage(),
                'per_page' => $memberships->perPage(),
                'total' => $memberships->total(),
            ],
        ]);
    }

    public function store(StoreMembershipRequest $request): JsonResponse
    {
        $data = $request->validated();

        /** @var MembershipPlan $plan */
        $plan = MembershipPlan::query()->findOrFail($data['membership_plan_id']);
        abort_if(! $plan->active, 422, 'El plan no está activo.');

        $startsOn = CarbonImmutable::parse($data['starts_on']);
        $endsOn = isset($data['ends_on'])
            ? CarbonImmutable::parse($data['ends_on'])
            : $startsOn->addMonths($plan->valid_months);

        $price = $data['price_paid'] ?? (float) $plan->annual_price;
        $createCharge = (bool) ($data['create_charge'] ?? false);

        $tenantId = TenantContext::tenantId();
        $userId = $request->user()->id;

        $membership = DB::transaction(function () use (
            $request, $plan, $startsOn, $endsOn, $price, $createCharge,
            $tenantId, $userId, $data
        ): Membership {
            $charge = null;
            if ($createCharge) {
                // Requiere caja abierta.
                $session = CashSession::query()
                    ->where('status', 'open')
                    ->first();
                abort_if(! $session, 422,
                    'No hay una caja abierta. Abre la caja del día antes de generar el cobro de la membresía.');

                /** @var Charge $charge */
                $charge = Charge::query()->create([
                    'tenant_id' => $tenantId,
                    'patient_id' => $data['patient_id'],
                    'created_by_user_id' => $userId,
                    'notes' => 'Membresía anual: '.$plan->name,
                    'status' => 'pending',
                ]);

                $charge->items()->create([
                    'tenant_id' => $tenantId,
                    'treatment_id' => null,
                    'treatment_name' => 'Membresía — '.$plan->name,
                    'treatment_code' => null,
                    'specialist_id' => null,
                    'specialist_name' => null,
                    'quantity' => 1,
                    'unit_price' => $price,
                    'discount_id' => null,
                    'discount_amount' => 0,
                    'line_total' => $price,
                    'commission_percent' => null,
                    'commission_amount' => 0,
                ]);

                $charge->recomputeTotals();
                $charge->code = sprintf('CHG-%04d', $charge->id);
                $charge->save();
            }

            $membership = Membership::query()->create([
                'tenant_id' => $tenantId,
                'patient_id' => $data['patient_id'],
                'membership_plan_id' => $plan->id,
                'starts_on' => $startsOn->toDateString(),
                'ends_on' => $endsOn->toDateString(),
                'status' => Membership::STATUS_ACTIVE,
                'price_paid' => $price,
                'charge_id' => $charge?->id,
                'notes' => $data['notes'] ?? null,
            ]);

            return $membership;
        });

        $membership->load(['patient', 'plan.treatments']);

        return response()->json([
            'data' => MembershipResource::make($membership),
        ], 201);
    }

    public function show(Membership $membership): JsonResponse
    {
        $this->authorize('view', $membership);
        $membership->load(['patient', 'plan.treatments']);

        return response()->json(['data' => MembershipResource::make($membership)]);
    }

    public function cancel(Request $request, Membership $membership): JsonResponse
    {
        $this->authorize('update', $membership);

        abort_if($membership->status === Membership::STATUS_CANCELLED, 422,
            'La membresía ya está cancelada.');

        $membership->update(['status' => Membership::STATUS_CANCELLED]);
        $membership->load(['patient', 'plan.treatments']);

        return response()->json(['data' => MembershipResource::make($membership)]);
    }

    /**
     * Devuelve la membresía actualmente vigente del paciente (si existe),
     * con detalle de descuentos por tratamiento para que el frontend pueda
     * aplicar el ahorro al armar un cobro.
     *
     * También incluye `usage` (consumo y restante por tratamiento dentro del
     * periodo de la membresía) y `history` (los charge_items que aplicaron).
     */
    public function currentForPatient(Request $request, Patient $patient): JsonResponse
    {
        $this->authorize('viewAny', Membership::class);

        $today = now()->toDateString();
        /** @var Membership|null $membership */
        $membership = Membership::query()
            ->with(['plan.treatments'])
            ->where('patient_id', $patient->id)
            ->where('status', Membership::STATUS_ACTIVE)
            ->where('starts_on', '<=', $today)
            ->where('ends_on', '>=', $today)
            ->orderByDesc('ends_on')
            ->first();

        if (! $membership) {
            return response()->json(['data' => null]);
        }

        $payload = MembershipResource::make($membership)->resolve($request);
        $payload['usage'] = $this->computeUsage($membership);
        $payload['history'] = $this->computeHistory($membership);

        return response()->json(['data' => $payload]);
    }

    /**
     * Suma de unidades cobradas dentro del periodo de la membresía, por tratamiento
     * incluido en el plan. Excluye cobros cancelados.
     *
     * @return array<int, array<string, mixed>>
     */
    private function computeUsage(Membership $membership): array
    {
        $treatments = $membership->plan?->treatments ?? collect();
        if ($treatments->isEmpty()) {
            return [];
        }
        $treatmentIds = $treatments->pluck('id')->all();

        $consumed = ChargeItem::query()
            ->select('treatment_id', DB::raw('SUM(quantity) as consumed'))
            ->whereIn('treatment_id', $treatmentIds)
            ->whereHas('charge', function ($q) use ($membership): void {
                $q->where('patient_id', $membership->patient_id)
                  ->where('status', '!=', 'cancelled')
                  ->whereBetween('created_at', [
                      Carbon::parse($membership->starts_on)->startOfDay(),
                      Carbon::parse($membership->ends_on)->endOfDay(),
                  ]);
            })
            ->groupBy('treatment_id')
            ->pluck('consumed', 'treatment_id');

        return $treatments->map(function ($t) use ($consumed) {
            $used = (int) ($consumed[$t->id] ?? 0);
            $quota = $t->pivot->annual_quota !== null ? (int) $t->pivot->annual_quota : null;

            return [
                'treatment_id' => $t->id,
                'treatment_name' => $t->name,
                'consumed' => $used,
                'annual_quota' => $quota,
                'remaining' => $quota !== null ? max(0, $quota - $used) : null,
            ];
        })->all();
    }

    /**
     * Historial cronológico de los items que aplicaron a la membresía.
     *
     * @return array<int, array<string, mixed>>
     */
    private function computeHistory(Membership $membership): array
    {
        $treatmentIds = $membership->plan?->treatments?->pluck('id')->all() ?? [];
        if (empty($treatmentIds)) {
            return [];
        }

        return ChargeItem::query()
            ->with('charge')
            ->whereIn('treatment_id', $treatmentIds)
            ->whereHas('charge', function ($q) use ($membership): void {
                $q->where('patient_id', $membership->patient_id)
                  ->where('status', '!=', 'cancelled')
                  ->whereBetween('created_at', [
                      Carbon::parse($membership->starts_on)->startOfDay(),
                      Carbon::parse($membership->ends_on)->endOfDay(),
                  ]);
            })
            ->orderByDesc('id')
            ->get()
            ->map(fn (ChargeItem $i) => [
                'id' => $i->id,
                'treatment_id' => $i->treatment_id,
                'treatment_name' => $i->treatment_name,
                'quantity' => (int) $i->quantity,
                'unit_price' => (float) $i->unit_price,
                'line_total' => (float) $i->line_total,
                'charge_id' => $i->charge_id,
                'charge_code' => $i->charge?->code,
                'date' => $i->charge?->created_at?->toIso8601String(),
            ])
            ->all();
    }
}
