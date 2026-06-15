<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Resources\ConsentTemplateResource;
use App\Models\ConsentTemplate;
use App\Support\Permissions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Validation\Rule;

class ConsentTemplatesController extends Controller implements HasMiddleware
{
    /** @return array<int, Middleware|string> */
    public static function middleware(): array
    {
        return ['auth:sanctum'];
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $templates = ConsentTemplate::query()
            ->when($request->boolean('only_active', true), fn ($q) => $q->where('active', true))
            ->orderBy('title')
            ->get();

        return ConsentTemplateResource::collection($templates);
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()?->can(Permissions::CATALOGS_MANAGE), 403);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string', 'max:50000'],
            'treatment_type' => ['nullable', 'string', 'max:120'],
            'active' => ['sometimes', 'boolean'],
        ]);

        $template = ConsentTemplate::query()->create($data);

        return response()->json(['data' => ConsentTemplateResource::make($template)], 201);
    }

    public function update(Request $request, ConsentTemplate $template): JsonResponse
    {
        abort_unless($request->user()?->can(Permissions::CATALOGS_MANAGE), 403);

        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'body' => ['sometimes', 'required', 'string', 'max:50000'],
            'treatment_type' => ['nullable', 'string', 'max:120'],
            'active' => ['sometimes', 'boolean'],
        ]);

        $template->update($data);

        return response()->json(['data' => ConsentTemplateResource::make($template)]);
    }

    public function destroy(Request $request, ConsentTemplate $template): JsonResponse
    {
        $this->requireAdmin();
        $template->delete();

        return response()->json(['message' => 'OK']);
    }
}
