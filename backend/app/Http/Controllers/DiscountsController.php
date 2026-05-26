<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Discounts\StoreDiscountRequest;
use App\Http\Requests\Discounts\UpdateDiscountRequest;
use App\Http\Resources\DiscountResource;
use App\Models\Discount;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class DiscountsController extends Controller implements HasMiddleware
{
    use AuthorizesRequests;

    /** @return array<int, Middleware|string> */
    public static function middleware(): array
    {
        return ['auth:sanctum'];
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Discount::class);

        $discounts = Discount::query()
            ->with('treatment')
            ->when($request->boolean('only_active', false), fn ($q) => $q->where('active', true))
            ->orderByDesc('created_at')
            ->get();

        return DiscountResource::collection($discounts);
    }

    public function store(StoreDiscountRequest $request): JsonResponse
    {
        $discount = Discount::query()->create($request->validated());

        return response()->json(['data' => DiscountResource::make($discount->load('treatment'))], 201);
    }

    public function update(UpdateDiscountRequest $request, Discount $discount): JsonResponse
    {
        $discount->update($request->validated());

        return response()->json(['data' => DiscountResource::make($discount->load('treatment'))]);
    }

    public function destroy(Discount $discount): JsonResponse
    {
        $this->authorize('delete', $discount);

        $discount->delete();

        return response()->json(['message' => 'OK']);
    }
}
