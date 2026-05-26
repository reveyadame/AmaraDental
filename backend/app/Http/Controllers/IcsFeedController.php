<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Tenant;
use App\Models\User;
use App\Support\IcsFeedBuilder;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Str;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

/**
 * Feed ICS público (sin autenticación de cookie) — el token en la URL
 * funciona como secreto. Google Calendar / Apple Calendar polls esta URL
 * cada N horas para refrescar las citas.
 *
 * Endpoints autenticados (auth:sanctum) permiten al usuario generar y
 * regenerar su token.
 */
class IcsFeedController extends Controller implements HasMiddleware
{
    /** @return array<int, Middleware|string> */
    public static function middleware(): array
    {
        return [
            new Middleware('auth:sanctum', except: ['feed']),
        ];
    }

    /**
     * Endpoint público — devuelve el .ics del especialista. Sin sesión.
     * Bypassa el global scope de tenant porque resolvemos el tenant del
     * propio user del token.
     */
    public function feed(string $token): Response
    {
        $user = User::query()
            ->withoutGlobalScopes()
            ->where('ics_feed_token', $token)
            ->where('active', true)
            ->first();

        if (! $user) {
            return response('Calendar feed not found', 404)
                ->header('Content-Type', 'text/plain');
        }

        $tenant = Tenant::query()->find($user->tenant_id);
        if (! $tenant) {
            return response('Tenant not found', 404)
                ->header('Content-Type', 'text/plain');
        }

        // Ventana: 60 días atrás y 180 días adelante. Suficiente para que
        // Google muestre histórico reciente y todo lo futuro razonable.
        $from = now()->subDays(60);
        $to = now()->addDays(180);

        // Feed personal del usuario. Como ya no hay "agenda del dentista",
        // exponemos todas las citas del tenant en la ventana — el usuario
        // filtra en su calendario.
        $appointments = Appointment::query()
            ->withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->whereBetween('starts_at', [$from, $to])
            ->whereNotIn('status', ['cancelled'])
            ->with(['patient', 'treatment', 'specialist'])
            ->orderBy('starts_at')
            ->get();

        $body = IcsFeedBuilder::build($user, $tenant, $appointments);

        return response($body, 200, [
            'Content-Type' => 'text/calendar; charset=utf-8',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Content-Disposition' => 'inline; filename="ciodent-agenda.ics"',
        ]);
    }

    /**
     * Genera o regenera el token del usuario actual. Solo dentistas (que son
     * los que tienen agenda propia para sincronizar).
     */
    public function regenerate(Request $request): \Illuminate\Http\JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $token = Str::random(48);
        $user->ics_feed_token = $token;
        $user->ics_feed_token_at = now();
        $user->save();

        return response()->json([
            'data' => [
                'token' => $token,
                'url' => url("/api/agenda/feed/{$token}.ics"),
                'generated_at' => $user->ics_feed_token_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * Devuelve el token actual (o null si nunca se generó). El frontend
     * usa esto para mostrar la URL en la página de perfil del especialista.
     */
    public function show(Request $request): \Illuminate\Http\JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json([
            'data' => $user->ics_feed_token
                ? [
                    'token' => $user->ics_feed_token,
                    'url' => url("/api/agenda/feed/{$user->ics_feed_token}.ics"),
                    'generated_at' => $user->ics_feed_token_at?->toIso8601String(),
                ]
                : null,
        ]);
    }
}
