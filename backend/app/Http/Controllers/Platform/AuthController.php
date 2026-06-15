<?php

declare(strict_types=1);

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Models\PlatformAdmin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Auth del panel de plataforma (super-admin), por token Sanctum (Bearer).
 * Aislado del login de clínica (cookie) y del de pacientes.
 */
class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $admin = PlatformAdmin::query()
            ->where('email', strtolower(trim($data['email'])))
            ->first();

        if ($admin === null || ! $admin->active || ! Hash::check($data['password'], $admin->password)) {
            throw ValidationException::withMessages([
                'email' => 'Credenciales inválidas.',
            ]);
        }

        $admin->update(['last_login_at' => now()]);
        $token = $admin->createToken('platform-panel', ['platform'])->plainTextToken;

        return response()->json([
            'token' => $token,
            'data' => $this->profile($admin),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        /** @var PlatformAdmin $admin */
        $admin = $request->user();

        return response()->json(['data' => $this->profile($admin)]);
    }

    public function logout(Request $request): JsonResponse
    {
        /** @var PlatformAdmin $admin */
        $admin = $request->user();
        $admin->currentAccessToken()?->delete();

        return response()->json(['message' => 'OK']);
    }

    /** @return array<string, mixed> */
    private function profile(PlatformAdmin $admin): array
    {
        return [
            'id' => $admin->id,
            'name' => $admin->name,
            'email' => $admin->email,
        ];
    }
}
