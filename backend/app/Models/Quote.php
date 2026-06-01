<?php

declare(strict_types=1);

namespace App\Models;

use App\Casts\AppTimezoneDateTime;
use App\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable;

class Quote extends Model implements Auditable
{
    /** @use HasFactory<\Database\Factories\QuoteFactory> */
    use AuditableTrait, BelongsToTenant, HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'patient_id',
        'created_by_user_id',
        'code',
        'subtotal',
        'discount_total',
        'total',
        'status',
        'notes',
        'valid_until',
        'sent_at',
        'accepted_at',
        'rejected_at',
        'converted_at',
        'converted_charge_id',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'discount_total' => 'decimal:2',
            'total' => 'decimal:2',
            'valid_until' => 'date',
            'sent_at' => AppTimezoneDateTime::class,
            'accepted_at' => AppTimezoneDateTime::class,
            'rejected_at' => AppTimezoneDateTime::class,
            'converted_at' => AppTimezoneDateTime::class,
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(QuoteItem::class);
    }

    public function convertedCharge(): BelongsTo
    {
        return $this->belongsTo(Charge::class, 'converted_charge_id');
    }

    /**
     * Recalcula subtotal, descuentos y total a partir de los items. No
     * altera el `status` — ese se mueve explícitamente desde el controller.
     */
    public function recomputeTotals(): void
    {
        $items = $this->items()->get();
        $subtotal = (float) $items->sum(fn ($i) => (float) $i->unit_price * (int) $i->quantity);
        $discount = (float) $items->sum('discount_amount');

        $this->subtotal = $subtotal;
        $this->discount_total = $discount;
        $this->total = round($subtotal - $discount, 2);
    }

    /**
     * Una cotización se puede editar mientras no se haya convertido en
     * cobro ni rechazado. Aceptada y enviada siguen siendo editables.
     */
    public function isEditable(): bool
    {
        return ! in_array($this->status, ['converted', 'rejected'], true);
    }
}
