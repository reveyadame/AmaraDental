<?php

declare(strict_types=1);

namespace App\Http\Controllers\Patient;

use App\Http\Controllers\Controller;
use App\Models\PatientAccount;
use App\Models\Recall;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Recordatorios preventivos (recalls) del paciente autenticado, solo lectura.
 * Solo los pendientes/vigentes — no el histórico ya atendido.
 */
class RecallsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var PatientAccount $account */
        $account = $request->user();
        $today = now()->toDateString();

        $recalls = Recall::query()
            ->where('patient_id', $account->patient_id)
            // Activos: pendientes de agendar o ya agendados (no completados/descartados).
            ->whereIn('status', [Recall::STATUS_PENDING, Recall::STATUS_SCHEDULED])
            ->with('treatment')
            ->orderBy('due_on')
            ->get()
            ->map(fn (Recall $r) => [
                'id' => $r->id,
                'due_on' => $r->due_on?->toDateString(),
                'is_overdue' => $r->due_on !== null && $r->due_on->toDateString() < $today,
                'label' => $r->treatment?->recall_label ?: $r->treatment?->name,
                'notes' => $r->notes,
            ]);

        return response()->json(['data' => $recalls]);
    }
}
