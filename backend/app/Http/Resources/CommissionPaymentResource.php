<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\CommissionPayment
 */
class CommissionPaymentResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'specialist_id' => $this->specialist_id,
            'specialist_name' => $this->whenLoaded('specialist',
                fn () => $this->specialist?->name),
            'paid_at' => $this->paid_at?->toIso8601String(),
            'amount' => (float) $this->amount,
            'method' => $this->method,
            'reference' => $this->reference,
            'notes' => $this->notes,
            'cash_session_id' => $this->cash_session_id,
            'cash_expense_id' => $this->cash_expense_id,
            'created_by_user_id' => $this->created_by_user_id,
            'created_by_name' => $this->whenLoaded('createdBy',
                fn () => $this->createdBy?->name),
            'items' => $this->whenLoaded('items', function () {
                return $this->items->map(fn ($i) => [
                    'id' => $i->id,
                    'charge_id' => $i->charge_id,
                    'charge_code' => $i->charge?->code,
                    'treatment_name' => $i->treatment_name,
                    'patient_name' => $i->charge?->patient?->full_name,
                    'commission_amount' => (float) $i->commission_amount,
                    'commission_base' => $i->commission_base ?? 'price',
                    'commission_cost' => (float) $i->commission_cost,
                    'commission_base_amount' => ($i->commission_base ?? 'price') === 'profit'
                        ? round((float) $i->line_total - (float) $i->commission_cost * (int) $i->quantity, 2)
                        : (float) $i->line_total,
                    'line_total' => (float) $i->line_total,
                    'charge_date' => $i->charge?->created_at?->toIso8601String(),
                ]);
            }),
            'items_count' => $this->whenCounted('items'),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
