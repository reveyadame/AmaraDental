<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Labs\StoreLabOrderRequest;
use App\Http\Requests\Labs\UpdateLabOrderRequest;
use App\Http\Resources\LabOrderResource;
use App\Models\Lab;
use App\Models\LabOrder;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Validation\Rule;

class LabOrdersController extends Controller implements HasMiddleware
{
    use AuthorizesRequests;

    /** @return array<int, Middleware|string> */
    public static function middleware(): array
    {
        return ['auth:sanctum'];
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', LabOrder::class);

        $orders = LabOrder::query()
            ->with(['patient', 'treatment', 'dentist'])
            ->when($request->filled('status'),
                fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('patient_id'),
                fn ($q) => $q->where('patient_id', $request->integer('patient_id')))
            ->when($request->filled('dentist_user_id'),
                fn ($q) => $q->where('dentist_user_id', $request->integer('dentist_user_id')))
            ->when($request->filled('q'), function ($q) use ($request): void {
                $term = '%'.$request->string('q').'%';
                $q->where(function ($q) use ($term): void {
                    $q->where('lab_name', 'like', $term)
                      ->orWhere('work_type', 'like', $term);
                });
            })
            ->when($request->boolean('overdue'), function ($q): void {
                // Órdenes con fecha esperada pasada y que no se hayan recibido.
                $q->whereDate('due_on', '<', now()->toDateString())
                  ->whereIn('status', [LabOrder::STATUS_PENDING, LabOrder::STATUS_IN_PROGRESS]);
            })
            ->orderByRaw('
                CASE WHEN status IN (?, ?) THEN 0 ELSE 1 END,
                COALESCE(due_on, "9999-12-31") ASC,
                created_at DESC
            ', [LabOrder::STATUS_PENDING, LabOrder::STATUS_IN_PROGRESS])
            ->paginate($request->integer('per_page', 25));

        return response()->json([
            'data' => LabOrderResource::collection($orders->items()),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    public function store(StoreLabOrderRequest $request): JsonResponse
    {
        $data = $this->fillLabName($request->validated());
        $order = LabOrder::query()->create($data);
        $order->load(['patient', 'treatment', 'dentist', 'lab']);

        return response()->json(['data' => LabOrderResource::make($order)], 201);
    }

    public function show(LabOrder $order): JsonResponse
    {
        $this->authorize('view', $order);
        $order->load(['patient', 'treatment', 'dentist', 'lab']);

        return response()->json(['data' => LabOrderResource::make($order)]);
    }

    public function update(UpdateLabOrderRequest $request, LabOrder $order): JsonResponse
    {
        $data = $this->fillLabName($request->validated());
        $order->update($data);
        $order->load(['patient', 'treatment', 'dentist', 'lab']);

        return response()->json(['data' => LabOrderResource::make($order)]);
    }

    /**
     * Cuando se manda `lab_id`, copiamos el nombre del lab al snapshot
     * `lab_name` para que la orden conserve la referencia aunque el lab
     * se renombre o elimine después.
     */
    private function fillLabName(array $data): array
    {
        if (! empty($data['lab_id'])) {
            $lab = Lab::query()->find($data['lab_id']);
            if ($lab) {
                $data['lab_name'] = $lab->name;
            }
        }
        return $data;
    }

    /**
     * Cambio rápido de estado (con auto-fill de fechas según corresponda).
     */
    public function changeStatus(Request $request, LabOrder $order): JsonResponse
    {
        $this->authorize('update', $order);

        $data = $request->validate([
            'status' => ['required', Rule::in(LabOrder::statuses())],
        ]);

        $patch = ['status' => $data['status']];
        $today = now()->toDateString();

        match ($data['status']) {
            LabOrder::STATUS_IN_PROGRESS => $patch['sent_on'] = $order->sent_on?->toDateString() ?? $today,
            LabOrder::STATUS_RECEIVED => $patch['received_on'] = $order->received_on?->toDateString() ?? $today,
            LabOrder::STATUS_DELIVERED => $patch['delivered_to_patient_on'] = $order->delivered_to_patient_on?->toDateString() ?? $today,
            default => null,
        };

        $order->update($patch);
        $order->load(['patient', 'treatment', 'dentist']);

        return response()->json(['data' => LabOrderResource::make($order)]);
    }

    public function destroy(LabOrder $order): JsonResponse
    {
        $this->authorize('delete', $order);

        $order->delete();

        return response()->json(['message' => 'OK']);
    }
}
