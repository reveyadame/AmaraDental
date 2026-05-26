<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Recalls\UpdateRecallRequest;
use App\Http\Resources\RecallResource;
use App\Models\Recall;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class RecallsController extends Controller implements HasMiddleware
{
    use AuthorizesRequests;

    /** @return array<int, Middleware|string> */
    public static function middleware(): array
    {
        return ['auth:sanctum'];
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Recall::class);

        $today = now()->toDateString();
        $window = $request->string('window'); // overdue | this_week | next_30 | upcoming

        $orders = Recall::query()
            ->with(['patient', 'treatment', 'scheduledAppointment'])
            ->when($request->filled('status'),
                fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('patient_id'),
                fn ($q) => $q->where('patient_id', $request->integer('patient_id')))
            ->when($window->isNotEmpty(), function ($q) use ($window, $today): void {
                match ($window->toString()) {
                    'overdue' => $q->whereDate('due_on', '<', $today)
                        ->where('status', Recall::STATUS_PENDING),
                    'this_week' => $q->whereBetween('due_on',
                        [$today, now()->endOfWeek()->toDateString()])
                        ->where('status', Recall::STATUS_PENDING),
                    'next_30' => $q->whereBetween('due_on',
                        [$today, now()->addDays(30)->toDateString()])
                        ->where('status', Recall::STATUS_PENDING),
                    'upcoming' => $q->whereDate('due_on', '>=', $today)
                        ->where('status', Recall::STATUS_PENDING),
                    default => null,
                };
            })
            ->orderByRaw('
                CASE status
                    WHEN ? THEN 0
                    WHEN ? THEN 1
                    WHEN ? THEN 2
                    ELSE 3
                END
            ', [Recall::STATUS_PENDING, Recall::STATUS_SCHEDULED, Recall::STATUS_COMPLETED])
            ->orderBy('due_on')
            ->paginate($request->integer('per_page', 50));

        return response()->json([
            'data' => RecallResource::collection($orders->items()),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    public function show(Recall $recall): JsonResponse
    {
        $this->authorize('view', $recall);
        $recall->load(['patient', 'treatment', 'scheduledAppointment']);

        return response()->json(['data' => RecallResource::make($recall)]);
    }

    /**
     * Actualiza el recall (mover fecha, descartar, vincular a cita agendada,
     * marcar completada).
     */
    public function update(UpdateRecallRequest $request, Recall $recall): JsonResponse
    {
        $data = $request->validated();
        // Si se vincula una cita y no se especificó status, lo subimos a scheduled.
        if (
            array_key_exists('scheduled_appointment_id', $data) &&
            $data['scheduled_appointment_id'] !== null &&
            ! array_key_exists('status', $data)
        ) {
            $data['status'] = Recall::STATUS_SCHEDULED;
        }
        $recall->update($data);
        $recall->load(['patient', 'treatment', 'scheduledAppointment']);

        return response()->json(['data' => RecallResource::make($recall)]);
    }

    public function destroy(Recall $recall): JsonResponse
    {
        $this->authorize('delete', $recall);
        $recall->delete();

        return response()->json(['message' => 'OK']);
    }
}
