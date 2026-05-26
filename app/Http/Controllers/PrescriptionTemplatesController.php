<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Prescriptions\StorePrescriptionTemplateRequest;
use App\Http\Requests\Prescriptions\UpdatePrescriptionTemplateRequest;
use App\Http\Resources\PrescriptionTemplateResource;
use App\Models\PrescriptionTemplate;
use App\Support\TenantContext;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\DB;

class PrescriptionTemplatesController extends Controller implements HasMiddleware
{
    use AuthorizesRequests;

    /** @return array<int, Middleware|string> */
    public static function middleware(): array
    {
        return ['auth:sanctum'];
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', PrescriptionTemplate::class);

        $templates = PrescriptionTemplate::query()
            ->with(['items', 'createdBy'])
            ->when($request->boolean('only_active', false), fn ($q) => $q->where('active', true))
            ->when($request->string('q')->isNotEmpty(), function ($q) use ($request): void {
                $term = '%'.$request->string('q').'%';
                $q->where(function ($q) use ($term): void {
                    $q->where('name', 'like', $term)
                      ->orWhere('category', 'like', $term);
                });
            })
            ->orderBy('name')
            ->get();

        return PrescriptionTemplateResource::collection($templates);
    }

    public function show(PrescriptionTemplate $template): JsonResponse
    {
        $this->authorize('view', $template);

        $template->load(['items', 'createdBy']);

        return response()->json(['data' => PrescriptionTemplateResource::make($template)]);
    }

    public function store(StorePrescriptionTemplateRequest $request): JsonResponse
    {
        $template = DB::transaction(function () use ($request): PrescriptionTemplate {
            /** @var PrescriptionTemplate $tpl */
            $tpl = PrescriptionTemplate::query()->create([
                'tenant_id' => TenantContext::tenantId(),
                'created_by_user_id' => $request->user()->id,
                'name' => $request->string('name'),
                'category' => $request->input('category'),
                'description' => $request->input('description'),
                'active' => $request->boolean('active', true),
            ]);

            foreach ($request->validated('items') as $idx => $item) {
                $tpl->items()->create([
                    'tenant_id' => $tpl->tenant_id,
                    'medication' => $item['medication'],
                    'presentation' => $item['presentation'] ?? null,
                    'dosage' => $item['dosage'],
                    'route' => $item['route'] ?? null,
                    'frequency' => $item['frequency'],
                    'duration' => $item['duration'],
                    'instructions' => $item['instructions'] ?? null,
                    'order_index' => $idx,
                ]);
            }

            return $tpl;
        });

        $template->load(['items', 'createdBy']);

        return response()->json(
            ['data' => PrescriptionTemplateResource::make($template)],
            201,
        );
    }

    public function update(
        UpdatePrescriptionTemplateRequest $request,
        PrescriptionTemplate $template,
    ): JsonResponse {
        DB::transaction(function () use ($request, $template): void {
            $template->fill($request->safe()->except('items'))->save();

            if ($request->has('items')) {
                $template->items()->delete();
                foreach ($request->validated('items') as $idx => $item) {
                    $template->items()->create([
                        'tenant_id' => $template->tenant_id,
                        'medication' => $item['medication'],
                        'presentation' => $item['presentation'] ?? null,
                        'dosage' => $item['dosage'],
                        'route' => $item['route'] ?? null,
                        'frequency' => $item['frequency'],
                        'duration' => $item['duration'],
                        'instructions' => $item['instructions'] ?? null,
                        'order_index' => $idx,
                    ]);
                }
            }
        });

        $template->load(['items', 'createdBy']);

        return response()->json(['data' => PrescriptionTemplateResource::make($template)]);
    }

    public function destroy(PrescriptionTemplate $template): JsonResponse
    {
        $this->authorize('delete', $template);

        $template->delete();

        return response()->json(['message' => 'OK']);
    }
}
