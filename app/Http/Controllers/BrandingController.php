<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Branding\UpdateBrandingRequest;
use App\Http\Resources\BrandingResource;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;

class BrandingController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json([
            'data' => BrandingResource::make(TenantContext::tenant()),
        ]);
    }

    public function update(UpdateBrandingRequest $request): JsonResponse
    {
        $tenant = TenantContext::tenant();
        $tenant->fill($request->validated())->save();

        return response()->json([
            'data' => BrandingResource::make($tenant),
        ]);
    }
}
