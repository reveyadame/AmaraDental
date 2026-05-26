<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Agenda\StoreAgendaBlockRequest;
use App\Http\Requests\Agenda\UpdateAgendaBlockRequest;
use App\Http\Resources\AgendaBlockResource;
use App\Models\AgendaBlock;
use App\Support\TenantContext;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class AgendaBlocksController extends Controller implements HasMiddleware
{
    use AuthorizesRequests;

    /** @return array<int, Middleware|string> */
    public static function middleware(): array
    {
        return ['auth:sanctum'];
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', AgendaBlock::class);

        $blocks = AgendaBlock::query()
            ->with('specialist')
            ->when($request->filled('date_from'),
                fn ($q) => $q->where('ends_at', '>=', $request->date('date_from')))
            ->when($request->filled('date_to'),
                fn ($q) => $q->where('starts_at', '<=', $request->date('date_to')))
            ->when($request->filled('specialist_id'), function ($q) use ($request): void {
                // Cuando filtras por especialista, mostramos sus bloqueos +
                // los globales (specialist_id = null).
                $id = $request->integer('specialist_id');
                $q->where(function ($q) use ($id): void {
                    $q->where('specialist_id', $id)
                      ->orWhereNull('specialist_id');
                });
            })
            ->orderBy('starts_at')
            ->get();

        return AgendaBlockResource::collection($blocks);
    }

    public function store(StoreAgendaBlockRequest $request): JsonResponse
    {
        $block = AgendaBlock::query()->create([
            ...$request->validated(),
            'tenant_id' => TenantContext::tenantId(),
            'created_by_user_id' => $request->user()->id,
        ]);
        $block->load('specialist');

        return response()->json(['data' => AgendaBlockResource::make($block)], 201);
    }

    public function show(AgendaBlock $block): JsonResponse
    {
        $this->authorize('view', $block);
        $block->load('specialist');

        return response()->json(['data' => AgendaBlockResource::make($block)]);
    }

    public function update(UpdateAgendaBlockRequest $request, AgendaBlock $block): JsonResponse
    {
        $block->update($request->validated());
        $block->load('specialist');

        return response()->json(['data' => AgendaBlockResource::make($block)]);
    }

    public function destroy(AgendaBlock $block): JsonResponse
    {
        $this->authorize('delete', $block);
        $block->delete();

        return response()->json(['message' => 'OK']);
    }
}
