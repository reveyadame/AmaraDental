<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\ConsentTemplate
 */
class ConsentTemplateResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'body' => $this->body,
            'treatment_type' => $this->treatment_type,
            'active' => $this->active,
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
