<?php

declare(strict_types=1);

namespace App\Http\Controllers\Patient;

use App\Http\Controllers\Controller;
use App\Models\PatientAccount;
use App\Support\PatientOtp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Auth del portal de pacientes (app móvil), passwordless por email.
 * El tenant se resuelve por el header `X-Tenant` (ResolveTenant).
 */
class AuthController extends Controller
{
    /**
     * Solicita un código de acceso. Anti-enumeración: SIEMPRE responde 200,
     * exista o no la cuenta. Solo se envía código si la cuenta existe (es
     * decir, si el staff invitó al paciente).
     */
    public function requestCode(Request $request): JsonResponse
    {
        $data = $request->validate([
            'identifier' => ['required', 'string', 'email', 'max:255'],
        ]);

        $account = $this->findAccount($data['identifier']);
        if ($account !== null) {
            PatientOtp::issue($account);
        }

        return response()->json([
            'message' => 'Si la cuenta existe, te enviamos un código a tu correo.',
        ]);
    }

    /**
     * Verifica el código y devuelve un token Sanctum (ability: patient).
     * El primer login exitoso activa la cuenta.
     */
    public function verify(Request $request): JsonResponse
    {
        $data = $request->validate([
            'identifier' => ['required', 'string', 'email', 'max:255'],
            'code' => ['required', 'string', 'max:12'],
        ]);

        $account = $this->findAccount($data['identifier']);

        if ($account === null || ! PatientOtp::verify($account, $data['code'])) {
            throw ValidationException::withMessages([
                'code' => 'Código inválido o expirado.',
            ]);
        }

        $account->update([
            'status' => PatientAccount::STATUS_ACTIVE,
            'last_login_at' => now(),
        ]);

        $token = $account->createToken('patient-app', ['patient'])->plainTextToken;

        return response()->json([
            'token' => $token,
            'data' => $this->profile($account),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        /** @var PatientAccount $account */
        $account = $request->user();
        $account->currentAccessToken()?->delete();

        return response()->json(['message' => 'OK']);
    }

    public function me(Request $request): JsonResponse
    {
        /** @var PatientAccount $account */
        $account = $request->user();

        return response()->json(['data' => $this->profile($account)]);
    }

    /** Cuenta activable (pending/active) por identificador, dentro del tenant. */
    private function findAccount(string $identifier): ?PatientAccount
    {
        return PatientAccount::query()
            ->where('identifier', strtolower(trim($identifier)))
            ->whereIn('status', [PatientAccount::STATUS_PENDING, PatientAccount::STATUS_ACTIVE])
            ->first();
    }

    /** @return array<string, mixed> */
    private function profile(PatientAccount $account): array
    {
        $patient = $account->patient;

        return [
            'patient_id' => $patient->id,
            'first_name' => $patient->first_name,
            'last_name' => $patient->last_name,
            'full_name' => $patient->full_name,
            'email' => $patient->email,
            'phone' => $patient->mobile_phone ?: $patient->phone,
        ];
    }
}
