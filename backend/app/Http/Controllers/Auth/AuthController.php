<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->only('email', 'password');
        $credentials['tenant_id'] = TenantContext::tenantId();
        $credentials['active'] = true;

        if (! Auth::attempt($credentials, (bool) $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'email' => __('Credenciales inválidas.'),
            ]);
        }

        $request->session()->regenerate();

        // Registra el último acceso (alimenta "actividad" de la clínica en el
        // panel de plataforma). updateQuietly: no dispara auditoría por un login.
        $request->user()->forceFill(['last_login_at' => now()])->saveQuietly();

        return response()->json([
            'data' => UserResource::make($request->user()),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'OK']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'data' => UserResource::make($request->user()),
        ]);
    }
}
