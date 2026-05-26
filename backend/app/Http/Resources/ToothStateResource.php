<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\ToothState;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\ToothState
 */
class ToothStateResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'tooth_number' => $this->tooth_number,
            'dentition_type' => $this->dentition_type,
            'whole_state' => $this->whole_state,
            'faces' => $this->faces ?? ToothState::defaultFaces(),
            'notes' => $this->notes,
            'updated_at' => $this->updated_at?->toIso8601String(),
            'updated_by_user_id' => $this->updated_by_user_id,
            'updated_by_name' => $this->whenLoaded('updatedBy', fn () => $this->updatedBy?->name),
        ];
    }
}
