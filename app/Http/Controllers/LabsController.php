<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Labs\StoreLabRequest;
use App\Http\Requests\Labs\UpdateLabRequest;
use App\Http\Resources\LabResource;
use App\Models\Lab;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class LabsController extends Controller implements HasMiddleware
{
    use AuthorizesRequests;

    /** @return array<int, Middleware|string> */
    public static function middleware(): array
    {
        return ['auth:sanctum'];
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Lab::class);

        $labs = Lab::query()
            ->withCount('orders')
            ->when($request->boolean('only_active', false),
                fn ($q) => $q->where('active', true))
            ->when($request->string('q')->isNotEmpty(), function ($q) use ($request): void {
                $term = '%'.$request->string('q').'%';
                $q->where(function ($q) use ($term): void {
                    $q->where('name', 'like', $term)
                      ->orWhere('contact_name', 'like', $term)
                      ->orWhere('phone', 'like', $term);
                });
            })
            ->orderBy('name')
            ->get();

        return LabResource::collection($labs);
    }

    public function store(StoreLabRequest $request): JsonResponse
    {
        $lab = Lab::query()->create($request->validated());

        return response()->json(['data' => LabResource::make($lab)], 201);
    }

    public function show(Lab $lab): JsonResponse
    {
        $this->authorize('view', $lab);
        $lab->loadCount('orders');

        return response()->json(['data' => LabResource::make($lab)]);
    }

    public function update(UpdateLabRequest $request, Lab $lab): JsonResponse
    {
        $lab->update($request->validated());

        return response()->json(['data' => LabResource::make($lab)]);
    }

    public function destroy(Lab $lab): JsonResponse
    {
        $this->authorize('delete', $lab);
        $lab->delete();

        return response()->json(['message' => 'OK']);
    }
}
