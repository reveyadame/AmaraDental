<?php

declare(strict_types=1);

namespace App\Models;

use App\Casts\AppTimezoneDateTime;
use App\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable;

class ChargePayment extends Model implements Auditable
{
    /** @use HasFactory<\Database\Factories\ChargePaymentFactory> */
    use AuditableTrait, BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'charge_id',
        'cash_session_id',
        'user_id',
        'method',
        'amount',
        'paid_at',
        'reference',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'paid_at' => AppTimezoneDateTime::class,
        ];
    }

    public function charge(): BelongsTo
    {
        return $this->belongsTo(Charge::class);
    }

    public function cashSession(): BelongsTo
    {
        return $this->belongsTo(CashSession::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
