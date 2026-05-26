<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\CashSession
 */
class CashSessionResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $paymentsSummary = $this->whenLoaded('payments', function () {
            return [
                'count' => $this->payments->count(),
                'total' => round((float) $this->payments->sum('amount'), 2),
                'by_method' => $this->payments
                    ->groupBy('method')
                    ->map(fn ($items) => round((float) $items->sum('amount'), 2)),
            ];
        });

        $expensesSummary = $this->whenLoaded('expenses', function () {
            return [
                'count' => $this->expenses->count(),
                'total' => round((float) $this->expenses->sum('amount'), 2),
                'by_method' => $this->expenses
                    ->groupBy('method')
                    ->map(fn ($items) => round((float) $items->sum('amount'), 2)),
                'by_category' => $this->expenses
                    ->groupBy('category')
                    ->map(fn ($items) => round((float) $items->sum('amount'), 2)),
            ];
        });

        return [
            'id' => $this->id,
            'status' => $this->status,
            'opened_at' => $this->opened_at?->toIso8601String(),
            'closed_at' => $this->closed_at?->toIso8601String(),
            'opening_amount' => (float) $this->opening_amount,
            // Efectivo (legacy fields siguen siendo cash)
            'closing_amount' => $this->closing_amount !== null
                ? (float) $this->closing_amount : null,
            'expected_cash' => $this->expected_cash !== null
                ? (float) $this->expected_cash : null,
            'difference' => $this->difference !== null
                ? (float) $this->difference : null,
            // Tarjeta
            'card_counted' => $this->card_counted !== null
                ? (float) $this->card_counted : null,
            'card_expected' => $this->card_expected !== null
                ? (float) $this->card_expected : null,
            'card_difference' => $this->card_difference !== null
                ? (float) $this->card_difference : null,
            // Transferencia
            'transfer_counted' => $this->transfer_counted !== null
                ? (float) $this->transfer_counted : null,
            'transfer_expected' => $this->transfer_expected !== null
                ? (float) $this->transfer_expected : null,
            'transfer_difference' => $this->transfer_difference !== null
                ? (float) $this->transfer_difference : null,

            'notes' => $this->notes,
            'close_notes' => $this->close_notes,
            'user_id' => $this->user_id,
            'user_name' => $this->whenLoaded('user', fn () => $this->user->name),
            'opened_by_name' => $this->whenLoaded('user', fn () => $this->user?->name),
            'closed_by_user_id' => $this->closed_by_user_id,
            'closed_by_name' => $this->whenLoaded('closedBy', fn () => $this->closedBy?->name),
            'payments_summary' => $paymentsSummary,
            'payments' => ChargePaymentResource::collection($this->whenLoaded('payments')),
            'expenses_summary' => $expensesSummary,
            'expenses' => CashExpenseResource::collection($this->whenLoaded('expenses')),
        ];
    }
}
