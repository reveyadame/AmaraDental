<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\QuoteItem
 */
class QuoteItemResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'treatment_id' => $this->treatment_id,
            'treatment_name' => $this->treatment_name,
            'treatment_code' => $this->treatment_code,
            'specialist_id' => $this->specialist_id,
            'specialist_name' => $this->specialist_name,
            'quantity' => $this->quantity,
            'unit_price' => (float) $this->unit_price,
            'discount_id' => $this->discount_id,
            'discount_amount' => (float) $this->discount_amount,
            'line_total' => (float) $this->line_total,
        ];
    }
}
