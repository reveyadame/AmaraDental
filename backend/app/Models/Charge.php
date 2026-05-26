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

class Charge extends Model implements Auditable
{
    /** @use HasFactory<\Database\Factories\ChargeFactory> */
    use AuditableTrait, BelongsToTenant, HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'patient_id',
        'created_by_user_id',
        'code',
        'subtotal',
        'discount_total',
        'total',
        'paid_total',
        'balance',
        'status',
        'notes',
        'paid_at',
        'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'discount_total' => 'decimal:2',
            'total' => 'decimal:2',
            'paid_total' => 'decimal:2',
            'balance' => 'decimal:2',
            'paid_at' => AppTimezoneDateTime::class,
            'cancelled_at' => AppTimezoneDateTime::class,
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
        return $this->hasMany(ChargeItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(ChargePayment::class);
    }

    /**
     * Recalcula totales en base a items y pagos. Actualiza status en función
     * del balance pero respeta `cancelled`.
     */
    public function recomputeTotals(): void
    {
        $items = $this->items()->get();
        $subtotal = (float) $items->sum(fn ($i) => (float) $i->unit_price * (int) $i->quantity);
        $discount = (float) $items->sum('discount_amount');
        $total = round($subtotal - $discount, 2);

        $paid = (float) $this->payments()->sum('amount');
        $balance = round($total - $paid, 2);

        $this->subtotal = $subtotal;
        $this->discount_total = $discount;
        $this->total = $total;
        $this->paid_total = $paid;
        $this->balance = max(0, $balance);

        if ($this->status === 'cancelled') {
            return;
        }

        if ($balance <= 0.001) {
            $this->status = 'paid';
            $this->paid_at = $this->paid_at ?? now();
        } elseif ($paid > 0) {
            $this->status = 'partial';
        } else {
            $this->status = 'pending';
        }
    }
}
