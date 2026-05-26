<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Consent
 */
class ConsentResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'patient_id' => $this->patient_id,
            'consent_template_id' => $this->consent_template_id,
            'title' => $this->title,
            // body opcional al listar — pesa cuando son muchos. Solo lo mostramos en show().
            'body' => $this->when($request->routeIs('*.show', 'patients.show', 'consents.show'), $this->body),
            'has_signature' => ! empty($this->signature_image),
            'signature_image' => $this->when($request->routeIs('consents.show'), $this->signature_image),
            'signed_by_name' => $this->signed_by_name,
            'signed_at' => $this->signed_at?->toIso8601String(),
            'captured_by_user_id' => $this->captured_by_user_id,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
