<?php

declare(strict_types=1);

namespace App\Http\Controllers\Patient;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\PatientAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Citas del paciente autenticado (solo lectura). El Global Scope ya filtra por
 * tenant; aquí además se acota al patient_id de la cuenta.
 */
class AppointmentsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var PatientAccount $account */
        $account = $request->user();

        $appointments = Appointment::query()
            ->where('patient_id', $account->patient_id)
            ->with('specialist')
            ->orderByDesc('starts_at')
            ->limit(100)
            ->get()
            ->map(fn (Appointment $a) => [
                'id' => $a->id,
                'title' => $a->title,
                'starts_at' => $a->starts_at?->toIso8601String(),
                'ends_at' => $a->ends_at?->toIso8601String(),
                'status' => $a->status,
                'specialist_name' => $a->specialist?->name,
            ]);

        return response()->json(['data' => $appointments]);
    }
}
