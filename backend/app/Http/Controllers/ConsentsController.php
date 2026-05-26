<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Http\Requests\Patients\StoreConsentRequest;
use App\Http\Resources\ConsentResource;
use App\Models\Consent;
use App\Models\Patient;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class ConsentsController extends Controller implements HasMiddleware
{
    use AuthorizesRequests;

    /** @return array<int, Middleware|string> */
    public static function middleware(): array
    {
        return ['auth:sanctum'];
    }

    public function index(Patient $patient): AnonymousResourceCollection
    {
        $this->authorize('viewClinical', $patient);

        $consents = $patient->consents()->orderByDesc('signed_at')->get();

        return ConsentResource::collection($consents);
    }

    public function store(StoreConsentRequest $request, Patient $patient): JsonResponse
    {
        $this->authorize('updateClinical', $patient);

        $consent = $patient->consents()->create([
            'tenant_id' => $patient->tenant_id,
            'consent_template_id' => $request->input('consent_template_id'),
            'title' => $request->string('title'),
            'body' => $request->string('body'),
            'signature_image' => $request->input('signature_image'),
            'signed_by_name' => $request->string('signed_by_name'),
            'signed_at' => now(),
            'captured_by_user_id' => $request->user()?->id,
            'meta' => [
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ],
        ]);

        return response()->json(['data' => ConsentResource::make($consent)], 201);
    }

    public function show(Patient $patient, Consent $consent): JsonResponse
    {
        $this->authorize('viewClinical', $patient);
        abort_unless($consent->patient_id === $patient->id, 404);

        return response()->json(['data' => ConsentResource::make($consent)]);
    }

    public function destroy(Patient $patient, Consent $consent, Request $request): JsonResponse
    {
        abort_unless($request->user()?->hasRole(Role::Admin->value), 403);
        abort_unless($consent->patient_id === $patient->id, 404);

        $consent->delete();

        return response()->json(['message' => 'OK']);
    }
}
