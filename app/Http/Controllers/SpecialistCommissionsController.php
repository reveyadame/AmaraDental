<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Specialist;
use App\Models\Treatment;
use App\Models\TreatmentSpecialistCommission;
use App\Support\Permissions;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\DB;

class SpecialistCommissionsController extends Controller implements HasMiddleware
{
    /** @return array<int, Middleware|string> */
    public static function middleware(): array
    {
        return ['auth:sanctum'];
    }

    public function index(Request $request, Specialist $specialist): JsonResponse
    {
        abort_unless($request->user()?->can(Permissions::CATALOGS_MANAGE), 403);

        $treatments = Treatment::query()
            ->where('active', true)
            ->orderBy('category')
            ->orderBy('name')
            ->get();

        $overrides = TreatmentSpecialistCommission::query()
            ->where('specialist_id', $specialist->id)
            ->get()
            ->keyBy('treatment_id');

        $specialistDefault = $specialist->default_commission_percent !== null
            ? (float) $specialist->default_commission_percent : null;

        $rows = $treatments->map(function (Treatment $t) use ($overrides, $specialistDefault): array {
            $override = $overrides->get($t->id);
            $treatmentDefault = $t->commission_percent !== null
                ? (float) $t->commission_percent : null;
            $overrideValue = $override
                ? (float) $override->commission_percent : null;

            $effective = TreatmentSpecialistCommission::resolveEffective(
                $overrideValue,
                $treatmentDefault,
                $specialistDefault,
            );

            $source = $overrideValue !== null
                ? 'override'
                : ($treatmentDefault !== null
                    ? 'treatment'
                    : ($specialistDefault !== null ? 'specialist' : null));

            return [
                'treatment_id' => $t->id,
                'treatment_code' => $t->code,
                'treatment_name' => $t->name,
                'treatment_category' => $t->category,
                'treatment_default_percent' => $treatmentDefault,
                'specialist_default_percent' => $specialistDefault,
                'override_percent' => $overrideValue,
                'effective_percent' => $effective,
                'source' => $source,
            ];
        });

        return response()->json([
            'data' => $rows,
            'meta' => [
                'specialist_id' => $specialist->id,
                'specialist_default_percent' => $specialistDefault,
            ],
        ]);
    }

    public function sync(Request $request, Specialist $specialist): JsonResponse
    {
        abort_unless($request->user()?->can(Permissions::CATALOGS_MANAGE), 403);

        $payload = $request->validate([
            'overrides' => ['required', 'array'],
            'overrides.*.treatment_id' => ['required', 'integer', 'exists:treatments,id'],
            'overrides.*.commission_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        DB::transaction(function () use ($payload, $specialist): void {
            foreach ($payload['overrides'] as $row) {
                $treatmentId = (int) $row['treatment_id'];
                $value = $row['commission_percent'] ?? null;

                if ($value === null) {
                    TreatmentSpecialistCommission::query()
                        ->where('specialist_id', $specialist->id)
                        ->where('treatment_id', $treatmentId)
                        ->delete();
                    continue;
                }

                TreatmentSpecialistCommission::query()->updateOrCreate(
                    [
                        'tenant_id' => TenantContext::tenantId(),
                        'specialist_id' => $specialist->id,
                        'treatment_id' => $treatmentId,
                    ],
                    ['commission_percent' => $value],
                );
            }
        });

        return $this->index($request, $specialist);
    }
}
