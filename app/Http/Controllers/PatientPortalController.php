<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Models\PatientAccount;
use App\Support\PatientOtp;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;

/**
 * Gestión del acceso del paciente al portal/app, desde el lado del staff.
 * Invitar = crear (si no existe) la cuenta y enviarle un código por email.
 */
class PatientPortalController extends Controller
{
    public function show(Patient $patient): JsonResponse
    {
        $this->authorize('viewBasic', $patient);

        return response()->json(['data' => $this->status($patient, $patient->account)]);
    }

    public function invite(Patient $patient): JsonResponse
    {
        $this->authorize('update', $patient);

        abort_if(
            blank($patient->email),
            422,
            'El paciente no tiene email registrado. Agrégalo antes de invitarlo.',
        );

        $account = PatientAccount::query()->firstOrCreate(
            ['tenant_id' => TenantContext::tenantId(), 'patient_id' => $patient->id],
            [
                'identifier' => $patient->email,
                'channel' => 'email',
                'status' => PatientAccount::STATUS_PENDING,
            ],
        );

        abort_if($account->isBlocked(), 422, 'El acceso de este paciente está bloqueado.');

        // Si el email del expediente cambió, sincronízalo en la cuenta.
        if ($account->identifier !== $patient->email) {
            $account->update(['identifier' => $patient->email]);
        }

        PatientOtp::issue($account);

        return response()->json(['data' => $this->status($patient, $account->refresh())]);
    }

    public function revoke(Patient $patient): JsonResponse
    {
        // Revocar acceso es destructivo → solo admin (convención del proyecto).
        $this->requireAdmin();

        $account = $patient->account;
        if ($account !== null) {
            $account->tokens()->delete();
            $account->delete();
        }

        return response()->json(['message' => 'OK']);
    }

    /** @return array<string, mixed> */
    private function status(Patient $patient, ?PatientAccount $account): array
    {
        return [
            'patient_id' => $patient->id,
            'has_access' => $account !== null,
            'status' => $account?->status,
            'identifier' => $account?->identifier,
            'last_login_at' => $account?->last_login_at?->toIso8601String(),
        ];
    }
}
