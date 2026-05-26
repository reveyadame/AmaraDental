<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Treatments\StoreTreatmentRequest;
use App\Http\Requests\Treatments\UpdateTreatmentRequest;
use App\Http\Resources\TreatmentResource;
use App\Models\Treatment;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class TreatmentsController extends Controller implements HasMiddleware
{
    use AuthorizesRequests;

    /** @return array<int, Middleware|string> */
    public static function middleware(): array
    {
        return ['auth:sanctum'];
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Treatment::class);

        $treatments = Treatment::query()
            ->when($request->string('q')->isNotEmpty(), function ($q) use ($request): void {
                $term = '%'.$request->string('q').'%';
                $q->where(function ($q) use ($term): void {
                    $q->where('name', 'like', $term)
                      ->orWhere('code', 'like', $term)
                      ->orWhere('category', 'like', $term);
                });
            })
            ->when($request->filled('category'), fn ($q) => $q->where('category', $request->string('category')))
            ->when($request->boolean('only_active', false), fn ($q) => $q->where('active', true))
            ->orderBy('name')
            ->get();

        return TreatmentResource::collection($treatments);
    }

    public function store(StoreTreatmentRequest $request): JsonResponse
    {
        $treatment = Treatment::query()->create($request->validated());

        return response()->json(['data' => TreatmentResource::make($treatment)], 201);
    }

    public function show(Treatment $treatment): JsonResponse
    {
        $this->authorize('view', $treatment);

        return response()->json(['data' => TreatmentResource::make($treatment)]);
    }

    public function update(UpdateTreatmentRequest $request, Treatment $treatment): JsonResponse
    {
        $treatment->update($request->validated());

        return response()->json(['data' => TreatmentResource::make($treatment)]);
    }

    public function destroy(Treatment $treatment): JsonResponse
    {
        $this->authorize('delete', $treatment);

        $treatment->delete();

        return response()->json(['message' => 'OK']);
    }
}
