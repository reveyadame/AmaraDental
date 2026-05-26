<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Memberships\StoreMembershipPlanRequest;
use App\Http\Requests\Memberships\UpdateMembershipPlanRequest;
use App\Http\Resources\MembershipPlanResource;
use App\Models\MembershipPlan;
use App\Support\TenantContext;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\DB;

class MembershipPlansController extends Controller implements HasMiddleware
{
    use AuthorizesRequests;

    /** @return array<int, Middleware|string> */
    public static function middleware(): array
    {
        return ['auth:sanctum'];
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', MembershipPlan::class);

        $plans = MembershipPlan::query()
            ->with('treatments')
            ->when($request->boolean('only_active', false), fn ($q) => $q->where('active', true))
            ->orderBy('name')
            ->get();

        return MembershipPlanResource::collection($plans);
    }

    public function store(StoreMembershipPlanRequest $request): JsonResponse
    {
        $data = $request->validated();
        $treatments = collect($data['treatments'] ?? []);
        unset($data['treatments']);

        $plan = DB::transaction(function () use ($data, $treatments) {
            $plan = MembershipPlan::query()->create($data);
            $this->syncTreatments($plan, $treatments);

            return $plan;
        });

        return response()->json([
            'data' => MembershipPlanResource::make($plan->load('treatments')),
        ], 201);
    }

    public function show(MembershipPlan $plan): JsonResponse
    {
        $this->authorize('view', $plan);

        return response()->json([
            'data' => MembershipPlanResource::make($plan->load('treatments')),
        ]);
    }

    public function update(UpdateMembershipPlanRequest $request, MembershipPlan $plan): JsonResponse
    {
        $data = $request->validated();
        $treatments = array_key_exists('treatments', $data) ? collect($data['treatments']) : null;
        unset($data['treatments']);

        DB::transaction(function () use ($plan, $data, $treatments): void {
            $plan->update($data);
            if ($treatments !== null) {
                $this->syncTreatments($plan, $treatments);
            }
        });

        return response()->json([
            'data' => MembershipPlanResource::make($plan->load('treatments')),
        ]);
    }

    public function destroy(MembershipPlan $plan): JsonResponse
    {
        $this->authorize('delete', $plan);

        $plan->delete();

        return response()->json(['message' => 'OK']);
    }

    /** @param  \Illuminate\Support\Collection<int, array<string, mixed>>  $treatments */
    private function syncTreatments(MembershipPlan $plan, $treatments): void
    {
        $sync = [];
        foreach ($treatments as $row) {
            $sync[(int) $row['treatment_id']] = [
                'tenant_id' => TenantContext::tenantId(),
                'discount_percent' => $row['discount_percent'] ?? null,
                'annual_quota' => $row['annual_quota'] ?? null,
            ];
        }
        $plan->treatments()->sync($sync);
    }
}
