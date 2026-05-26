<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\PrescriptionTemplate
 */
class PrescriptionTemplateResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'category' => $this->category,
            'description' => $this->description,
            'active' => $this->active,
            'created_by_user_id' => $this->created_by_user_id,
            'created_by_name' => $this->whenLoaded('createdBy', fn () => $this->createdBy?->name),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($it) => [
                'id' => $it->id,
                'medication' => $it->medication,
                'presentation' => $it->presentation,
                'dosage' => $it->dosage,
                'route' => $it->route,
                'frequency' => $it->frequency,
                'duration' => $it->duration,
                'instructions' => $it->instructions,
                'order_index' => $it->order_index,
            ])),
            'items_count' => $this->whenLoaded('items', fn () => $this->items->count()),
        ];
    }
}
